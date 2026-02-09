<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;

class LanguageController extends Controller
{

    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        $cacheKey = "languages_all_{$tenantId}";
        return Cache::remember($cacheKey, 86400, function () {
            return \App\Models\Language::all();
        });
    }

    public function store(Request $request)
    {
        $tenantId = Auth::user()->tenant_id;
        $cacheKey = "languages_all_{$tenantId}";
        $validated = $request->validate([
            'iso_code' => 'required|string|max:10',
            'name_internal' => 'required|string',
            'name_native' => 'required|string',
            'flag_icon' => 'nullable|string',
            'is_source_allowed' => 'boolean',
            'is_target_allowed' => 'boolean',
            'status' => 'in:active,archived',
        ]);

        $language = \App\Models\Language::create($validated);
        Cache::forget($cacheKey);
        return response()->json($language, 201);
    }

    public function show($id)
    {
        return response()->json(\App\Models\Language::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $cacheKey = "languages_all_{$tenantId}";
        $language = \App\Models\Language::findOrFail($id);

        $validated = $request->validate([
            'iso_code' => 'string|max:10',
            'name_internal' => 'string',
            'name_native' => 'string',
            'flag_icon' => 'nullable|string',
            'is_source_allowed' => 'boolean',
            'is_target_allowed' => 'boolean',
            'status' => 'in:active,archived',
        ]);

        $language->update($validated);
        Cache::forget($cacheKey);
        return response()->json($language);
    }

    public function destroy($id)
    {
        $tenantId = Auth::user()->tenant_id;
        $cacheKey = "languages_all_{$tenantId}";
        \App\Models\Language::findOrFail($id)->delete();
        Cache::forget($cacheKey);
        return response()->json(['message' => 'Language deleted']);
    }
}
