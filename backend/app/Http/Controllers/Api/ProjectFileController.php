<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProjectFileController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $request->validate([
            'file' => 'required|file|max:51200', // 50MB
            'type' => 'required|in:source,target',
        ]);

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        // Generate a safe filename
        $filename = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $originalName);

        // Store in storage/app/public/project_files/{project_id}
        $path = $file->storeAs("project_files/{$project->id}", $filename, 'public');

        // Estimate word count (simplified, real implementation would use a service)
        $wordCount = 0;
        // if ($file->getMimeType() === 'text/plain') ...

        $projectFile = $project->files()->create([
            'path' => $path,
            'original_name' => $originalName,
            'type' => $request->type,
            'word_count' => $wordCount,
        ]);

        return response()->json($projectFile, 201);
    }

    public function destroy(Project $project, ProjectFile $file)
    {
        // Ensure file belongs to project
        if ($file->project_id !== $project->id) {
            abort(403, 'File does not belong to this project');
        }

        // Delete from storage
        Storage::disk('public')->delete($file->path);

        // Delete record
        $file->delete();

        return response()->json(['message' => 'File deleted']);
    }

    public function download(Project $project, ProjectFile $file)
    {
        if ($file->project_id !== $project->id) {
            abort(403);
        }

        if (!Storage::disk('public')->exists($file->path)) {
            abort(404);
        }

        return Storage::disk('public')->download($file->path, $file->original_name);
    }
}
