<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CurrencyController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\Currency::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|size:3',
            'name' => 'required|string',
            'symbol' => 'required|string|max:5',
            'is_default' => 'boolean',
            'status' => 'in:active,archived',
        ]);

        if (!empty($validated['is_default'])) {
            \App\Models\Currency::where('is_default', true)->update(['is_default' => false]);
        }

        $currency = \App\Models\Currency::create($validated);
        return response()->json($currency, 201);
    }

    public function show($id)
    {
        return response()->json(\App\Models\Currency::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $currency = \App\Models\Currency::findOrFail($id);

        $validated = $request->validate([
            'code' => 'string|size:3',
            'name' => 'string',
            'symbol' => 'string|max:5',
            'is_default' => 'boolean',
            'status' => 'in:active,archived',
        ]);

        if (!empty($validated['is_default'])) {
            \App\Models\Currency::where('is_default', true)->where('id', '!=', $id)->update(['is_default' => false]);
        }

        $currency->update($validated);
        return response()->json($currency);
    }

    public function destroy($id)
    {
        \App\Models\Currency::findOrFail($id)->delete();
        return response()->json(['message' => 'Currency deleted']);
    }
}
