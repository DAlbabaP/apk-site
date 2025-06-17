<?php
/**
 * Router для PHP встроенного сервера
 * Использование: php -S localhost:8080 router.php
 */

$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Удаляем параметры запроса для определения пути
$clean_path = strtok($path, '?');

// API запросы перенаправляем в папку api
if (strpos($clean_path, '/api/') === 0) {
    $api_file = __DIR__ . substr($clean_path, 0);
    
    // Если это запрос к конкретному API файлу
    if (is_file($api_file)) {
        require $api_file;
        return true;
    }
    
    // Иначе направляем в index.php API
    require __DIR__ . '/api/index.php';
    return true;
}

// Статические файлы (CSS, JS, изображения)
$file_path = __DIR__ . $clean_path;
if (is_file($file_path)) {
    // Определяем MIME тип
    $extension = pathinfo($file_path, PATHINFO_EXTENSION);
    $mime_types = [
        'css' => 'text/css',
        'js' => 'application/javascript',
        'html' => 'text/html',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'ico' => 'image/x-icon',
        'json' => 'application/json',
        'xml' => 'application/xml',
        'pdf' => 'application/pdf'
    ];
    
    if (isset($mime_types[$extension])) {
        header('Content-Type: ' . $mime_types[$extension]);
    }
    
    readfile($file_path);
    return true;
}

// HTML страницы
$html_files = [
    '/' => 'index.html',
    '/index' => 'index.html',
    '/login' => 'login.html',
    '/register' => 'register.html',
    '/dashboard-admin' => 'dashboard-admin.html',
    '/dashboard-manager' => 'dashboard-manager.html',
    '/dashboard-user' => 'dashboard-user.html',
    '/products-api' => 'products-api.html'
];

// Убираем расширение .html если есть и нормализуем путь
$route = rtrim($clean_path, '/');
if ($route === '') {
    $route = '/'; // Корневой путь
}
if (substr($route, -5) === '.html') {
    $route = substr($route, 0, -5);
}

if (isset($html_files[$route])) {
    $file = __DIR__ . '/' . $html_files[$route];
    if (is_file($file)) {
        header('Content-Type: text/html; charset=UTF-8');
        readfile($file);
        return true;
    }
}

// Если файл не найден, возвращаем 404
http_response_code(404);
echo "<!DOCTYPE html>
<html>
<head>
    <title>404 - Страница не найдена</title>
    <meta charset='utf-8'>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #e74c3c; }
    </style>
</head>
<body>
    <h1>404 - Страница не найдена</h1>
    <p>Запрашиваемая страница <code>$clean_path</code> не найдена.</p>
    <p><a href='/'>Вернуться на главную</a></p>
</body>
</html>";
return true;
?>
