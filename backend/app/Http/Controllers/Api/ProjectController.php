<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use LaravelDaily\Invoices\Invoice;
use LaravelDaily\Invoices\Classes\Buyer;
use LaravelDaily\Invoices\Classes\InvoiceItem;

class ProjectController extends Controller
{
    public function analyze(Request $request, \App\Services\WordCountService $wordCounter)
    {
        $request->validate([
            'file' => 'required|file|mimes:txt,docx,pdf|max:10240', // 10MB
        ]);

        $file = $request->file('file');
        $wordCount = $wordCounter->countWords($file);
        // Calculate norm lines (standard page = 55 chars approx, but usually based on chars)
        // Here we just use a dummy calculation if line count needed, or assume word count is primary.
        // For simplicity, let's just return word count and a suggested connection to price matrix later.

        return response()->json([
            'word_count' => $wordCount,
            'filename' => $file->getClientOriginalName(),
        ]);
    }

    public function index(Request $request)
    {
        $query = \App\Models\Project::with(['customer', 'partner', 'sourceLanguage', 'targetLanguage', 'documentType', 'positions', 'files.uploader', 'payments']);

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->has('partner_id')) {
            $query->where('partner_id', $request->partner_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('limit')) {
            $query->limit($request->limit);
        }

        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_number' => 'nullable|string',
            'customer_id' => 'required|exists:customers,id',
            'partner_id' => 'nullable|exists:partners,id',
            'source_lang_id' => 'required|exists:languages,id',
            'target_lang_id' => 'required|exists:languages,id',
            'document_type_id' => 'nullable|exists:document_types,id',
            'additional_doc_types' => 'nullable|array',
            'project_name' => 'required|string',
            'status' => 'nullable|string',
            'priority' => 'nullable|in:low,medium,high',
            'word_count' => 'nullable|integer',
            'line_count' => 'nullable|integer',
            'price_total' => 'nullable|numeric',
            'partner_cost_net' => 'nullable|numeric',
            'down_payment' => 'nullable|numeric',
            'down_payment_date' => 'nullable|date',
            'down_payment_note' => 'nullable|string',
            'deadline' => 'nullable|date',
            'is_certified' => 'nullable|boolean',
            'has_apostille' => 'nullable|boolean',
            'is_express' => 'nullable|boolean',
            'classification' => 'nullable|boolean',
            'copies_count' => 'nullable|integer',
            'copy_price' => 'nullable|numeric',
            'notes' => 'nullable|string',
            'positions' => 'nullable|array',
            'positions.*.description' => 'required|string',
            'positions.*.amount' => 'required|numeric',
            'positions.*.unit' => 'nullable|string',
            'positions.*.quantity' => 'nullable|numeric',
            'positions.*.partner_rate' => 'nullable|numeric',
            'positions.*.partner_mode' => 'nullable|in:unit,flat',
            'positions.*.partner_total' => 'nullable|numeric',
            'positions.*.customer_rate' => 'nullable|numeric',
            'positions.*.customer_mode' => 'nullable|in:unit,flat,rate',
            'positions.*.customer_total' => 'nullable|numeric',
            'positions.*.margin_type' => 'nullable|in:markup,discount',
            'positions.*.margin_percent' => 'nullable|numeric',
            'payments' => 'nullable|array',
            'payments.*.amount' => 'required|numeric',
            'payments.*.payment_date' => 'required|date',
            'payments.*.payment_method' => 'nullable|string',
            'payments.*.note' => 'nullable|string',
        ]);

        $project = \App\Models\Project::create($validated);

        if ($request->has('positions')) {
            foreach ($request->positions as $posData) {
                $project->positions()->create($posData);
            }

            // Sync root price totals
            $positionsNet = (float) $project->positions()->sum('customer_total');
            $partnerNet = (float) $project->positions()->sum('partner_total');

            // Include extra services in the root price_total
            $extraNet = ($project->is_certified ? 5 : 0) +
                ($project->has_apostille ? 15 : 0) +
                ($project->is_express ? 15 : 0) +
                ($project->classification ? 15 : 0) +
                ((($project->copies_count && $project->copies_count > 0) ? $project->copies_count : 0) * (float) ($project->copy_price && $project->copy_price > 0 ? $project->copy_price : 5));

            $project->update([
                'price_total' => $positionsNet + $extraNet,
                'partner_cost_net' => $partnerNet
            ]);
        }

        if ($request->has('payments')) {
            foreach ($request->payments as $paymentData) {
                $project->payments()->create($paymentData);
            }
            // Update single field for compatibility
            $project->update(['down_payment' => $project->payments()->sum('amount')]);
        }

        // Send notification to the user who created the project
        $request->user()->notify(new \App\Notifications\ProjectCreatedNotification($project));

        // Automatically send invitation to customer if email is available
        if ($project->customer && $project->customer->email) {
            $baseUrl = config('app.frontend_url', 'http://localhost:5173');
            $inviteUrl = $baseUrl . "/guest/project/" . $project->access_token;

            try {
                \Illuminate\Support\Facades\Mail::to($project->customer->email)
                    ->send(new \App\Mail\ProjectInvitationMail($project, $inviteUrl, "Ihre Projekt-Übersicht wurde erstellt."));
            } catch (\Exception $e) {
                \Log::error("Automatic invitation failed: " . $e->getMessage());
            }
        }

        return response()->json($project->load(['positions', 'payments', 'customer', 'tenant']), 201);
    }

    public function show($id)
    {
        $project = \App\Models\Project::with(['customer', 'partner', 'sourceLanguage', 'targetLanguage', 'documentType', 'files.uploader', 'positions', 'payments', 'messages.user', 'messages.file', 'invoices'])->findOrFail($id);

        // Fetch creator and editor from activities
        $creationActivity = \Spatie\Activitylog\Models\Activity::where('subject_type', \App\Models\Project::class)
            ->where('subject_id', $id)
            ->where('event', 'created')
            ->orderBy('id', 'asc')
            ->with('causer')
            ->first();

        $updateActivity = \Spatie\Activitylog\Models\Activity::where('subject_type', \App\Models\Project::class)
            ->where('subject_id', $id)
            ->where('event', 'updated')
            ->orderBy('id', 'desc')
            ->with('causer')
            ->first();

        $project->creator = $creationActivity ? $creationActivity->causer : null;
        $project->editor = $updateActivity ? $updateActivity->causer : null;

        return response()->json($project);
    }

    public function getActivities($id)
    {
        $project = \App\Models\Project::findOrFail($id);

        $posIds = $project->positions()->pluck('id')->toArray();
        $fileIds = $project->files()->pluck('id')->toArray();
        $payIds = $project->payments()->pluck('id')->toArray();
        $invIds = $project->invoices()->pluck('id')->toArray();

        // Get all activities related to this project and its sub-entities
        $activities = \Spatie\Activitylog\Models\Activity::where(function ($q) use ($id) {
            $q->where('subject_type', \App\Models\Project::class)->where('subject_id', $id);
        })
            ->orWhere(function ($q) use ($posIds) {
                $q->where('subject_type', \App\Models\ProjectPosition::class)->whereIn('subject_id', $posIds);
            })
            ->orWhere(function ($q) use ($fileIds) {
                $q->where('subject_type', \App\Models\ProjectFile::class)->whereIn('subject_id', $fileIds);
            })
            ->orWhere(function ($q) use ($payIds) {
                $q->where('subject_type', \App\Models\ProjectPayment::class)->whereIn('subject_id', $payIds);
            })
            ->orWhere(function ($q) use ($invIds) {
                $q->where('subject_type', \App\Models\Invoice::class)->whereIn('subject_id', $invIds);
            })
            ->with('causer')
            ->latest()
            ->limit(300)
            ->get()
            ->map(function ($activity) {
                return [
                    'id' => $activity->id,
                    'description' => $activity->description,
                    'event' => $activity->event ?? $activity->description,
                    'subject_type' => class_basename($activity->subject_type ?? ''),
                    'subject_id' => $activity->subject_id,
                    'causer' => $activity->causer ? [
                        'id' => $activity->causer->id,
                        'name' => $activity->causer->name ?? $activity->causer->email ?? 'System',
                        'email' => $activity->causer->email ?? '',
                    ] : ['id' => null, 'name' => 'System', 'email' => ''],
                    'properties' => $activity->properties,
                    'created_at' => $activity->created_at,
                ];
            });

        return response()->json($activities);
    }

    public function update(Request $request, $id)
    {
        $project = \App\Models\Project::findOrFail($id);

        $validated = $request->validate([
            'project_number' => 'sometimes|nullable|string',
            'customer_id' => 'sometimes|exists:customers,id',
            'partner_id' => 'sometimes|nullable|exists:partners,id',
            'source_lang_id' => 'sometimes|nullable|exists:languages,id',
            'target_lang_id' => 'sometimes|nullable|exists:languages,id',
            'document_type_id' => 'sometimes|nullable|exists:document_types,id',
            'additional_doc_types' => 'nullable|array',
            'project_name' => 'sometimes|string|max:255',
            'status' => 'sometimes|string',
            'priority' => 'sometimes|nullable|string',
            'word_count' => 'nullable|integer',
            'line_count' => 'nullable|integer',
            'price_total' => 'nullable|numeric',
            'partner_cost_net' => 'nullable|numeric',
            'down_payment' => 'nullable|numeric',
            'down_payment_date' => 'nullable|date',
            'down_payment_note' => 'nullable|string',
            'currency' => 'sometimes|string|max:3',
            'deadline' => 'nullable|date',
            'is_certified' => 'nullable|boolean',
            'has_apostille' => 'nullable|boolean',
            'is_express' => 'nullable|boolean',
            'classification' => 'nullable|boolean',
            'copies_count' => 'nullable|integer',
            'copy_price' => 'nullable|numeric',
            'notes' => 'nullable|string',
            'appointment_location' => 'nullable|string',
            'customer_reference' => 'nullable|string',
            'customer_date' => 'nullable|date',
            'positions' => 'nullable|array',
            'positions.*.description' => 'required|string',
            'positions.*.amount' => 'required|numeric',
            'positions.*.unit' => 'nullable|string',
            'positions.*.quantity' => 'nullable|numeric',
            'positions.*.partner_rate' => 'nullable|numeric',
            'positions.*.partner_mode' => 'nullable|in:unit,flat',
            'positions.*.partner_total' => 'nullable|numeric',
            'positions.*.customer_rate' => 'nullable|numeric',
            'positions.*.customer_mode' => 'nullable|in:unit,flat,rate',
            'positions.*.customer_total' => 'nullable|numeric',
            'positions.*.margin_type' => 'nullable|in:markup,discount',
            'positions.*.margin_percent' => 'nullable|numeric',
            'payments' => 'nullable|array',
            'payments.*.amount' => 'required|numeric',
            'payments.*.payment_date' => 'required|date',
            'payments.*.payment_method' => 'nullable|string',
            'payments.*.note' => 'nullable|string',
        ]);

        $project->update(collect($validated)->except(['positions', 'payments'])->toArray());

        if ($request->has('positions')) {
            $project->positions()->delete();
            foreach ($validated['positions'] as $posData) {
                $project->positions()->create($posData);
            }

            // Sync root price totals
            $positionsNet = (float) $project->positions()->sum('customer_total');
            $partnerNet = (float) $project->positions()->sum('partner_total');

            // Include extra services in the root price_total
            $extraNet = ($project->is_certified ? 5 : 0) +
                ($project->has_apostille ? 15 : 0) +
                ($project->is_express ? 15 : 0) +
                ($project->classification ? 15 : 0) +
                ((($project->copies_count && $project->copies_count > 0) ? $project->copies_count : 0) * (float) ($project->copy_price && $project->copy_price > 0 ? $project->copy_price : 5));

            $project->update([
                'price_total' => $positionsNet + $extraNet,
                'partner_cost_net' => $partnerNet
            ]);
        }

        if ($request->has('payments')) {
            $project->payments()->delete();
            foreach ($validated['payments'] as $paymentData) {
                $project->payments()->create($paymentData);
            }
            $project->update(['down_payment' => $project->payments()->sum('amount')]);
        }

        return response()->json($project->load(['positions', 'payments']));
    }

    public function destroy($id)
    {
        \App\Models\Project::findOrFail($id)->delete();
        return response()->json(['message' => 'Project deleted']);
    }

    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:projects,id',
            'data' => 'required|array',
            'data.status' => 'sometimes|string',
            'data.priority' => 'sometimes|nullable|string',
            'data.partner_id' => 'sometimes|nullable|exists:partners,id',
        ]);

        $allowedFields = ['status', 'priority', 'partner_id'];
        $updateData = array_intersect_key($validated['data'], array_flip($allowedFields));

        if (empty($updateData)) {
            return response()->json(['message' => 'Keine gültigen Felder zum Aktualisieren.'], 422);
        }

        \App\Models\Project::whereIn('id', $validated['ids'])->update($updateData);

        return response()->json(['message' => 'Projects updated successfully']);
    }

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:projects,id',
        ]);

        \App\Models\Project::whereIn('id', $validated['ids'])->delete();

        return response()->json(['message' => 'Projects deleted successfully']);
    }

    public function inviteParticipant(Request $request, $id)
    {
        $project = \App\Models\Project::with('tenant')->findOrFail($id);

        $validated = $request->validate([
            'email' => 'required|email',
            'role' => 'required|string|in:translator,reviewer,client,observer',
            'message' => 'nullable|string'
        ]);

        // Ensure token exists
        if (!$project->access_token) {
            $project->access_token = \Illuminate\Support\Str::random(32);
            $project->save();
        }

        $baseUrl = config('app.frontend_url', 'http://localhost:5173');
        $inviteUrl = $baseUrl . "/guest/project/" . $project->access_token;

        try {
            \Illuminate\Support\Facades\Mail::to($validated['email'])
                ->send(new \App\Mail\ProjectInvitationMail($project, $inviteUrl, $validated['message']));

            \Log::info("Invitation sent for Project #{$id} to {$validated['email']} as {$validated['role']}");

            return response()->json([
                'message' => 'Einladung erfolgreich versendet.',
                'email' => $validated['email']
            ]);
        } catch (\Exception $e) {
            \Log::error("Failed to send invitation: " . $e->getMessage());
            return response()->json([
                'message' => 'Fehler beim Versenden der Einladung.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function generateDocument(Request $request, $id)
    {
        $project = \App\Models\Project::with(['customer', 'positions'])->findOrFail($id);

        $validated = $request->validate([
            'type' => 'required|string|in:confirmation,pickup,reminder,delivery_note',
        ]);

        try {
            $customer = $project->customer;
            $typeTitle = match ($validated['type']) {
                'confirmation' => 'Auftragsbestätigung',
                'pickup' => 'Abholbestätigung',
                'reminder' => 'Mahnung / Erinnerung',
                'delivery_note' => 'Lieferschein',
                default => 'Dokument'
            };

            $buyer = new Buyer([
                'name' => $customer ? ($customer->company_name ?? ($customer->first_name . ' ' . $customer->last_name)) : 'Unbekannter Kunde',
                'custom_fields' => [
                    'email' => $customer->email ?? '',
                    'address' => $customer->address_street ?? '',
                ],
            ]);

            $items = [];
            foreach ($project->positions as $pos) {
                $items[] = (new InvoiceItem())
                    ->title($pos->description)
                    ->pricePerUnit($pos->customer_rate ?: 0)
                    ->quantity($pos->amount ?: 1);
            }

            if (empty($items)) {
                $items[] = (new InvoiceItem())
                    ->title($project->project_name)
                    ->pricePerUnit($project->price_total ?: 0)
                    ->quantity(1);
            }

            $invoice = Invoice::make()
                ->name($typeTitle) // Custom title
                ->buyer($buyer)
                ->discountByPercent(0)
                ->taxRate(19)
                ->shipping(0)
                ->addItem($items[0]);

            if (count($items) > 1) {
                for ($i = 1; $i < count($items); $i++) {
                    $invoice->addItem($items[$i]);
                }
            }

            // Filename based on type
            $filename = "{$validated['type']}_{$project->project_number}_{$project->id}.pdf";

            // Render
            $invoice->render();
            $pdfContent = $invoice->output;

            // Save to storage
            $path = "documents/{$project->id}/{$filename}";
            \Storage::disk('public')->put($path, $pdfContent);

            $url = \Storage::url($path);

            return response()->json([
                'message' => "{$typeTitle} erfolgreich erstellt.",
                'url' => $url,
                'path' => $path
            ]);

        } catch (\Exception $e) {
            \Log::error("Document generation failed: " . $e->getMessage());
            return response()->json(['error' => 'Dokument konnte nicht erstellt werden: ' . $e->getMessage()], 500);
        }
    }
    public function generateToken(Request $request, \App\Models\Project $project)
    {
        $type = $request->input('type', 'customer');
        $token = \Illuminate\Support\Str::random(32);

        if ($type === 'partner') {
            $project->partner_access_token = $token;
        } else {
            $project->access_token = $token;
        }

        $project->save();
        return response()->json(['access_token' => $token]);
    }

    public function downloadConfirmation(Request $request, \App\Models\Project $project, $type)
    {
        if (!in_array($type, ['order_confirmation', 'pickup_confirmation', 'interpreter_confirmation'])) {
            abort(404);
        }

        $project->load(['customer', 'tenant', 'positions', 'sourceLanguage', 'targetLanguage', 'partner']);

        // Fetch creator from activities
        $creationActivity = \Spatie\Activitylog\Models\Activity::where('subject_type', \App\Models\Project::class)
            ->where('subject_id', $project->id)
            ->where('event', 'created')
            ->orderBy('id', 'asc')
            ->with('causer')
            ->first();
        $project->creator = $creationActivity ? $creationActivity->causer : null;

        if ($type === 'order_confirmation') {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.order_confirmation', compact('project'));
            $filename = 'Auftragsbestaetigung_' . ($project->project_number ?? $project->id) . '.pdf';
        } elseif ($type === 'pickup_confirmation') {
            $project->load(['payments', 'invoices']);
            $isPaid = false;
            if ($project->invoices->isNotEmpty()) {
                $latestInvoice = $project->invoices->first();
                $isPaid = $latestInvoice->status === \App\Models\Invoice::STATUS_PAID;
            }
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.pickup_confirmation', compact('project', 'isPaid'));
            $filename = 'Abholbestaetigung_' . ($project->project_number ?? $project->id) . '.pdf';
        } else {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.interpreter_confirmation', compact('project'));
            $filename = 'Dolmetscherbestaetigung_' . ($project->project_number ?? $project->id) . '.pdf';
        }

        return $pdf->download($filename);
    }

    public function postMessage(Request $request, $id)
    {
        $project = \App\Models\Project::findOrFail($id);
        $request->validate([
            'content' => 'required|string',
            'type' => 'nullable|string|in:customer,partner',
            'project_file_id' => 'nullable|exists:project_files,id'
        ]);

        $message = $project->messages()->create([
            'content' => $request->input('content'),
            'type' => $request->input('type', 'customer'),
            'project_file_id' => $request->input('project_file_id'),
            'user_id' => $request->user()->id,
            'sender_name' => $request->user()->name,
            'is_read' => true,
        ]);

        return response()->json($message->load('file'), 201);
    }
}
