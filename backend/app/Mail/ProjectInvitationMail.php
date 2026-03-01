<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ProjectInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $project;
    public $inviteUrl;
    public $personalMessage;

    /**
     * Create a new message instance.
     */
    public function __construct($project, $inviteUrl, $personalMessage = null)
    {
        $this->project = $project;
        $this->inviteUrl = $inviteUrl;
        $this->personalMessage = $personalMessage;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Einladung zum Projekt: ' . ($this->project->project_name ?? $this->project->id),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.project_invitation',
            with: [
                'project' => $this->project,
                'inviteUrl' => $this->inviteUrl,
                'personalMessage' => $this->personalMessage,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
