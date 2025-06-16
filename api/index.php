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
    case 'applications':
        require 'applications.php';
        break;
    case 'auth':
        require 'auth.php';
        break;
    case 'login':
        require 'login.php';
        break;
    default:
        // Публичные ресурсы
        if ($resource !== 'login' && strpos($resource, 'images') === false) {
            header('Content-Type: application/json');
            http_response_code(404);
            echo json_encode(['error' => 'Resource not found']);
        } else {
            http_response_code(404);
        }
}
?>
