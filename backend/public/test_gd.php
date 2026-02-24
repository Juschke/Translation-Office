<?php
header('Content-Type: text/plain');

echo "SAPI: " . php_sapi_name() . "\n";
echo "INI: " . php_ini_loaded_file() . "\n";
echo "Testing imagecreatetruecolor exists: " . (function_exists('imagecreatetruecolor') ? 'YES' : 'NO') . "\n";

try {
    if (!function_exists("imagecreatetruecolor")) {
        throw new \Exception("The PHP GD extension is required, but is not installed.");
    }
    echo "Check passed: No exception thrown.\n";

    $img = imagecreatetruecolor(10, 10);
    echo "Call successful: Image created.\n";
    imagedestroy($img);
} catch (\Exception $e) {
    echo "Check failed: " . $e->getMessage() . "\n";
}

require __DIR__ . '/../vendor/autoload.php';

echo "Testing Dompdf generation...\n";
try {
    $dompdf = new \Dompdf\Dompdf();
    $dompdf->loadHtml('<h1>Hello World</h1>');
    $dompdf->setPaper('A4', 'portrait');
    $dompdf->render();
    echo "Dompdf render successful.\n";
} catch (\Throwable $e) {
    echo "Dompdf error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
