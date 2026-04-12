<?php

namespace App\Events;

use App\Models\Invoice;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event für PDF-Generierung abgeschlossen
 * Wird über WebSocket gesendet um User zu notifizieren
 */
class InvoicePdfGenerated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Invoice $invoice) {}

    /**
     * Broadcast to private channel
     */
    public function broadcastOn()
    {
        return new PrivateChannel('user.' . $this->invoice->user->id);
    }

    /**
     * Event name for frontend
     */
    public function broadcastAs()
    {
        return 'invoice.pdf-generated';
    }

    /**
     * Data to broadcast
     */
    public function broadcastWith()
    {
        return [
            'invoice_id' => $this->invoice->id,
            'pdf_path' => $this->invoice->pdf_path,
            'message' => 'PDF wurde erfolgreich generiert',
        ];
    }
}
