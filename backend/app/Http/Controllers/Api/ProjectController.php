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
        return response()->json(\App\Models\Project::with(['customer', 'sourceLanguage', 'targetLanguage'])->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'source_lang_id' => 'required|exists:languages,id',
            'target_lang_id' => 'required|exists:languages,id',
            'document_type_id' => 'nullable|exists:document_types,id',
            'project_name' => 'required|string',
            'status' => 'in:request,calculation,offer,ordered,in_progress,review,delivered,invoiced,paid,archived',
            'word_count' => 'integer',
            'price_total' => 'numeric',
            'deadline' => 'nullable|date',
        ]);

        $project = \App\Models\Project::create($validated);
        return response()->json($project, 201);
    }

    public function show($id)
    {
        return response()->json(\App\Models\Project::with(['customer', 'sourceLanguage', 'targetLanguage', 'files'])->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $project = \App\Models\Project::findOrFail($id);
        $project->update($request->all());
        return response()->json($project);
    }

    public function destroy($id)
    {
        \App\Models\Project::findOrFail($id)->delete();
        return response()->json(['message' => 'Project deleted']);
    }
}
