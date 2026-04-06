<?php

namespace App\Http\Controllers\Api\Portal;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PortalController extends Controller
{
    private function customer(Request $request)
    {
        return $request->attributes->get('portal_customer');
    }

    public function dashboard(Request $request)
    {
        $c = $this->customer($request);

        $openProjects = Project::where('customer_id', $c->id)
            ->whereNotIn('status', ['completed', 'cancelled', 'archived', 'deleted'])
            ->count();

        $unpaidInvoices = Invoice::where('customer_id', $c->id)
            ->whereIn('status', ['issued', 'overdue'])
            ->count();

        $unpaidAmount = Invoice::where('customer_id', $c->id)
            ->whereIn('status', ['issued', 'overdue'])
            ->sum('amount_gross') / 100;

        $lastProject = Project::where('customer_id', $c->id)
            ->latest()
            ->first(['id', 'project_name', 'project_number', 'status', 'created_at']);

        return response()->json([
            'open_projects' => $openProjects,
            'unpaid_invoices' => $unpaidInvoices,
            'unpaid_amount' => $unpaidAmount,
            'last_project' => $lastProject,
        ]);
    }

    public function projects(Request $request)
    {
        $c = $this->customer($request);

        $projects = Project::where('customer_id', $c->id)
            ->whereNotIn('status', ['deleted'])
            ->with(['sourceLanguage:id,name_internal,iso_code', 'targetLanguage:id,name_internal,iso_code'])
            ->orderByDesc('created_at')
            ->get(['id', 'project_name', 'project_number', 'status', 'deadline', 'price_total', 'source_lang_id', 'target_lang_id', 'is_certified', 'created_at']);

        return response()->json($projects);
    }

    public function showProject(Request $request, int $id)
    {
        $c = $this->customer($request);

        $project = Project::where('id', $id)
            ->where('customer_id', $c->id)
            ->with(['sourceLanguage:id,name_internal,iso_code', 'targetLanguage:id,name_internal,iso_code', 'files', 'messages'])
            ->firstOrFail();

        return response()->json($project);
    }

    public function postMessage(Request $request, int $projectId)
    {
        $c = $this->customer($request);
        $request->validate(['content' => 'required|string|max:2000']);

        $project = Project::where('id', $projectId)
            ->where('customer_id', $c->id)
            ->firstOrFail();

        $message = $project->messages()->create([
            'content' => $request->content,
            'sender_name' => $c->company_name ?? trim($c->first_name . ' ' . $c->last_name),
            'type' => 'portal',
        ]);

        return response()->json($message, 201);
    }

    public function invoices(Request $request)
    {
        $c = $this->customer($request);

        $invoices = Invoice::where('customer_id', $c->id)
            ->whereNotIn('status', ['draft', 'deleted'])
            ->orderByDesc('created_at')
            ->get(['id', 'invoice_number', 'date', 'due_date', 'amount_gross', 'status']);

        return response()->json($invoices->map(function ($inv) {
            return [
                'id' => $inv->id,
                'invoice_number' => $inv->invoice_number,
                'date' => $inv->date?->toDateString(),
                'due_date' => $inv->due_date?->toDateString(),
                'amount_gross_eur' => $inv->amount_gross / 100,
                'status' => $inv->status,
            ];
        }));
    }

    public function downloadInvoice(Request $request, int $id)
    {
        $c = $this->customer($request);

        $invoice = Invoice::where('id', $id)
            ->where('customer_id', $c->id)
            ->whereNotIn('status', ['draft', 'deleted'])
            ->firstOrFail();

        $filename = 'invoice_' . $invoice->invoice_number . '.pdf';
        $pdfPath = storage_path('app/public/invoices/' . $filename);

        if (!file_exists($pdfPath)) {
            return response()->json(['message' => 'PDF nicht gefunden. Bitte kontaktieren Sie uns.'], 404);
        }

        return response()->download($pdfPath, 'Rechnung_' . $invoice->invoice_number . '.pdf');
    }

    public function updateProfile(Request $request)
    {
        $c = $this->customer($request);

        $data = $request->validate([
            'first_name'      => 'sometimes|string|max:100',
            'last_name'       => 'sometimes|string|max:100',
            'phone'           => 'sometimes|nullable|string|max:50',
            'address_street'  => 'sometimes|nullable|string|max:200',
            'address_zip'     => 'sometimes|nullable|string|max:20',
            'address_city'    => 'sometimes|nullable|string|max:100',
            'address_country' => 'sometimes|nullable|string|max:100',
        ]);

        $c->update($data);
        return response()->json($this->customerData($c->fresh()));
    }

    private function customerData(\App\Models\Customer $customer): array
    {
        return [
            'id' => $customer->id,
            'first_name' => $customer->first_name,
            'last_name' => $customer->last_name,
            'company_name' => $customer->company_name,
            'email' => $customer->email,
            'phone' => $customer->phone,
            'address_street' => $customer->address_street,
            'address_zip' => $customer->address_zip,
            'address_city' => $customer->address_city,
            'address_country' => $customer->address_country,
            'portal_last_login_at' => $customer->portal_last_login_at,
        ];
    }
}
