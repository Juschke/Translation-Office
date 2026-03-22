<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Project;
use App\Models\ProjectFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;

class GuestProjectController extends Controller
{
    public function show(string $token)
    {
        $project = Project::with(['messages.user', 'messages.file', 'files.uploader', 'sourceLanguage', 'targetLanguage', 'customer', 'partner', 'tenant', 'positions'])
            ->where('access_token', $token)
            ->orWhere('partner_access_token', $token)
            ->firstOrFail();

        $role = $project->partner_access_token === $token ? 'partner' : 'customer';

        // Filter files based on sharing permissions
        $filteredFiles = $project->files->filter(function ($file) use ($role) {
            if ($role === 'customer') {
                return $file->is_shared_with_customer;
            }
            return $file->is_shared_with_partner;
        })->values();

        return response()->json([
            'role' => $role,
            'id' => $project->id,
            'project_name' => $project->project_name,
            'project_number' => $project->project_number,
            'status' => $project->status,
            'deadline' => $project->deadline,
            'created_at' => $project->created_at,
            'description' => $project->description,
            'source_lang' => $project->sourceLanguage,
            'target_lang' => $project->targetLanguage,
            'customer' => $project->customer,
            'partner' => $project->partner,
            'files' => $filteredFiles,
            'positions' => $project->positions,
            'price_total' => $project->price_total,
            'currency' => $project->currency,
            'vat_rate' => 19,
            'tenant' => $project->tenant ? $project->tenant->only([
                'company_name',
                'address_street',
                'address_house_no',
                'address_zip',
                'address_city',
                'bank_name',
                'bank_iban',
                'bank_bic',
                'vat_id',
                'tax_number',
                'email',
                'phone'
            ]) : null,
            'messages' => $project->messages->map(function ($msg) {
                return [
                    'id' => $msg->id,
                    'content' => $msg->content,
                    'created_at' => $msg->created_at,
                    'sender_name' => $msg->user ? $msg->user->name : ($msg->sender_name ?: 'Guest'),
                    'user_id' => $msg->user_id, // Pass user_id to distinguish sender
                    'is_me' => false,
                    'file' => $msg->file ? [
                        'id' => $msg->file->id,
                        'original_name' => $msg->file->original_name,
                        'file_size' => $msg->file->file_size,
                        'extension' => $msg->file->extension,
                        'mime_type' => $msg->file->mime_type,
                    ] : null,
                ];
            }),
            'project' => $project // Add full project object for status updates
        ]);
    }

    public function markAsDone(Request $request, string $token)
    {
        $project = $this->findByToken($token);

        // When a partner marks as done, we usually set to 'ready_for_pickup' OR 'delivered'
        // For this workflow, let's use 'ready_for_pickup' so PM can review
        $project->status = 'ready_for_pickup';
        $project->save();

        return response()->json([
            'message' => 'Projekt als erledigt markiert',
            'status' => $project->status
        ]);
    }

    public function message(Request $request, string $token)
    {
        $project = $this->findByToken($token);

        $request->validate([
            'content' => 'required|string|max:5000',
            'sender_name' => 'nullable|string|max:255',
            'project_file_id' => 'nullable|exists:project_files,id'
        ]);

        $role = $project->partner_access_token === $token ? 'partner' : 'customer';

        $message = $project->messages()->create([
            'content' => $request->input('content'),
            'type' => $role, // Set message type based on guest role
            'sender_name' => $request->sender_name ?: 'Guest',
            'project_file_id' => $request->input('project_file_id'),
            'user_id' => null
        ]);

        return response()->json($message->load('file'), 201);
    }

