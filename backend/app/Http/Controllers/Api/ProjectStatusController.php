<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProjectStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProjectStatusController extends Controller
{
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        $statuses = ProjectStatus::where('tenant_id', $tenantId)
            ->orderBy('sort_order', 'asc')
            ->get();

        if ($statuses->isEmpty()) {
            return $this->seedDefaults($tenantId);
        }

        return response()->json($statuses);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'label' => 'required|string|max:100',
            'color' => 'nullable|string|max:20',
            'style' => 'nullable|string|max:200',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $status = ProjectStatus::create(array_merge($validated, [
            'tenant_id' => Auth::user()->tenant_id,
        ]));

        return response()->json($status, 201);
    }

    public function show(ProjectStatus $status)
    {
        if ($status->tenant_id !== Auth::user()->tenant_id) {
            abort(403);
        }
        return response()->json($status);
    }

    public function update(Request $request, $id)
    {
        $status = ProjectStatus::where('id', $id)
            ->where('tenant_id', Auth::user()->tenant_id)
            ->firstOrFail();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:50',
            'label' => 'sometimes|required|string|max:100',
            'color' => 'nullable|string|max:20',
            'style' => 'nullable|string|max:200',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $status->update($validated);

        return response()->json($status);
    }

    public function destroy($id)
    {
        $status = ProjectStatus::where('id', $id)
            ->where('tenant_id', Auth::user()->tenant_id)
            ->firstOrFail();

        $status->delete();

        return response()->json(null, 204);
    }

    private function seedDefaults($tenantId)
    {
        $defaults = [
            ['name' => 'draft', 'label' => 'Entwurf', 'style' => 'bg-slate-50 text-slate-600 border-slate-200', 'sort_order' => 10],
            ['name' => 'offer', 'label' => 'Neu / Angebot', 'style' => 'bg-orange-50 text-orange-700 border-orange-200', 'sort_order' => 20],
            ['name' => 'pending', 'label' => 'Ausstehend', 'style' => 'bg-orange-50 text-orange-700 border-orange-200', 'sort_order' => 30],
            ['name' => 'in_progress', 'label' => 'In Bearbeitung', 'style' => 'bg-blue-50 text-blue-700 border-blue-200', 'sort_order' => 40],
            ['name' => 'review', 'label' => 'In Prüfung', 'style' => 'bg-blue-50 text-blue-700 border-blue-200', 'sort_order' => 50],
            ['name' => 'ready_for_pickup', 'label' => 'Abholbereit', 'style' => 'bg-indigo-50 text-indigo-700 border-indigo-200', 'sort_order' => 60],
            ['name' => 'invoiced', 'label' => 'Rechnung gestellt', 'style' => 'bg-purple-50 text-purple-700 border-purple-200', 'sort_order' => 70],
            ['name' => 'delivered', 'label' => 'Geliefert', 'style' => 'bg-emerald-50 text-emerald-700 border-emerald-200', 'sort_order' => 80],
            ['name' => 'completed', 'label' => 'Abgeschlossen', 'style' => 'bg-emerald-600 text-white border-emerald-700', 'sort_order' => 90],
            ['name' => 'cancelled', 'label' => 'Storniert', 'style' => 'bg-slate-100 text-slate-500 border-slate-300', 'sort_order' => 100],
            ['name' => 'archived', 'label' => 'Archiviert', 'style' => 'bg-slate-800 text-white border-slate-700', 'sort_order' => 110],
            ['name' => 'deleted', 'label' => 'Gelöscht', 'style' => 'bg-red-50 text-red-700 border-red-200', 'sort_order' => 120],
        ];

        foreach ($defaults as $data) {
            ProjectStatus::create(array_merge($data, [
                'tenant_id' => $tenantId
            ]));
        }

        return response()->json(ProjectStatus::where('tenant_id', $tenantId)->orderBy('sort_order', 'asc')->get());
    }
}
