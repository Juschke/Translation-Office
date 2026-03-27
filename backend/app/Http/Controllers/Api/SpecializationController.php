<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SpecializationController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\Specialization::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'status' => 'in:active,archived',
        ]);

        $specialization = \App\Models\Specialization::create($validated);
        return response()->json($specialization, 201);
    }

    public function show($id)
    {
        return response()->json(\App\Models\Specialization::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $specialization = \App\Models\Specialization::findOrFail($id);

        $validated = $request->validate([
            'name' => 'string',
            'description' => 'nullable|string',
            'status' => 'in:active,archived',
        ]);

        $specialization->update($validated);
        return response()->json($specialization);
    }

    public function destroy($id)
    {
        \App\Models\Specialization::findOrFail($id)->delete();
        return response()->json(['message' => 'Specialization deleted']);
    }
}