    public function upload(Request $request, string $token)
    {
        $project = $this->findByToken($token);

        $request->validate([
            'file' => 'required|file|max:20480|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,rtf,odt,ods,csv,jpg,jpeg,png,gif,zip',
            'type' => 'nullable|string|in:original,reference,target,translation,final,proofread'
        ]);

        $role = $project->partner_access_token === $token ? 'partner' : 'customer';
        $fileType = $request->input('type');

        if (!$fileType) {
            $fileType = $role === 'partner' ? 'target' : 'original';
        }

        $file = $request->file('file');
        $fileName = $file->getClientOriginalName();
        // Assuming public disk for now
        $path = $file->store("projects/{$project->id}/files", 'public');

        $projectFile = new ProjectFile();
        $projectFile->project_id = $project->id;
        $projectFile->tenant_id = $project->tenant_id;
        $projectFile->original_name = $fileName;
        $projectFile->file_name = basename($path);
        $projectFile->path = $path;
        $projectFile->file_size = $file->getSize(); // Bytes
        $projectFile->extension = $file->getClientOriginalExtension();
        $projectFile->mime_type = $file->getMimeType();
        $projectFile->type = $fileType;
        $projectFile->uploaded_by = null;
        $projectFile->save();

        return response()->json($projectFile, 201);
    }
    public function update(Request $request, string $token)
    {
        $project = $this->findByToken($token);

        $validated = $request->validate([
            'customer' => 'required|array',
            'customer.company_name' => 'nullable|string|max:255',
            'customer.first_name' => 'nullable|string|max:255',
            'customer.last_name' => 'nullable|string|max:255',
            'customer.email' => 'nullable|email|max:255',
            'customer.phone' => 'nullable|string|max:50',
            'customer.address_street' => 'nullable|string|max:255',
            'customer.address_house_no' => 'nullable|string|max:20',
            'customer.address_zip' => 'nullable|string|max:20',
            'customer.address_city' => 'nullable|string|max:100',
        ]);

        if ($project->customer && isset($validated['customer'])) {
            $project->customer->update($validated['customer']);
        }

        return response()->json($project->load('customer'));
    }
    public function downloadFile(string $token, ProjectFile $file)
    {
        $project = $this->findByToken($token);

        // Validate file belongs to project
        if ($file->project_id !== $project->id) {
            abort(403, 'File does not belong to this project');
        }

        // Check sharing permission based on role
        $role = $project->partner_access_token === $token ? 'partner' : 'customer';

        if ($role === 'customer' && !$file->is_shared_with_customer) {
            abort(403, 'File not shared with customer');
        }

        if ($role === 'partner' && !$file->is_shared_with_partner) {
            abort(403, 'File not shared with partner');
        }

        // Check if file exists
        if (!Storage::disk('public')->exists($file->path)) {
            abort(404, 'File not found');
        }

        // Security: Path traversal protection
        $normalizedPath = str_replace('\\', '/', $file->path);

        if (!str_starts_with($normalizedPath, 'projects/') &&
            !str_starts_with($normalizedPath, 'project_files/')) {
            \Log::warning('Invalid file path attempted by guest', [
                'path' => $file->path,
                'file_id' => $file->id,
                'token' => substr($token, 0, 10) . '...'
            ]);
            abort(403, 'Invalid file path');
        }

        if (str_contains($normalizedPath, '..')) {
            \Log::warning('Path traversal detected by guest', [
                'path' => $file->path,
                'file_id' => $file->id
            ]);
            abort(403, 'Path traversal detected');
        }

        // Log successful download for audit trail
        \Log::info('Guest file downloaded', [
            'file_id' => $file->id,
            'project_id' => $project->id,
            'role' => $role,
            'ip' => request()->ip()
        ]);

        return Storage::disk('public')->download($file->path, $file->original_name);
    }

    public function downloadAvv($token)
    {
        $project = $this->findByToken($token);
        $pdf = Pdf::loadView('pdf.avv', compact('project'));
        return $pdf->download('AVV-Vertrag.pdf');
    }

    private function findByToken(string $token)
    {
        return Project::where('access_token', $token)
            ->orWhere('partner_access_token', $token)
            ->firstOrFail();
    }
}
