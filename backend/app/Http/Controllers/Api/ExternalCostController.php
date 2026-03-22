<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExternalCost;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ExternalCostController extends Controller
{
    /**
     * Display a listing of external costs
     */
    public function index(Request $request)
    {
        $query = ExternalCost::query()->with('project');

        // Filter by date range if provided
        if ($request->has('start_date')) {
            $query->where('date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('date', '<=', $request->end_date);
        }

        // Filter by project if provided
        if ($request->has('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        // Filter by cost type if provided
        if ($request->has('cost_type')) {
            $query->where('cost_type', $request->cost_type);
        }

        $costs = $query->latest('date')->get();

        // Convert amount_cents to decimal for frontend
        foreach ($costs as $cost) {
            $cost->amount = $cost->amount_cents / 100;
        }

        return response()->json($costs);
    }

    /**
     * Get statistics for external costs
     */
    public function stats(Request $request)
    {
        $startDate = $request->query('start_date')
            ? Carbon::parse($request->query('start_date'))->startOfDay()
            : Carbon::now()->startOfMonth();

        $endDate = $request->query('end_date')
            ? Carbon::parse($request->query('end_date'))->endOfDay()
            : Carbon::now()->endOfMonth();

        // Total external costs for period
        $totalCosts = ExternalCost::whereBetween('date', [$startDate, $endDate])
            ->sum('amount_cents') / 100;

        // Count of cost items
        $totalItems = ExternalCost::whereBetween('date', [$startDate, $endDate])
            ->count();

        // Breakdown by cost type
        $costsByType = ExternalCost::whereBetween('date', [$startDate, $endDate])
            ->selectRaw('cost_type, SUM(amount_cents) as total_cents, COUNT(*) as count')
            ->groupBy('cost_type')
            ->get()
            ->map(function ($item) {
                return [
                    'cost_type' => $item->cost_type ?? 'Sonstiges',
                    'total' => $item->total_cents / 100,
                    'count' => $item->count,
                ];
            });

        return response()->json([
            'total_costs' => $totalCosts,
            'total_items' => $totalItems,
            'costs_by_type' => $costsByType,
            'period' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
            ],
        ]);
    }

    /**
     * Store a newly created external cost
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'nullable|exists:projects,id',
            'description' => 'required|string|max:255',
            'cost_type' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'supplier' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        // Convert amount to cents
        $validated['amount_cents'] = (int) round($validated['amount'] * 100);
        unset($validated['amount']);

        $cost = ExternalCost::create($validated);
        $cost->load('project');
        $cost->amount = $cost->amount_cents / 100;

        return response()->json($cost, 201);
    }

    /**
     * Display the specified external cost
     */
    public function show(string $id)
    {
        $cost = ExternalCost::with('project')->findOrFail($id);
        $cost->amount = $cost->amount_cents / 100;

        return response()->json($cost);
    }

    /**
     * Update the specified external cost
     */
    public function update(Request $request, string $id)
    {
        $cost = ExternalCost::findOrFail($id);

        $validated = $request->validate([
            'project_id' => 'nullable|exists:projects,id',
            'description' => 'sometimes|required|string|max:255',
            'cost_type' => 'nullable|string|max:255',
            'amount' => 'sometimes|required|numeric|min:0',
            'date' => 'sometimes|required|date',
            'supplier' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        // Convert amount to cents if provided
        if (isset($validated['amount'])) {
            $validated['amount_cents'] = (int) round($validated['amount'] * 100);
            unset($validated['amount']);
        }

        $cost->update($validated);
        $cost->load('project');
        $cost->amount = $cost->amount_cents / 100;

        return response()->json($cost);
    }

    /**
     * Remove the specified external cost
     */
    public function destroy(string $id)
    {
        $cost = ExternalCost::findOrFail($id);
        $cost->delete();

        return response()->json(['message' => 'Fremdkosten erfolgreich gelöscht'], 200);
    }
}
