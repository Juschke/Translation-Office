<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\Customer::with('priceMatrix')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string',
            'contact_person' => 'nullable|string',
            'email' => 'nullable|email',
            'address_street' => 'nullable|string',
            'address_zip' => 'nullable|string',
            'address_city' => 'nullable|string',
            'price_matrix_id' => 'nullable|exists:price_matrices,id',
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
            'company_name' => 'string',
            'contact_person' => 'nullable|string',
            'email' => 'nullable|email',
            'address_street' => 'nullable|string',
            'address_zip' => 'nullable|string',
            'address_city' => 'nullable|string',
            'price_matrix_id' => 'nullable|exists:price_matrices,id',
        ]);

        $customer->update($validated);
        return response()->json($customer);
    }

    public function destroy($id)
    {
        \App\Models\Customer::findOrFail($id)->delete();
        return response()->json(['message' => 'Customer deleted']);
    }
}
