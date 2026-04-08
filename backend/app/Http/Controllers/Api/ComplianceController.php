<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ComplianceService;
use Illuminate\Http\Request;

class ComplianceController extends Controller
{
    protected $complianceService;

    public function __construct(ComplianceService $complianceService)
    {
        $this->complianceService = $complianceService;
    }

    public function summary(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $summary = $this->complianceService->getHealthSummary($tenantId);

        return response()->json($summary);
    }
}
