<x-mail::message>
    # Einladung zum Projekt: {{ $project->project_name }}

    Sie wurden eingeladen, an dem Projekt **{{ $project->project_number ?? $project->id }}** teilzunehmen.

    @if($personalMessage)
        **Nachricht:**
        {{ $personalMessage }}
    @endif

    Über den folgenden Button erhalten Sie direkten Zugriff auf das Projektportal, wo Sie Nachrichten austauschen und
    Dateien hochladen können.

    <x-mail::button :url="$inviteUrl">
        Projekt öffnen
    </x-mail::button>

    Falls Sie Fragen haben, antworten Sie einfach auf diese E-Mail.

    Vielen Dank,<br>
    {{ $project->tenant->company_name ?? config('app.name') }}
</x-mail::message>