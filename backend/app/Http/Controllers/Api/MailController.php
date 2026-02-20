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
                    'to_emails' => $mail->to_emails,
                    'subject' => $mail->subject,
                    'body' => $mail->body,
                    'preview' => substr(strip_tags($mail->body), 0, 100) . '...',
                    'time' => ($mail->date ?? $mail->created_at)->diffForHumans(),
                    'full_time' => ($mail->date ?? $mail->created_at)->format('d.m.Y H:i'),
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
            ->html($validated['body'] ?? '');

        if (!empty($validated['cc'])) {
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
            $scheme = ((int) $account->smtp_port === 465 || ($account->smtp_encryption ?? 'ssl') === 'ssl') ? 'smtps' : 'smtp';
            $transport = \Symfony\Component\Mailer\Transport::fromDsn(sprintf(
                '%s://%s:%s@%s:%s',
                $scheme,
                urlencode($account->username),
                urlencode($account->password),
                $account->smtp_host,
                $account->smtp_port
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
            'date' => now(),
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

        // Fetch all active MailAccounts for the tenant
        $accounts = \App\Models\MailAccount::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->get();

        if ($accounts->isEmpty()) {
            return response()->json(['message' => 'Bitte konfigurieren Sie zuerst mindestens ein E-Mail-Konto.'], 400);
        }

        $totalCreated = 0;
        $errors = [];

        foreach ($accounts as $account) {
            $protocol = $account->incoming_protocol ?? 'imap';
            $encryption = $account->imap_encryption ?? 'ssl';
            $defaultPort = $protocol === 'pop3' ? ($encryption === 'ssl' ? 995 : 110) : ($encryption === 'ssl' ? 993 : 143);
            $port = $account->imap_port ?? $defaultPort;

            try {
                // Configure IMAP/POP3 Client on the fly
                $client = \Webklex\IMAP\Facades\Client::make([
                    'host' => $account->imap_host,
                    'port' => $port,
                    'encryption' => $encryption,
                    'validate_cert' => false,
                    'username' => $account->username,
                    'password' => $account->password,
                    'protocol' => $protocol
                ]);

                // Connect to the server
                $client->connect();

                // Get INBOX folder
                $folder = $client->getFolder('INBOX');

                // Fetch the latest 50 messages
                $messages = $folder->query()->all()->limit(50)->get();

                foreach ($messages as $message) {
                    $messageId = $message->getMessageId()->get()[0] ?? $message->getUid();

                    if (Mail::where('tenant_id', $tenantId)->where('mail_account_id', $account->id)->where('message_id', $messageId)->exists()) {
                        continue;
                    }

                    // For backward compatibility: if mail exists without mail_account_id, update and skip
                    if (Mail::where('tenant_id', $tenantId)->whereNull('mail_account_id')->where('message_id', $messageId)->exists()) {
                        Mail::where('tenant_id', $tenantId)->whereNull('mail_account_id')->where('message_id', $messageId)->update(['mail_account_id' => $account->id]);
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
                        'mail_account_id' => $account->id,
                        'message_id' => $messageId,
                        'folder' => 'inbox',
                        'from_email' => $message->getFrom()[0]->mail,
                        'to_emails' => array_map(fn($to) => $to->mail, $message->getTo()->toArray()),
                        'subject' => $message->getSubject()->get()[0] ?? '(Kein Betreff)',
                        'body' => $message->hasHTMLBody() ? $message->getHTMLBody() : $message->getTextBody(),
                        'is_read' => $message->getFlags()->has('seen'),
                        'date' => $message->getDate()->first(),
                        'attachments' => $attachmentsInfo
                    ]);
                    $totalCreated++;
                }

            } catch (\Exception $e) {
                \Log::error("IMAP Sync Failed for account {$account->email}: " . $e->getMessage());
                $errors[] = "Fehler bei {$account->email}: " . $e->getMessage();
            }
        }

        if (count($errors) > 0 && $totalCreated === 0) {
            return response()->json([
                'message' => 'Synchronisierung fehlgeschlagen.',
                'errors' => $errors
            ], 500);
        }

        return response()->json([
            'message' => $totalCreated > 0
                ? "$totalCreated neue E-Mails empfangen."
                : (count($errors) > 0 ? "Teilweise erfolgreich." : "Postfach ist auf dem neuesten Stand."),
            'new_count' => $totalCreated,
            'errors' => $errors
        ]);
    }
}
