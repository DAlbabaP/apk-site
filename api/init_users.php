<?php
// init_users.php — Скрипт для создания тестовых пользователей с правильными паролями
require_once 'db.php';

header('Content-Type: text/html; charset=utf-8');

echo "<h2>Инициализация тестовых пользователей</h2>";

// Тестовые пользователи
$testUsers = [
    // Администратор
    [
        'login' => 'admin',
        'password' => 'admin123',
        'full_name' => 'Администратор Системы',
        'email' => 'admin@agrozayavki.ru',
        'phone' => '79990000001',
        'role' => 'admin'
    ],
    // Менеджеры
    [
        'login' => 'manager',
        'password' => 'manager123',
        'full_name' => 'Иванов Иван Иванович',
        'email' => 'manager@agrozayavki.ru',
        'phone' => '79990000002',
        'role' => 'manager'
    ],
    [
        'login' => 'manager1',
        'password' => 'manager123',
        'full_name' => 'Сидоров Сергей Сергеевич',
        'email' => 's.sidorov@agrozayavki.ru',
        'phone' => '79990000004',
        'role' => 'manager'
    ],
    [
        'login' => 'manager2',
        'password' => 'manager123',
        'full_name' => 'Козлова Мария Александровна',
        'email' => 'm.kozlova@agrozayavki.ru',
        'phone' => '79990000005',
        'role' => 'manager'
    ],
    [
        'login' => 'manager3',
        'password' => 'manager123',
        'full_name' => 'Волков Дмитрий Николаевич',
        'email' => 'd.volkov@agrozayavki.ru',
        'phone' => '79990000006',
        'role' => 'manager'
    ],
    [
        'login' => 'manager4',
        'password' => 'manager123',
        'full_name' => 'Смирнова Анна Викторовна',
        'email' => 'a.smirnova@agrozayavki.ru',
        'phone' => '79990000007',
        'role' => 'manager'
    ],
    // Пользователи
    [
        'login' => 'user',
        'password' => 'user123',
        'full_name' => 'Петров Пётр Петрович',
        'email' => 'user@agrozayavki.ru',
        'phone' => '79990000003',
        'role' => 'user'
    ],
    [
        'login' => 'user1',
        'password' => 'user123',
        'full_name' => 'Новиков Алексей Владимирович',
        'email' => 'a.novikov@agrozayavki.ru',
        'phone' => '79990000008',
        'role' => 'user'
    ],
    [
        'login' => 'user2',
        'password' => 'user123',
        'full_name' => 'Морозова Елена Сергеевна',
        'email' => 'e.morozova@agrozayavki.ru',
        'phone' => '79990000009',
        'role' => 'user'
    ],
    [
        'login' => 'user3',
        'password' => 'user123',
        'full_name' => 'Лебедев Андрей Игоревич',
        'email' => 'a.lebedev@agrozayavki.ru',
        'phone' => '79990000010',
        'role' => 'user'
    ],
    [
        'login' => 'user4',
        'password' => 'user123',
        'full_name' => 'Федорова Ольга Михайловна',
        'email' => 'o.fedorova@agrozayavki.ru',
        'phone' => '79990000011',
        'role' => 'user'
    ],
    [
        'login' => 'user5',
        'password' => 'user123',
        'full_name' => 'Соколов Павел Дмитриевич',
        'email' => 'p.sokolov@agrozayavki.ru',
        'phone' => '79990000012',
        'role' => 'user'
    ],
    [
        'login' => 'user6',
        'password' => 'user123',
        'full_name' => 'Васильева Татьяна Анатольевна',
        'email' => 't.vasilieva@agrozayavki.ru',
        'phone' => '79990000013',
        'role' => 'user'
    ],
    [
        'login' => 'user7',
        'password' => 'user123',
        'full_name' => 'Кузнецов Максим Олегович',
        'email' => 'm.kuznetsov@agrozayavki.ru',
        'phone' => '79990000014',
        'role' => 'user'
    ],
    [
        'login' => 'user8',
        'password' => 'user123',
        'full_name' => 'Попова Светлана Валерьевна',
        'email' => 's.popova@agrozayavki.ru',
        'phone' => '79990000015',
        'role' => 'user'
    ],
    [
        'login' => 'user9',
        'password' => 'user123',
        'full_name' => 'Михайлов Роман Сергеевич',
        'email' => 'r.mikhailov@agrozayavki.ru',
        'phone' => '79990000016',
        'role' => 'user'
    ],
    [
        'login' => 'user10',
        'password' => 'user123',
        'full_name' => 'Николаева Ирина Павловна',
        'email' => 'i.nikolaeva@agrozayavki.ru',
        'phone' => '79990000017',
        'role' => 'user'
    ]
];

