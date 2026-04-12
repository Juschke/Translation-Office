<?php

namespace App\Events;

use App\Models\Invoice;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DunningReminderSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Invoice $invoice,
        public int $reminderLevel,
    ) {}

    public function broadcastOn()
    {
        return new PrivateChannel('tenant.' . $this->invoice->tenant_id);
    }

    public function broadcastAs()
    {
        return 'dunning.reminder-sent';
    }

    public function broadcastWith()
    {
        return [
            'invoice_id' => $this->invoice->id,
            'invoice_number' => $this->invoice->invoice_number,
            'reminder_level' => $this->reminderLevel,
            'customer_name' => $this->invoice->snapshot_customer_name,
            'amount' => $this->invoice->amount_gross / 100,
            'message' => "Mahnung Stufe $this->reminderLevel versendet",
        ];
    }
}
