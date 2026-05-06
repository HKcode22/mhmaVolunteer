<?php
/**
 * WordPress React Frontend Bridge - SERVER MODE
 * Proxies requests to Next.js server at localhost:3000
 */

$request_uri = $_SERVER['REQUEST_URI'];

// Allow WordPress admin, API, and uploads to work normally
if (strpos($request_uri, '/wp-admin') === 0 ||
    strpos($request_uri, '/wp-login.php') === 0 ||
    strpos($request_uri, '/wp-json') === 0 ||
    strpos($request_uri, '/graphql') === 0 ||
    strpos($request_uri, '/wp-content/uploads') === 0) {
    require dirname(__FILE__) . '/wp-blog-header.php';
    exit;
}

// Proxy to Next.js server
$nextjs_url = 'http://localhost:3000' . $request_uri;

// Initialize cURL
$ch = curl_init($nextjs_url);

// Forward all headers
foreach (getallheaders() as $name => $value) {
    // Skip certain headers
    if (strtolower($name) !== 'host') {
        curl_setopt($ch, CURLOPT_HTTPHEADER, ["$name: $value"]);
    }
}

// Set cURL options
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);

// Forward POST data
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
}

// Execute the request
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

// Set response headers
if ($content_type) {
    header("Content-Type: $content_type");
}
http_response_code($http_code);

// Output the response
echo $response;
?>
