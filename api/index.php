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
    case 'users':
    case 'register':
    case 'login':
    case 'logout':
    case 'me':
        require 'users.php';
        break;
    default:
        header('Content-Type: application/json');
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
}
?>
