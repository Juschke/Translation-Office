<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use Illuminate\Http\Request;

class PartnerController extends Controller
{
    public function index()
    {
        return response()->json(Partner::withCount('projects')->get());
    }

    public function stats()
    {
        // Collaboration: Projects assigned to partners this month
        // Assuming 'partner_id' is foreign key in projects table
        $collaborationCount = \App\Models\Project::whereNotNull('partner_id')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        return response()->json([
            'collaboration_count' => $collaborationCount
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'nullable|in:translator,interpreter,trans_interp,agency',
            'salutation' => 'nullable|string',
            'first_name' => 'nullable|string',
            'last_name' => 'required|string',
            'company' => 'nullable|string',
            'email' => 'nullable|email',
            'additional_emails' => 'nullable|array',
            'phone' => 'nullable|string',
            'additional_phones' => 'nullable|array',
            'languages' => 'nullable|array',
            'domains' => 'nullable|array',
            'software' => 'nullable|string',
            'address_street' => 'nullable|string',
            'address_house_no' => 'nullable|string',
            'address_zip' => 'nullable|string',
            'address_city' => 'nullable|string',
            'bank_name' => 'nullable|string',
            'bic' => 'nullable|string',
            'iban' => 'nullable|string',
            'tax_id' => 'nullable|string',
            'payment_terms' => 'nullable|integer',
            'price_mode' => 'nullable|in:per_unit,flat,matrix',
            'unit_rates' => 'nullable|array',
            'flat_rates' => 'nullable|array',
            'status' => 'nullable|in:available,busy,vacation,blacklisted,deleted',
            'rating' => 'nullable|integer',
            'notes' => 'nullable|string',
        ]);

        $partner = Partner::create($validated);
        return response()->json($partner, 201);
    }

    public function show($id)
    {
        return response()->json(Partner::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $partner = Partner::findOrFail($id);

        $validated = $request->validate([
            'type' => 'nullable|in:translator,interpreter,trans_interp,agency',
            'salutation' => 'nullable|string',
            'first_name' => 'nullable|string',
            'last_name' => 'nullable|string',
            'company' => 'nullable|string',
            'email' => 'nullable|email',
            'additional_emails' => 'nullable|array',
            'phone' => 'nullable|string',
            'additional_phones' => 'nullable|array',
            'languages' => 'nullable|array',
            'domains' => 'nullable|array',
            'software' => 'nullable|string',
            'address_street' => 'nullable|string',
            'address_house_no' => 'nullable|string',
            'address_zip' => 'nullable|string',
            'address_city' => 'nullable|string',
            'bank_name' => 'nullable|string',
            'bic' => 'nullable|string',
            'iban' => 'nullable|string',
            'tax_id' => 'nullable|string',
            'payment_terms' => 'nullable|integer',
            'price_mode' => 'nullable|in:per_unit,flat,matrix',
            'unit_rates' => 'nullable|array',
            'flat_rates' => 'nullable|array',
            'status' => 'nullable|in:available,busy,vacation,blacklisted,deleted',
            'rating' => 'nullable|integer',
            'notes' => 'nullable|string',
        ]);

        $partner->update($validated);
        return response()->json($partner);
    }

    public function destroy($id)
    {
        Partner::findOrFail($id)->delete();
        return response()->json(['message' => 'Partner deleted']);
    }

    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:partners,id',
            'data' => 'required|array',
            'data.status' => 'sometimes|string|in:active,inactive,archiviert',
        ]);

        $allowedFields = ['status'];
        $updateData = array_intersect_key($validated['data'], array_flip($allowedFields));

        if (empty($updateData)) {
            return response()->json(['message' => 'Keine gültigen Felder zum Aktualisieren.'], 422);
        }

        Partner::whereIn('id', $validated['ids'])->update($updateData);

        return response()->json(['message' => 'Partners updated successfully']);
    }

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:partners,id',
        ]);

        Partner::whereIn('id', $validated['ids'])->delete();

        return response()->json(['message' => 'Partners deleted successfully']);
    }
}
