<?php

namespace App\Events;

use App\Models\Invoice;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentFailed implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Invoice $invoice,
        public string $errorMessage,
    ) {}

    public function broadcastOn()
    {
        return new PrivateChannel('tenant.' . $this->invoice->tenant_id);
    }

    public function broadcastAs()
    {
        return 'payment.failed';
    }

    public function broadcastWith()
    {
        return [
            'invoice_id' => $this->invoice->id,
            'amount' => $this->invoice->amount_gross,
            'currency' => $this->invoice->currency,
            'error' => $this->errorMessage,
            'message' => 'Zahlung fehlgeschlagen',
        ];
    }
}
