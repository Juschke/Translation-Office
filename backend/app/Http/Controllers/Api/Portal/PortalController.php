<?php

namespace App\Http\Controllers\Api\Portal;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PortalController extends Controller
{
    private function user(Request $request)
    {
        return $request->attributes->get('portal_customer') ?: $request->attributes->get('portal_partner');
    }

    private function userType(Request $request)
    {
        return $request->attributes->get('portal_customer') ? 'customer' : 'partner';
    }

    public function dashboard(Request $request)
    {
        $u = $this->user($request);
        $type = $this->userType($request);
        $foreignKey = $type === 'customer' ? 'customer_id' : 'partner_id';

        $openProjects = Project::where($foreignKey, $u->id)
            ->whereNotIn('status', ['completed', 'cancelled', 'archived', 'deleted'])
            ->count();

        $completedProjects = Project::where($foreignKey, $u->id)
            ->where('status', 'completed')
            ->count();

        $unpaidInvoices = $type === 'customer'
            ? Invoice::where('customer_id', $u->id)->whereIn('status', ['issued', 'overdue'])->count()
            : 0;

        $openMessages = Project::where($foreignKey, $u->id)
            ->withCount([
                'messages as unread_count' => function ($q) {
                    // messages type portal are from customer/partner. others are from team.
                    $q->where('type', '!=', 'portal');
                }
            ])
            ->get()
            ->sum('unread_count');

        $recentProjects = Project::where($foreignKey, $u->id)
            ->whereNotIn('status', ['deleted'])
            ->with(['sourceLanguage:id,name_internal', 'targetLanguage:id,name_internal'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'project_name', 'status', 'source_lang_id', 'target_lang_id', 'deadline', 'created_at']);

        $recentInvoices = $type === 'customer'
            ? Invoice::where('customer_id', $u->id)
                ->whereNotIn('status', ['draft', 'deleted'])
                ->orderByDesc('created_at')
                ->limit(5)
                ->get(['id', 'invoice_number', 'date', 'amount_gross', 'status'])
            : collect();

        return response()->json([
            'stats' => [
                'open_projects' => $openProjects,
                'completed_projects' => $completedProjects,
                'unpaid_invoices' => $unpaidInvoices,
                'open_messages' => $openMessages,
            ],
            'recent_projects' => $recentProjects->map(fn($p) => [
                'id' => $p->id,
                'title' => $p->project_name,
                'status' => $p->status,
                'source_language' => $p->sourceLanguage?->name_internal,
                'target_language' => $p->targetLanguage?->name_internal,
                'deadline' => $p->deadline?->toDateString(),
                'created_at' => $p->created_at->toIso8601String(),
            ]),
            'recent_invoices' => $recentInvoices->map(fn($inv) => [
                'id' => $inv->id,
                'invoice_number' => $inv->invoice_number,
                'date' => $inv->date?->toDateString(),
                'amount_gross' => $inv->amount_gross,
                'status' => $inv->status,
            ]),
        ]);
    }

    public function projects(Request $request)
    {
        $u = $this->user($request);
        $type = $this->userType($request);
        $foreignKey = $type === 'customer' ? 'customer_id' : 'partner_id';

        $projects = Project::where($foreignKey, $u->id)
            ->whereNotIn('status', ['deleted'])
            ->with(['sourceLanguage:id,name_internal', 'targetLanguage:id,name_internal'])
            ->orderByDesc('created_at')
            ->get(['id', 'project_name', 'project_number', 'status', 'deadline', 'price_total', 'source_lang_id', 'target_lang_id', 'is_certified', 'created_at']);

        return response()->json($projects->map(fn($p) => [
            'id' => $p->id,
            'title' => $p->project_name,
            'project_number' => $p->project_number,
            'status' => $p->status,
            'source_language' => $p->sourceLanguage?->name_internal,
            'target_language' => $p->targetLanguage?->name_internal,
            'deadline' => $p->deadline?->toDateString(),
            'price' => $p->price_total ? (int) ($p->price_total * 100) : null,
            'is_certified' => $p->is_certified,
            'created_at' => $p->created_at->toIso8601String(),
        ]));
    }

