<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\EmailTemplate;

class EmailTemplateController extends Controller
{
    public function index()
    {
        return response()->json(EmailTemplate::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'subject' => 'required|string',
            'body' => 'required|string',
            'type' => 'nullable|string',
            'status' => 'in:active,inactive',
        ]);

        $template = EmailTemplate::create($validated);
        return response()->json($template, 201);
    }

    public function show($id)
    {
        return response()->json(EmailTemplate::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $template = EmailTemplate::findOrFail($id);
        $validated = $request->validate([
            'name' => 'string',
            'subject' => 'string',
            'body' => 'string',
            'type' => 'nullable|string',
            'status' => 'in:active,inactive',
        ]);

        $template->update($validated);
        return response()->json($template);
    }

    public function destroy($id)
    {
        EmailTemplate::findOrFail($id)->delete();
        return response()->json(['message' => 'Email template deleted']);
    }
}
