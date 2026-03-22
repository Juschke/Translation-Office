<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Project;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

$user = User::first();
Auth::login($user);
$tenantId = $user->tenant_id;
$startDate = \Carbon\Carbon::now()->startOfMonth();
$endDate = \Carbon\Carbon::now()->endOfMonth();

$target = Project::join('languages', 'projects.target_lang_id', '=', 'languages.id')
    ->select('languages.name_internal as label', DB::raw('SUM(projects.price_total) as value'))
    ->where('projects.tenant_id', $tenantId)
    ->groupBy('languages.name_internal')
    ->get();

$source = Project::join('languages', 'projects.source_lang_id', '=', 'languages.id')
    ->select('languages.name_internal as label', DB::raw('SUM(projects.price_total) as value'))
    ->where('projects.tenant_id', $tenantId)
    ->groupBy('languages.name_internal')
    ->get();

echo "TARGET:\n";
print_r($target->toArray());
echo "SOURCE:\n";
print_r($source->toArray());
