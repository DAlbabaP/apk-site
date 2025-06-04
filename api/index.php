<?php
// index.php — роутинг API
$uri = explode('/', trim($_SERVER['REQUEST_URI'], '/'));
$apiIndex = array_search('api', $uri);
$resource = $uri[$apiIndex+1] ?? '';

switch ($resource) {
    case 'products':
        require 'products.php';
        break;
    case 'sets':
        require 'sets.php';
        break;
    default:
        // Только login и картинки публичны, остальное — 401
        if ($resource !== 'login' && strpos($resource, 'images') === false) {
            header('Content-Type: application/json');
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
        } else {
            http_response_code(404);
        }
}
?>
