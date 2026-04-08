<?php

namespace App\Http\Controllers\Api\Portal;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectFile;
use Illuminate\Http\Request;

class PortalRequestController extends Controller
{
    public function store(Request $request)
    {
        $c = $request->attributes->get('portal_customer');

        $data = $request->validate([
            'project_name'    => 'required|string|max:200',
            'source_language' => 'required|string|max:100',
            'target_language' => 'required|string|max:100',
            'deadline'        => 'nullable|date',
            'notes'           => 'nullable|string|max:2000',
            'files.*'         => 'nullable|file|max:20480',
        ]);

        // Build notes with language info since portal uses free-text languages
        $langNote = "Quellsprache: {$data['source_language']}, Zielsprache: {$data['target_language']}";
        $combinedNotes = $langNote . (isset($data['notes']) && $data['notes'] ? "\n\n" . $data['notes'] : '');

        // Bypass BelongsToTenant auto-set (no Sanctum user in session)
        // tenant_id is taken directly from the authenticated portal customer
        $project = Project::withoutGlobalScopes()->create([
            'project_name' => $data['project_name'],
            'notes'        => $combinedNotes,
            'deadline'     => $data['deadline'] ?? null,
            'status'       => 'draft',
            'customer_id'  => $c->id,
            'tenant_id'    => $c->tenant_id,
        ]);

        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $path = $file->store('project-files/' . $project->id, 'public');
                ProjectFile::withoutGlobalScopes()->create([
                    'project_id'   => $project->id,
                    'tenant_id'    => $c->tenant_id,
                    'original_name' => $file->getClientOriginalName(),
                    'path'         => $path,
                    'file_size'    => $file->getSize(),
                    'mime_type'    => $file->getMimeType(),
                    'extension'    => $file->getClientOriginalExtension(),
                    'uploaded_by'  => 'portal:' . $c->id,
                    'type'         => 'source',
                ]);
            }
        }

        return response()->json(
            $project->load(['sourceLanguage', 'targetLanguage', 'files']),
            201
        );
    }
}
