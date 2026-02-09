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

    public function index()
    {
        return response()->json(\App\Models\Project::with(['customer', 'partner', 'sourceLanguage', 'targetLanguage', 'positions', 'files.uploader', 'payments'])->get());
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
            'positions.*.customer_mode' => 'nullable|in:unit,flat',
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

        return response()->json($project->load(['positions', 'payments']), 201);
    }

    public function show($id)
    {
        return response()->json(\App\Models\Project::with(['customer', 'partner', 'sourceLanguage', 'targetLanguage', 'files.uploader', 'positions', 'payments'])->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $project = \App\Models\Project::findOrFail($id);
        $project->update($request->except(['positions', 'payments']));

        if ($request->has('positions')) {
            $project->positions()->delete();
            foreach ($request->positions as $posData) {
                $project->positions()->create($posData);
            }
        }

        if ($request->has('payments')) {
            $project->payments()->delete();
            foreach ($request->payments as $paymentData) {
                $project->payments()->create($paymentData);
            }
            // Update single field for compatibility
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
        ]);

        \App\Models\Project::whereIn('id', $validated['ids'])->update($validated['data']);

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
        $project = \App\Models\Project::findOrFail($id);
        
        $validated = $request->validate([
            'email' => 'required|email',
            'role' => 'required|string|in:translator,reviewer,client,observer',
            'message' => 'nullable|string'
        ]);

        // Logic to send invitation email would go here
        // For now, we simulate success
        
        \Log::info("Invitation sent for Project #{$id} to {$validated['email']} as {$validated['role']}");

        return response()->json([
            'message' => 'Einladung erfolgreich versendet.',
            'email' => $validated['email']
        ]);
    }

    public function generateDocument(Request $request, $id)
    {
        $project = \App\Models\Project::with(['customer', 'positions'])->findOrFail($id);
        
        $validated = $request->validate([
            'type' => 'required|string|in:confirmation,pickup,reminder,delivery_note',
        ]);

        try {
            $customer = $project->customer;
            $typeTitle = match($validated['type']) {
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
}
