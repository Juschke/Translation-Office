<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::first();
\Illuminate\Support\Facades\Auth::login($user);

$payload = [
  "type" => "invoice", 
  "invoice_number" => "Wird automatisch generiert", 
  "date" => "2026-02-20",
  "amount_due" => 123.76,
  "amount_gross" => 123.76,
  "amount_net" => 104,
  "amount_tax" => 19.76,
  "currency" => "EUR",
  "customer_id" => 1,
  "delivery_date" => "2026-02-20",
  "discount" => "0.00",
  "due_date" => "2026-02-20",
  "items" => [[
      "id" => "1", 
      "description" => "Übersetzung", 
      "quantity" => 55, 
      "unit" => "Normzeile", 
      "price" => 1.8, 
      "total" => 99
  ]],
  "notes" => "",
  "paid_amount" => "0.00",
  "project_id" => "1",
  "service_period" => "Jan 2026 - Jan 2026",
  "shipping" => "0.00",
  "status" => "draft",
  "tax_exemption" => "none",
  "tax_rate" => "19.00"
];

$request = \Illuminate\Http\Request::create('/api/invoices', 'POST', $payload);
$request->setUserResolver(function() use ($user) { return $user; });

function runStore($request) {
    try {
        $controller = new \App\Http\Controllers\Api\InvoiceController();
        $response = $controller->store($request);
        echo "Response Status: " . $response->getStatusCode() . "\n";
        echo "Response Content: " . $response->getContent() . "\n";
    } catch (\Illuminate\Validation\ValidationException $e) {
        echo "Validation Error: \n";
        print_r($e->errors());
    } catch (\Exception $e) {
        echo "Exception: " . $e->getMessage() . "\n";
        echo $e->getTraceAsString() . "\n";
    }
}
runStore($request);
