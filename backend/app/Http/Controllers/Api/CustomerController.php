<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index()
    {
        return response()->json(
            \App\Models\Customer::with('priceMatrix')
                ->withCount('projects')
                ->withSum([
                    'invoices as sales' => function ($query) {
                        $query->whereYear('date', now()->year);
                    }
                ], 'amount_net')
                ->get()
        );
    }

    public function stats()
    {
        $currentYear = now()->year;
        $lastYear = now()->subYear()->year;

        // 1. Total Active Customers
        $totalActive = \App\Models\Customer::whereNotIn('status', ['deleted', 'archived', 'gelöscht', 'archiviert'])->count();

        // 2. Top Customer (Highest Sales YTD)
        $topCustomer = \App\Models\Customer::withSum([
            'invoices as ytd_sales' => function ($query) use ($currentYear) {
                $query->whereYear('date', $currentYear);
            }
        ], 'amount_net')
            ->orderByDesc('ytd_sales')
            ->first();

        // 3. Total Revenue YTD
        $totalRevenueYtd = \App\Models\Invoice::whereYear('date', $currentYear)->sum('amount_net');

        // 4. Revenue Trend (vs Last Year)
        $totalRevenueLastYear = \App\Models\Invoice::whereYear('date', $lastYear)->sum('amount_net');

        $trend = 0;
        if ($totalRevenueLastYear > 0) {
            $trend = (($totalRevenueYtd - $totalRevenueLastYear) / $totalRevenueLastYear) * 100;
        } else if ($totalRevenueYtd > 0) {
            $trend = 100; // 100% growth if last year was 0
        }

        return response()->json([
            'total_active' => $totalActive,
            'top_customer' => $topCustomer ? ($topCustomer->company_name ?? $topCustomer->last_name) : '-',
            'total_revenue_ytd' => $totalRevenueYtd,
            'revenue_trend' => round($trend, 1)
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'nullable|in:private,company,authority',
            'salutation' => 'nullable|string',
            'first_name' => 'nullable|string',
            'last_name' => 'required|string',
            'company_name' => 'nullable|string',
            'contact_person' => 'nullable|string',
            'email' => 'nullable|email',
            'additional_emails' => 'nullable|array',
            'phone' => 'nullable|string',
            'additional_phones' => 'nullable|array',
            'address_street' => 'nullable|string',
            'address_house_no' => 'nullable|string',
            'address_zip' => 'nullable|string',
            'address_city' => 'nullable|string',
            'address_country' => 'nullable|string',
            'price_matrix_id' => 'nullable|exists:price_matrices,id',
            'notes' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        $customer = \App\Models\Customer::create($validated);
        return response()->json($customer, 201);
    }

    public function show($id)
    {
        return response()->json(\App\Models\Customer::with('priceMatrix')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $customer = \App\Models\Customer::findOrFail($id);

        $validated = $request->validate([
            'type' => 'nullable|in:private,company,authority',
            'salutation' => 'nullable|string',
            'first_name' => 'nullable|string',
            'last_name' => 'nullable|string',
            'company_name' => 'nullable|string',
            'contact_person' => 'nullable|string',
            'email' => 'nullable|email',
            'additional_emails' => 'nullable|array',
            'phone' => 'nullable|string',
            'additional_phones' => 'nullable|array',
            'address_street' => 'nullable|string',
            'address_house_no' => 'nullable|string',
            'address_zip' => 'nullable|string',
            'address_city' => 'nullable|string',
            'address_country' => 'nullable|string',
            'price_matrix_id' => 'nullable|exists:price_matrices,id',
            'notes' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        $customer->update($validated);
        return response()->json($customer);
    }

    public function destroy($id)
    {
        \App\Models\Customer::findOrFail($id)->delete();
        return response()->json(['message' => 'Customer deleted']);
    }

    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:customers,id',
            'data' => 'required|array',
        ]);

        \App\Models\Customer::whereIn('id', $validated['ids'])->update($validated['data']);

        return response()->json(['message' => 'Customers updated successfully']);
    }

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:customers,id',
        ]);

        \App\Models\Customer::whereIn('id', $validated['ids'])->delete();

        return response()->json(['message' => 'Customers deleted successfully']);
    }
}
