<?php

namespace App\Mail;

use App\Models\Customer;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PortalMagicLinkMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Customer $customer,
        public readonly string $magicLink,
        public readonly string $companyName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Ihr Anmeldelink – ' . $this->companyName);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.portal-magic-link');
    }
}
