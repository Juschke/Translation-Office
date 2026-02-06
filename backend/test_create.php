<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

try {
    Auth::login(User::first());
    $data = [
        "project_name" => "sdfdf",
        "customer_id" => 3,
        "partner_id" => 1,
        "source_lang_id" => 1,
        "target_lang_id" => 2,
        "deadline" => "2026-02-12T23:00:00.000Z",
        "priority" => "low",
        "is_certified" => true,
        "has_apostille" => true,
        "is_express" => true,
        "classification" => true,
        "copies_count" => 2,
        "copy_price" => 5,
        "price_total" => 0,
        "partner_cost_net" => 0,
        "down_payment" => 34,
        "down_payment_date" => "2026-02-05T13:05:03.459Z",
        "down_payment_note" => "sdfsdf",
        "notes" => "sdf"
    ];
    $project = Project::create($data);

    $positions = [
        [
            "description" => "Übersetzung",
            "unit" => "Normzeile",
            "amount" => 1,
            "quantity" => 1,
            "partner_rate" => 0,
            "partner_mode" => "unit",
            "partner_total" => 0,
            "customer_rate" => 0,
            "customer_mode" => "unit",
            "customer_total" => 0,
            "margin_type" => "markup",
            "margin_percent" => 0
        ]
    ];

    foreach ($positions as $posData) {
        $project->positions()->create($posData);
    }

    echo "SUCCESS ID: " . $project->id . " with " . $project->positions()->count() . " positions\n";
    print_r($project->load('positions')->toArray());
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "FILE: " . $e->getFile() . ":" . $e->getLine() . "\n";
}
