<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Project;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Carbon\Carbon;

class CalendarController extends Controller
{
    public function index(Request $request)
    {
        $startStr = $request->input('start');
        $endStr = $request->input('end');

        if (!$startStr || !$endStr) {
            $start = Carbon::now()->startOfMonth()->subMonths(2);
            $end = Carbon::now()->endOfMonth()->addMonths(2);
        } else {
            // FullCalendar uses ISO8601 strings usually
            $start = Carbon::parse($startStr);
            $end = Carbon::parse($endStr);
        }

        $events = [];

        // 1. Projects (Deadlines)
        $projects = Project::whereBetween('deadline', [$start, $end])
            ->with(['customer', 'partner', 'sourceLanguage', 'targetLanguage'])
            ->get();

        foreach ($projects as $project) {
            if (!$project->deadline)
                continue;

            $source = $project->sourceLanguage ? $project->sourceLanguage->iso_code : '?';
            $target = $project->targetLanguage ? $project->targetLanguage->iso_code : '?';
            $langPair = $source . ' → ' . $target;

            $sourceFlag = $project->sourceLanguage ? $project->sourceLanguage->flag_icon : null;
            $targetFlag = $project->targetLanguage ? $project->targetLanguage->flag_icon : null;

            $events[] = [
                'id' => 'project_' . $project->id,
                'title' => '🏁 ' . ($project->project_number ?: $project->project_name),
                'start' => Carbon::parse($project->deadline)->toIso8601String(),
                'allDay' => false,
                'type' => 'project',
                'extendedProps' => [
                    'project_id' => $project->id,
                    'status' => $project->status,
                    'project_number' => $project->project_number,
                    'display_id' => $project->display_id,
                    'customer' => $project->customer ? ($project->customer->company_name ?: ($project->customer->first_name . ' ' . $project->customer->last_name)) : null,
                    'customer_id' => $project->customer ? $project->customer->display_id : null,
                    'language_pair' => ($project->sourceLanguage && $project->targetLanguage) ? $langPair : null,
                    'source_flag' => $sourceFlag,
                    'target_flag' => $targetFlag,
                    'deadline' => Carbon::parse($project->deadline)->format('H:i'),
                ],
                'backgroundColor' => '#3b82f6', // blue
                'borderColor' => '#2563eb',
                'textColor' => '#ffffff',
            ];
        }

        // 2. Invoices (Due Dates)
        $invoices = Invoice::whereBetween('due_date', [$start, $end])
            ->whereNotIn('status', ['paid', 'cancelled', 'deleted'])
            ->get();

        foreach ($invoices as $invoice) {
            if (!$invoice->due_date)
                continue;
            $events[] = [
                'id' => 'invoice_' . $invoice->id,
                'title' => '💰 Fällig: ' . $invoice->invoice_number,
                'start' => Carbon::parse($invoice->due_date)->toIso8601String(),
                'allDay' => true,
                'type' => 'invoice',
                'extendedProps' => [
                    'invoice_id' => $invoice->id,
                    'amount' => $invoice->amount_gross_eur,
                    'customer' => $invoice->snapshot_customer_name,
                ],
                'backgroundColor' => '#ef4444', // red
                'borderColor' => '#dc2626',
                'textColor' => '#ffffff',
            ];
        }

        // 3. Appointments (General & Interpreting)
        $appointments = Appointment::where(function ($query) use ($start, $end) {
            $query->whereBetween('start_date', [$start, $end])
                ->orWhereBetween('end_date', [$start, $end]);
        })
            ->with(['customer', 'partner', 'project.sourceLanguage', 'project.targetLanguage', 'project.customer'])
            ->get();

        foreach ($appointments as $appointment) {
            $color = '#10b981'; // emerald (meeting)
            $emoji = '📅 ';

            if ($appointment->type === 'interpreting') {
                $color = '#8b5cf6'; // violet
                $emoji = '🗣️ ';
            } else if ($appointment->type === 'personal') {
                $color = '#f59e0b'; // amber
                $emoji = '👤 ';
            }

            $langPair = null;
            $sourceFlag = null;
            $targetFlag = null;
            if ($appointment->project) {
                $proj = $appointment->project;
                $source = $proj->sourceLanguage ? $proj->sourceLanguage->iso_code : '?';
                $target = $proj->targetLanguage ? $proj->targetLanguage->iso_code : '?';
                $langPair = $source . ' → ' . $target;
                $sourceFlag = $proj->sourceLanguage ? $proj->sourceLanguage->flag_icon : null;
                $targetFlag = $proj->targetLanguage ? $proj->targetLanguage->flag_icon : null;
            }

            $events[] = [
                'id' => 'appt_' . $appointment->id,
                'title' => $emoji . $appointment->title,
                'start' => Carbon::parse($appointment->start_date)->toIso8601String(),
                'end' => $appointment->end_date ? Carbon::parse($appointment->end_date)->toIso8601String() : null,
                'allDay' => false,
                'type' => 'appointment',
                'appointment_type' => $appointment->type,
                'location' => $appointment->location,
                'extendedProps' => [
                    'appointment_id' => $appointment->id,
                    'display_id' => $appointment->display_id,
                    'description' => $appointment->description,
                    'type' => $appointment->type,
                    'location' => $appointment->location,
                    'customer' => $appointment->customer ? ($appointment->customer->company_name ?: ($appointment->customer->first_name . ' ' . $appointment->customer->last_name)) : ($appointment->project && $appointment->project->customer ? ($appointment->project->customer->company_name ?: ($appointment->project->customer->first_name . ' ' . $appointment->project->customer->last_name)) : null),
                    'customer_id' => $appointment->customer ? $appointment->customer->display_id : ($appointment->project && $appointment->project->customer ? $appointment->project->customer->display_id : null),
                    'language_pair' => $langPair,
                    'source_flag' => $sourceFlag,
                    'target_flag' => $targetFlag,
                ],
                'backgroundColor' => $appointment->color ?: $color,
                'borderColor' => $appointment->color ?: $color,
                'textColor' => '#ffffff',
            ];
        }

        return response()->json($events);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'type' => 'required|string',
            'location' => 'nullable|string',
            'project_id' => 'nullable|exists:projects,id',
            'customer_id' => 'nullable|exists:customers,id',
            'partner_id' => 'nullable|exists:partners,id',
            'color' => 'nullable|string',
        ]);

        $appointment = Appointment::create($validated);
        return response()->json($appointment, 201);
    }

    public function show($id)
    {
        return response()->json(Appointment::with(['customer', 'partner', 'project'])->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $appointment = Appointment::findOrFail($id);

        $validated = $request->validate([
            'title' => 'string',
            'description' => 'nullable|string',
            'start_date' => 'date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'type' => 'string',
            'location' => 'nullable|string',
            'project_id' => 'nullable|exists:projects,id',
            'customer_id' => 'nullable|exists:customers,id',
            'partner_id' => 'nullable|exists:partners,id',
            'color' => 'nullable|string',
            'status' => 'string',
        ]);

        $appointment->update($validated);
        return response()->json($appointment);
    }

    public function destroy($id)
    {
        Appointment::findOrFail($id)->delete();
        return response()->json(['message' => 'Appointment deleted']);
    }
}
