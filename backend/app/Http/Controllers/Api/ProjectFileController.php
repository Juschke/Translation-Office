<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProjectFileController extends Controller
{
    public function store(\App\Http\Requests\StoreProjectFileRequest $request, Project $project)
    {
        try {
            $file = $request->file('file');
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            $mimeType = $file->getMimeType();
            $fileSize = $file->getSize(); // in bytes
            
            // Security: Validate file extension matches mime type
            $allowedMimes = [
                'pdf' => ['application/pdf'],
                'doc' => ['application/msword'],
                'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                'txt' => ['text/plain'],
                'jpg' => ['image/jpeg'],
                'jpeg' => ['image/jpeg'],
                'png' => ['image/png'],
                'gif' => ['image/gif'],
                'svg' => ['image/svg+xml'],
                'xlsx' => ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
                'xls' => ['application/vnd.ms-excel'],
                'zip' => ['application/zip', 'application/x-zip-compressed'],
            ];

            if (isset($allowedMimes[$extension]) && !in_array($mimeType, $allowedMimes[$extension])) {
                return response()->json([
                    'message' => 'Dateityp stimmt nicht mit der Erweiterung überein. Möglicher Sicherheitsverstoß.'
                ], 422);
            }

            // TODO: Add virus scanning here in production
            // Example: ClamAV integration
            // if (!$this->scanForViruses($file)) {
            //     return response()->json(['message' => 'Datei enthält Malware'], 422);
            // }
            
            // Generate a safe, unique filename
            $safeBasename = pathinfo($originalName, PATHINFO_FILENAME);
            $safeBasename = preg_replace('/[^a-zA-Z0-9_-]/', '_', $safeBasename);
            $filename = time() . '_' . $safeBasename . '.' . $extension;

            // Store in storage/app/public/project_files/{project_id}
            $path = $file->storeAs("project_files/{$project->id}", $filename, 'public');

            // Estimate word count (simplified, real implementation would use a service)
            $wordCount = 0;
            $charCount = 0;
            
            // For text-based files, try to count words/chars
            if (in_array($mimeType, ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])) {
                try {
                    if ($mimeType === 'text/plain') {
                        $content = file_get_contents($file->getRealPath());
                        // Security: Limit content size for processing
                        if (strlen($content) < 10 * 1024 * 1024) { // 10MB limit for text processing
                            $wordCount = str_word_count($content);
                            $charCount = mb_strlen($content);
                        }
                    }
                    // For other formats, you would use specialized libraries
                    // e.g., PhpWord for DOCX, Smalot\PdfParser for PDF
                } catch (\Exception $e) {
                    \Log::warning('Word count failed for file: ' . $originalName, ['error' => $e->getMessage()]);
                }
            }

            // Check for existing file with same name and type to handle versioning
            $existingFile = ProjectFile::where('project_id', $project->id)
                ->where('original_name', $originalName)
                ->where('type', $request->type)
                ->orderByRaw('CAST(version AS DECIMAL(10,1)) DESC')
                ->first();

            $version = '1.0';
            if ($existingFile) {
                $currentVersion = (float) $existingFile->version;
                $version = number_format($currentVersion + 1.0, 1, '.', '');
            }

            $projectFile = $project->files()->create([
                'path' => $path,
                'original_name' => $originalName,
                'file_name' => $originalName,
                'mime_type' => $mimeType,
                'extension' => $extension,
                'file_size' => $fileSize,
                'type' => $request->type,
                'word_count' => $wordCount,
                'char_count' => $charCount,
                'version' => $version,
                'status' => 'ready',
                'uploaded_by' => $request->user()->id,
            ]);

            return response()->json($projectFile->load('uploader'), 201);
        } catch (\Exception $e) {
            \Log::error('File upload failed', [
                'project_id' => $project->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Datei-Upload fehlgeschlagen. Bitte versuchen Sie es erneut.'
            ], 500);
        }
    }

    public function destroy(Project $project, ProjectFile $file)
    {
        // Ensure file belongs to project
        if ($file->project_id !== $project->id) {
            abort(403, 'File does not belong to this project');
        }

        // Ensure user has access to this project (tenant isolation)
        if ($project->tenant_id !== request()->user()->tenant_id) {
            abort(403, 'Unauthorized access to project');
        }

        try {
            // Delete from storage
            if (Storage::disk('public')->exists($file->path)) {
                Storage::disk('public')->delete($file->path);
            }

            // Delete record
            $file->delete();

            return response()->json(['message' => 'File deleted successfully']);
        } catch (\Exception $e) {
            \Log::error('File deletion failed', [
                'file_id' => $file->id,
                'project_id' => $project->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'message' => 'Datei konnte nicht gelöscht werden.'
            ], 500);
        }
    }

    public function download(Project $project, ProjectFile $file)
    {
        // Ensure file belongs to project
        if ($file->project_id !== $project->id) {
            abort(403, 'File does not belong to this project');
        }

        // Ensure user has access to this project (tenant isolation)
        if ($project->tenant_id !== request()->user()->tenant_id) {
            abort(403, 'Unauthorized access to project');
        }

        if (!Storage::disk('public')->exists($file->path)) {
            abort(404, 'File not found on disk');
        }

        try {
            // Security: Prevent path traversal attacks
            $realPath = Storage::disk('public')->path($file->path);
            $basePath = Storage::disk('public')->path('project_files');
            
            if (strpos(realpath($realPath), realpath($basePath)) !== 0) {
                abort(403, 'Invalid file path');
            }

            return Storage::disk('public')->download($file->path, $file->original_name);
        } catch (\Exception $e) {
            \Log::error('File download failed', [
                'file_id' => $file->id,
                'project_id' => $project->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'message' => 'Datei konnte nicht heruntergeladen werden.'
            ], 500);
        }
    }
}
