<?php
header('Content-Type: application/json');
echo json_encode([
    'gd_loaded' => extension_loaded('gd'),
    'imagecreatetruecolor_exists' => function_exists('imagecreatetruecolor'),
    'php_version' => phpversion(),
    'php_ini' => php_ini_loaded_file(),
    'extensions' => get_loaded_extensions(),
]);