    public function showProject(Request $request, int $id)
    {
        $u = $this->user($request);
        $type = $this->userType($request);
        $foreignKey = $type === 'customer' ? 'customer_id' : 'partner_id';

        $project = Project::where('id', $id)
            ->where($foreignKey, $u->id)
            ->with(['sourceLanguage:id,name_internal', 'targetLanguage:id,name_internal', 'files', 'messages'])
            ->firstOrFail();

        return response()->json([
            'id' => $project->id,
            'title' => $project->project_name,
            'project_number' => $project->project_number,
            'status' => $project->status,
            'source_language' => $project->sourceLanguage?->name_internal,
            'target_language' => $project->targetLanguage?->name_internal,
            'deadline' => $project->deadline?->toDateString(),
            'price' => $project->price_total ? (int) ($project->price_total * 100) : null,
            'is_certified' => $project->is_certified,
            'notes' => $project->notes,
            'created_at' => $project->created_at->toIso8601String(),
            'files' => $project->files->map(fn($f) => [
                'id' => $f->id,
                'name' => $f->original_name,
                'size' => $f->file_size,
                'mime_type' => $f->mime_type,
                'created_at' => $f->created_at->toIso8601String(),
            ]),
            'messages' => $project->messages->map(fn($m) => [
                'id' => $m->id,
                'body' => $m->content,
                'sender' => $m->type === 'portal' ? $type : 'team',
                'sender_name' => $m->sender_name,
                'created_at' => $m->created_at->toIso8601String(),
            ]),
        ]);
    }

    public function postMessage(Request $request, int $projectId)
    {
        $u = $this->user($request);
        $type = $this->userType($request);
        $foreignKey = $type === 'customer' ? 'customer_id' : 'partner_id';

        $request->validate(['content' => 'required|string|max:2000']);

        $project = Project::where('id', $projectId)
            ->where($foreignKey, $u->id)
            ->firstOrFail();

        $senderName = property_exists($u, 'company_name') ? (string) $u->company_name : (string) ($u->company ?? '');
        if (!$senderName) {
            $senderName = trim($u->first_name . ' ' . $u->last_name);
        }

        $message = $project->messages()->create([
            'content' => $request->content,
            'sender_name' => $senderName,
            'type' => 'portal',
        ]);

        return response()->json([
            'id' => $message->id,
            'body' => $message->content,
            'sender' => $type,
            'sender_name' => $message->sender_name,
            'created_at' => $message->created_at->toIso8601String(),
        ], 201);
    }

    public function invoices(Request $request)
    {
        $u = $this->user($request);
        $type = $this->userType($request);
        if ($type !== 'customer') {
            return response()->json([]);
        }

        $invoices = Invoice::where('customer_id', $u->id)
            ->whereNotIn('status', ['draft', 'deleted'])
            ->orderByDesc('created_at')
            ->get(['id', 'invoice_number', 'date', 'due_date', 'amount_gross', 'status']);

        return response()->json($invoices->map(fn($inv) => [
            'id' => $inv->id,
            'invoice_number' => $inv->invoice_number,
            'date' => $inv->date?->toDateString(),
            'due_date' => $inv->due_date?->toDateString(),
            'amount_gross' => $inv->amount_gross,
            'status' => $inv->status,
        ]));
    }

    public function downloadInvoice(Request $request, int $id)
    {
        $u = $this->user($request);
        $type = $this->userType($request);
        if ($type !== 'customer') {
            abort(403);
        }

        $invoice = Invoice::where('id', $id)
            ->where('customer_id', $u->id)
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
        $u = $this->user($request);

        $data = $request->validate([
            'first_name' => 'sometimes|string|max:100',
            'last_name' => 'sometimes|string|max:100',
            'phone' => 'sometimes|nullable|string|max:50',
            'address_street' => 'sometimes|nullable|string|max:200',
            'address_zip' => 'sometimes|nullable|string|max:20',
            'address_city' => 'sometimes|nullable|string|max:100',
            'address_country' => 'sometimes|nullable|string|max:100',
        ]);

        $u->update($data);
        return response()->json($this->userData($u->fresh()));
    }

    private function userData($user): array
    {
        return [
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'company_name' => property_exists($user, 'company_name') ? (string) $user->company_name : (string) ($user->company ?? ''),
            'email' => $user->email,
            'phone' => $user->phone,
            'address_street' => $user->address_street,
            'address_zip' => $user->address_zip,
            'address_city' => $user->address_city,
            'address_country' => $user->address_country ?? '',
            'portal_last_login_at' => $user->portal_last_login_at,
        ];
    }
}
