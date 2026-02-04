<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PriceMatrixController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\PriceMatrix::with(['sourceLanguage', 'targetLanguage'])->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'source_lang_id' => 'required|exists:languages,id',
            'target_lang_id' => 'required|exists:languages,id',
            'currency' => 'nullable|string|max:3',
            'price_per_word' => 'numeric',
            'price_per_line' => 'numeric',
            'minimum_charge' => 'numeric',
            'hourly_rate' => 'numeric',
        ]);

        $priceMatrix = \App\Models\PriceMatrix::create($validated);
        return response()->json($priceMatrix, 201);
    }

    public function show($id)
    {
        return response()->json(\App\Models\PriceMatrix::with(['sourceLanguage', 'targetLanguage'])->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $priceMatrix = \App\Models\PriceMatrix::findOrFail($id);

        $validated = $request->validate([
            'source_lang_id' => 'exists:languages,id',
            'target_lang_id' => 'exists:languages,id',
            'currency' => 'string|max:3',
            'price_per_word' => 'numeric',
            'price_per_line' => 'numeric',
            'minimum_charge' => 'numeric',
            'hourly_rate' => 'numeric',
        ]);

        $priceMatrix->update($validated);
        return response()->json($priceMatrix);
    }

    public function destroy($id)
    {
        \App\Models\PriceMatrix::findOrFail($id)->delete();
        return response()->json(['message' => 'Price matrix deleted']);
    }
}
