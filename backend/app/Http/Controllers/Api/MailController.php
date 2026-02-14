<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Mail;
use Carbon\Carbon;

class MailController extends Controller
{
    public function index(Request $request)
    {
        $folder = $request->query('folder', 'inbox');
        $mails = Mail::where('folder', $folder)
            ->latest()
            ->get()
            ->map(function ($mail) {
                return [
                    'id' => $mail->id,
                    'from' => $mail->from_email,
                    'subject' => $mail->subject,
                    'body' => $mail->body,
                    'preview' => substr(strip_tags($mail->body), 0, 100) . '...',
                    'time' => $mail->created_at->diffForHumans(),
                    'full_time' => $mail->created_at->format('d.m.Y H:i'),
                    'read' => $mail->is_read,
                    'attachments' => $mail->attachments ?? []
                ];
            });

        return response()->json($mails);
    }

    public function send(Request $request)
    {
        $validated = $request->validate([
            'mail_account_id' => 'required|exists:mail_accounts,id',
            'to' => 'required|string',
            'cc' => 'nullable|string',
            'subject' => 'nullable|string',
            'body' => 'nullable|string',
        ]);

        $account = \App\Models\MailAccount::findOrFail($validated['mail_account_id']);

        $attachments = [];
        $email = (new \Symfony\Component\Mime\Email())
            ->from($account->email)
            ->to(...array_map('trim', explode(',', $validated['to'])))
            ->subject($validated['subject'] ?? '(Kein Betreff)')
            ->html($validated['body']);

        if ($validated['cc']) {
            $email->cc(...array_map('trim', explode(',', $validated['cc'])));
        }

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('mail_attachments');
                $attachments[] = [
                    'name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'size' => $file->getSize(),
                    'mime' => $file->getMimeType()
                ];
                $email->attachFromPath(storage_path('app/' . $path), $file->getClientOriginalName());
            }
        }

        // Send the email
        try {
            // Use smtps:// for SSL (port 465), smtp:// for TLS/STARTTLS (port 587)
            $scheme = ((int) $account->port === 465 || ($account->encryption ?? 'ssl') === 'ssl') ? 'smtps' : 'smtp';
            $transport = \Symfony\Component\Mailer\Transport::fromDsn(sprintf(
                '%s://%s:%s@%s:%s',
                $scheme,
                urlencode($account->username),
                urlencode($account->password),
                $account->host,
                $account->port
            ));

            $mailer = new \Symfony\Component\Mailer\Mailer($transport);
            $mailer->send($email);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Fehler beim Senden: ' . $e->getMessage()], 500);
        }

        $mail = Mail::create([
            'tenant_id' => $request->user()->tenant_id ?? 1,
            'mail_account_id' => $validated['mail_account_id'],
            'folder' => 'sent',
            'from_email' => $account->email,
            'to_emails' => array_map('trim', explode(',', $validated['to'])),
            'cc_emails' => $validated['cc'] ? array_map('trim', explode(',', $validated['cc'])) : [],
            'subject' => $validated['subject'] ?? '(Kein Betreff)',
            'body' => $validated['body'],
            'is_read' => true,
            'attachments' => $attachments
        ]);

        return response()->json($mail, 201);
    }

    public function markAsRead($id)
    {
        $mail = Mail::findOrFail($id);
        $mail->update(['is_read' => true]);
        return response()->json(['message' => 'Marked as read']);
    }

    public function destroy($id)
    {
        $mail = Mail::findOrFail($id);

        if ($mail->folder === 'trash') {
            $mail->forceDelete();
        } else {
            $mail->update(['folder' => 'trash']);
            $mail->delete(); // Soft delete
        }

        return response()->json(['message' => 'Mail deleted']);
    }
    public function sync(Request $request)
    {
        $tenantId = $request->user()->tenant_id ?? 1;

        // Fetch Mail Settings
        $settings = \App\Models\TenantSetting::where('tenant_id', $tenantId)
            ->whereIn('key', ['mail_host', 'mail_port', 'mail_username', 'mail_password', 'mail_encryption'])
            ->pluck('value', 'key');

        if (!$settings->has('mail_host') || !$settings->has('mail_username') || !$settings->has('mail_password')) {
            return response()->json(['message' => 'Bitte konfigurieren Sie zuerst Ihre Mail-Einstellungen (Host, Benutzer, Passwort).'], 400);
        }

        // IMAP port is derived from encryption: SSL uses 993, TLS/none uses 143
        $encryption = $settings['mail_encryption'] ?? 'ssl';
        $port = ($encryption === 'ssl') ? 993 : 143;

        try {
            // Configure IMAP Client on the fly
            $client = \Webklex\IMAP\Facades\Client::make([
                'host' => $settings['mail_host'],
                'port' => $port,
                'encryption' => $settings['mail_encryption'] ?? 'ssl',
                'validate_cert' => false,
                'username' => $settings['mail_username'],
                'password' => $settings['mail_password'],
                'protocol' => 'imap'
            ]);

            // Connect to the server
            $client->connect();

            // Get INBOX folder
            $folder = $client->getFolder('INBOX');

            // Fetch the latest 50 messages
            $messages = $folder->query()->all()->limit(50)->get();

            $createdCount = 0;
            foreach ($messages as $message) {
                $messageId = $message->getMessageId()->get()[0] ?? $message->getUid();

                if (Mail::where('tenant_id', $tenantId)->where('message_id', $messageId)->exists()) {
                    continue;
                }

                $attachmentsInfo = [];
                if ($message->getAttachments()->count() > 0) {
                    foreach ($message->getAttachments() as $attachment) {
                        $attachmentsInfo[] = [
                            'name' => $attachment->getName(),
                            'size' => $attachment->getSize(),
                            'extension' => $attachment->getExtension()
                        ];
                    }
                }

                Mail::create([
                    'tenant_id' => $tenantId,
                    'message_id' => $messageId,
                    'folder' => 'inbox',
                    'from_email' => $message->getFrom()[0]->mail,
                    'to_emails' => array_map(fn($to) => $to->mail, $message->getTo()->toArray()),
                    'subject' => $message->getSubject()->get()[0] ?? '(Kein Betreff)',
                    'body' => $message->hasHTMLBody() ? $message->getHTMLBody() : $message->getTextBody(),
                    'is_read' => $message->getFlags()->has('seen'),
                    'attachments' => $attachmentsInfo
                ]);
                $createdCount++;
            }

            return response()->json([
                'message' => $createdCount > 0 ? "$createdCount neue E-Mails empfangen." : "Postfach ist auf dem neuesten Stand.",
                'new_count' => $createdCount
            ]);

        } catch (\Exception $e) {
            \Log::error("IMAP Sync Failed: " . $e->getMessage());

            return response()->json([
                'message' => 'Verbindung zum Mail-Server fehlgeschlagen: ' . $e->getMessage() . '. Bitte prüfen Sie Host, Port (993) und Passwort.'
            ], 500);
        }
    }
}
