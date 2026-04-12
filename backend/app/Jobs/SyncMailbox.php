<?php

namespace App\Jobs;

use App\Models\MailAccount;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Async job für Mailbox-Sync via IMAP
 * Blockiert nicht den UI-Request
 */
class SyncMailbox implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300; // 5 minutes
    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(public MailAccount $mailAccount) {}

    public function handle()
    {
        try {
            $this->mailAccount->update([
                'is_syncing' => true,
                'last_sync_started_at' => now(),
            ]);

            Log::info('Starting mailbox sync', [
                'mail_account_id' => $this->mailAccount->id,
                'email' => $this->mailAccount->email,
            ]);

            // Sync unread messages from IMAP
            $messageCount = $this->syncMessages();

            $this->mailAccount->update([
                'last_synced_at' => now(),
                'is_syncing' => false,
                'sync_error' => null,
            ]);

            Log::info('Mailbox sync completed', [
                'mail_account_id' => $this->mailAccount->id,
                'message_count' => $messageCount,
            ]);

            // Dispatch event for real-time update
            \event(new \App\Events\MailboxSynced($this->mailAccount, $messageCount));

        } catch (\Exception $e) {
            Log::error('Mailbox sync failed', [
                'mail_account_id' => $this->mailAccount->id,
                'error' => $e->getMessage(),
            ]);

            $this->mailAccount->update([
                'is_syncing' => false,
                'sync_error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Sync messages from IMAP server
     */
    private function syncMessages(): int
    {
        // Implement IMAP sync logic here
        // This is a placeholder - actual implementation depends on your IMAP client

        try {
            // Example using webklex/laravel-imap
            $client = \App\Services\ImapService::connect($this->mailAccount);

            $messageCount = 0;
            $folder = $client->getFolder('INBOX');

            // Get unread messages
            $messages = $folder->search(['UNSEEN'])->get();

            foreach ($messages as $message) {
                $messageCount++;

                // Store message (if not already exists)
                \App\Models\Mail::firstOrCreate(
                    [
                        'mail_account_id' => $this->mailAccount->id,
                        'message_id' => $message->getMessageId(),
                    ],
                    [
                        'from' => $message->getFrom()[0]->mail ?? null,
                        'to' => $message->getTo()[0]->mail ?? null,
                        'cc' => json_encode($message->getCc()),
                        'subject' => $message->getSubject(),
                        'body' => $message->getTextBody() ?? $message->getHTMLBody(),
                        'received_at' => $message->getDate(),
                        'is_read' => false,
                        'raw_message' => $message->getRaw(),
                    ]
                );

                // Mark as read in IMAP
                $message->setFlag(['Seen']);
            }

            $client->close();
            return $messageCount;

        } catch (\Exception $e) {
            Log::error('IMAP sync error', [
                'account_id' => $this->mailAccount->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
