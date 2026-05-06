<?php
// Simple redirect to react-app for Local Live Link compatibility
// This bypasses WordPress completely for the frontend

$uri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($uri, PHP_URL_PATH);
$path = trim($path, '/');

// WordPress admin and API still work
if (strpos($uri, '/wp-admin') === 0 || 
    strpos($uri, '/wp-login') === 0 ||
    strpos($uri, '/wp-json') === 0 ||
    strpos($uri, '/graphql') === 0 ||
    strpos($uri, '/wp-content') === 0) {
    require __DIR__ . '/wp-blog-header.php';
    exit;
}

// Everything else goes to React
$react_index = __DIR__ . '/react-app/index.html';
if (file_exists($react_index)) {
    $content = file_get_contents($react_index);
    // Fix paths for subfolder
    $content = str_replace('href="./', 'href="/react-app/', $content);
    $content = str_replace('src="./', 'src="/react-app/', $content);
    echo $content;
} else {
    http_response_code(404);
    echo "React app not found";
}
?>