$created = 0;
$updated = 0;
$skipped = 0;

foreach ($testUsers as $userData) {
    // Проверяем, существует ли пользователь
    $stmt = $pdo->prepare('SELECT id, password FROM users WHERE login = ?');
    $stmt->execute([$userData['login']]);
    $existing = $stmt->fetch();
    
    $hashedPassword = password_hash($userData['password'], PASSWORD_BCRYPT);
    
    if ($existing) {
        // Обновляем пароль, если пользователь существует
        $stmt = $pdo->prepare('UPDATE users SET password = ?, full_name = ?, email = ?, phone = ?, role = ?, status = "active" WHERE login = ?');
        $stmt->execute([
            $hashedPassword,
            $userData['full_name'],
            $userData['email'],
            $userData['phone'],
            $userData['role'],
            $userData['login']
        ]);
        echo "<p>✓ Пользователь <strong>{$userData['login']}</strong> обновлён (пароль: <strong>{$userData['password']}</strong>)</p>";
        $updated++;
    } else {
        // Создаём нового пользователя
        $stmt = $pdo->prepare('INSERT INTO users (login, password, full_name, email, phone, role, status) VALUES (?, ?, ?, ?, ?, ?, "active")');
        $stmt->execute([
            $userData['login'],
            $hashedPassword,
            $userData['full_name'],
            $userData['email'],
            $userData['phone'],
            $userData['role']
        ]);
        echo "<p>✓ Пользователь <strong>{$userData['login']}</strong> создан (пароль: <strong>{$userData['password']}</strong>)</p>";
        $created++;
    }
}

echo "<hr>";
echo "<h3>Итого:</h3>";
echo "<p>Создано: $created</p>";
echo "<p>Обновлено: $updated</p>";
echo "<hr>";

// Группируем пользователей по ролям для вывода
$usersByRole = [
    'admin' => [],
    'manager' => [],
    'user' => []
];

foreach ($testUsers as $user) {
    $usersByRole[$user['role']][] = $user;
}

echo "<h3>Демо-аккаунты для входа:</h3>";

echo "<h4>Администраторы:</h4>";
echo "<ul>";
foreach ($usersByRole['admin'] as $user) {
    echo "<li><strong>{$user['login']}</strong> / <strong>{$user['password']}</strong> - {$user['full_name']}</li>";
}
echo "</ul>";

echo "<h4>Менеджеры (" . count($usersByRole['manager']) . "):</h4>";
echo "<ul>";
foreach ($usersByRole['manager'] as $user) {
    echo "<li><strong>{$user['login']}</strong> / <strong>{$user['password']}</strong> - {$user['full_name']}</li>";
}
echo "</ul>";

echo "<h4>Пользователи (" . count($usersByRole['user']) . "):</h4>";
echo "<ul>";
foreach ($usersByRole['user'] as $user) {
    echo "<li><strong>{$user['login']}</strong> / <strong>{$user['password']}</strong> - {$user['full_name']}</li>";
}
echo "</ul>";

echo "<hr>";
echo "<p><strong>Всего аккаунтов:</strong> " . count($testUsers) . " (1 администратор, " . count($usersByRole['manager']) . " менеджеров, " . count($usersByRole['user']) . " пользователей)</p>";
echo "<p><a href='../login.html'>Перейти на страницу входа</a></p>";
?>

