<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class UnitController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\Unit::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'abbreviation' => 'nullable|string|max:10',
            'status' => 'in:active,archived',
        ]);

        $unit = \App\Models\Unit::create($validated);
        return response()->json($unit, 201);
    }

    public function show($id)
    {
        return response()->json(\App\Models\Unit::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $unit = \App\Models\Unit::findOrFail($id);

        $validated = $request->validate([
            'name' => 'string',
            'abbreviation' => 'nullable|string|max:10',
            'status' => 'in:active,archived',
        ]);

        $unit->update($validated);
        return response()->json($unit);
    }

    public function destroy($id)
    {
        \App\Models\Unit::findOrFail($id)->delete();
        return response()->json(['message' => 'Unit deleted']);
    }
}
