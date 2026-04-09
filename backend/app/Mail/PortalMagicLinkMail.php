<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PortalMagicLinkMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly mixed $user,
        public readonly string $magicLink,
        public readonly string $companyName,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Ihr Sicherheitscode - ' . $this->companyName);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.portal-magic-link');
    }
}
