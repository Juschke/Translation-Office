<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MailAccount;
use App\Models\MailTemplate;

class MailResourceController extends Controller
{
    // Accounts
    public function getAccounts()
    {
        return response()->json(MailAccount::all());
    }

    public function storeAccount(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email',
            'host' => 'required|string',
            'port' => 'required|integer',
            'encryption' => 'required|string',
            'username' => 'required|string',
            'password' => 'required|string',
            'is_default' => 'boolean',
        ]);

        if ($validated['is_default'] ?? false) {
            MailAccount::where('is_default', true)->update(['is_default' => false]);
        }

        $account = MailAccount::create($validated);
        return response()->json($account, 201);
    }
    public function updateAccount(Request $request, $id)
    {
        $account = MailAccount::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email',
            'host' => 'required|string',
            'port' => 'required|integer',
            'encryption' => 'required|string',
            'username' => 'required|string',
            'password' => 'nullable|string',
            'is_default' => 'boolean',
        ]);

        if ($validated['is_default'] ?? false) {
            MailAccount::where('id', '!=', $id)->update(['is_default' => false]);
        }
        
        if (empty($validated['password'])) {
            unset($validated['password']);
        }

        $account->update($validated);
        return response()->json($account);
    }

    public function deleteAccount($id)
    {
        MailAccount::destroy($id);
        return response()->json(null, 204);
    }
    // Templates
    public function getTemplates()
    {
        return response()->json(MailTemplate::all());
    }

    public function storeTemplate(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'subject' => 'required|string',
            'body' => 'required|string',
            'category' => 'nullable|string',
            'placeholders' => 'nullable|array',
        ]);

        $template = MailTemplate::create($validated);
        return response()->json($template, 201);
    }

    public function updateTemplate(Request $request, $id)
    {
        $template = MailTemplate::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string',
            'subject' => 'required|string',
            'body' => 'required|string',
            'category' => 'nullable|string',
            'placeholders' => 'nullable|array',
        ]);

        $template->update($validated);
        return response()->json($template);
    }

    public function deleteTemplate($id)
    {
        MailTemplate::destroy($id);
        return response()->json(null, 204);
    }

}
