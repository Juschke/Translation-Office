<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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

    public function billing(Partner $partner)
    {
        $tenantId = Auth::user()->tenant_id;

        $projects = Project::query()
            ->where('tenant_id', $tenantId)
            ->where('partner_id', $partner->id)
            ->select([
                'id',
                'project_number',
                'project_name',
                'status',
                'deadline',
                'partner_cost_net',
                'partner_paid',
                'partner_paid_at',
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        $totalOwedNet = $projects
            ->where('partner_paid', false)
            ->sum(fn ($p) => (float) $p->partner_cost_net);

        $totalPaidNet = $projects
            ->where('partner_paid', true)
            ->sum(fn ($p) => (float) $p->partner_cost_net);

        return response()->json([
            'summary' => [
                'total_projects'      => $projects->count(),
                'total_owed_net'      => round($totalOwedNet, 2),
                'total_paid_net'      => round($totalPaidNet, 2),
                'total_outstanding_net' => round($totalOwedNet, 2),
            ],
            'projects' => $projects,
        ]);
    }

    public function markPartnerPaid(Partner $partner, Project $project)
    {
        $tenantId = Auth::user()->tenant_id;

        if ((int) $project->tenant_id !== (int) $tenantId) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ((int) $project->partner_id !== (int) $partner->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($project->partner_paid) {
            $project->partner_paid    = false;
            $project->partner_paid_at = null;
        } else {
            $project->partner_paid    = true;
            $project->partner_paid_at = now();
        }

        $project->save();

        return response()->json([
            'success'          => true,
            'partner_paid'     => $project->partner_paid,
            'partner_paid_at'  => $project->partner_paid_at,
        ]);
    }

    public function checkDuplicates(Request $request)
    {
        $firstName = $request->input('first_name');
        $lastName = $request->input('last_name');
        $email = $request->input('email');
        $phone = $request->input('phone');
        $company = $request->input('company');

        $query = Partner::query();

        $query->where(function ($q) use ($firstName, $lastName, $email, $phone, $company) {
            if ($email) {
                $q->orWhere('email', $email);
            }
            if ($phone) {
                $q->orWhere('phone', $phone);
            }
            if ($lastName) {
                $q->orWhere(function ($sq) use ($firstName, $lastName) {
                    $sq->where('last_name', $lastName);
                    if ($firstName) {
                        $sq->where('first_name', $firstName);
                    }
                });
            }
            if ($company) {
                $q->orWhere('company', $company);
            }
        });

        $duplicates = $query->limit(5)->get();

        return response()->json($duplicates);
    }
}
