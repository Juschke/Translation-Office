<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

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
        return response()->json(\App\Models\Project::with(['customer', 'partner', 'sourceLanguage', 'targetLanguage', 'positions', 'files', 'payments'])->get());
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
        return response()->json(\App\Models\Project::with(['customer', 'partner', 'sourceLanguage', 'targetLanguage', 'files', 'positions', 'payments'])->findOrFail($id));
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
}
