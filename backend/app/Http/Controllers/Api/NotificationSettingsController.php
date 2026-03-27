<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TenantSetting;
use Illuminate\Http\Request;

class NotificationSettingsController extends Controller
{
    private const KEY = 'notification_settings';

    private array $defaults = [
        'project_created'          => ['email' => true,  'app' => true],
        'project_status_changed'   => ['email' => true,  'app' => true],
        'deadline_reminder'        => ['email' => true,  'app' => true, 'days_before' => 3],
        'document_uploaded'        => ['email' => false, 'app' => true],
        'invoice_due'              => ['email' => true,  'app' => true, 'days_before' => 7],
        'invoice_overdue'          => ['email' => true,  'app' => true],
        'payment_received'         => ['email' => true,  'app' => true],
        'new_mail'                 => ['email' => false, 'app' => true],
        'partner_inquiry_replied'  => ['email' => true,  'app' => true],
    ];

    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $setting = TenantSetting::where('tenant_id', $tenantId)->where('key', self::KEY)->first();

        $stored = $setting ? json_decode($setting->value, true) : [];
        // Merge with defaults so new events always appear
        $merged = array_merge($this->defaults, $stored);

        return response()->json($merged);
    }

    public function update(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $data = $request->validate([
            '*.email'        => 'boolean',
            '*.app'          => 'boolean',
            '*.days_before'  => 'nullable|integer|min:1|max:365',
        ]);

        TenantSetting::updateOrCreate(
            ['tenant_id' => $tenantId, 'key' => self::KEY],
            ['value' => json_encode($data)]
        );

        return response()->json($data);
    }
}
