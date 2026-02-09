<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DocumentTypeController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\DocumentType::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category' => 'nullable|string',
            'name' => 'required|string',
            'default_price' => 'nullable|numeric',
            'vat_rate' => 'numeric',
            'template_file' => 'nullable|string',
        ]);

        $documentType = \App\Models\DocumentType::create($validated);
        return response()->json($documentType, 201);
    }

    public function show($id)
    {
        return response()->json(\App\Models\DocumentType::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $documentType = \App\Models\DocumentType::findOrFail($id);

        $validated = $request->validate([
            'category' => 'nullable|string',
            'name' => 'string',
            'default_price' => 'nullable|numeric',
            'vat_rate' => 'numeric',
            'template_file' => 'nullable|string',
        ]);

        $documentType->update($validated);
        return response()->json($documentType);
    }

    public function destroy($id)
    {
        \App\Models\DocumentType::findOrFail($id)->delete();
        return response()->json(['message' => 'Document type deleted']);
    }
}
