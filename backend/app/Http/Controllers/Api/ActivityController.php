<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

class ActivityController extends Controller
{
    public function index()
    {
        // For a single tenant app, we might want to filter logs by related models if possible
        // But Spatie logs don't have tenant_id out of the box unless we add it to the activity_log table.
        // For now, we return all logs sorted by date.
        return response()->json(Activity::with('causer')->latest()->limit(100)->get());
    }

    public function show($id)
    {
        return response()->json(Activity::with('causer')->findOrFail($id));
    }
}
