-- Создание базы данных для проекта АгроЗаявки
-- Выполните этот скрипт в MySQL для создания необходимых таблиц

-- Создание базы данных
CREATE DATABASE IF NOT EXISTS shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shop;

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'user') DEFAULT 'user',
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Таблица товаров/продуктов
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    storage_temp VARCHAR(50),
    storage_humidity VARCHAR(50),
    shelf_life VARCHAR(100),
    seasonality VARCHAR(100),
    packaging VARCHAR(255),
    special_care TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Таблица наборов/комплектов
CREATE TABLE IF NOT EXISTS sets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Связующая таблица между наборами и продуктами
CREATE TABLE IF NOT EXISTS set_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    set_id INT,
    product_id INT,
    quantity INT DEFAULT 1,
    FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Таблица заявок
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('seeds', 'fertilizers', 'equipment', 'consultation', 'other') DEFAULT 'other',
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    quantity INT,
    unit VARCHAR(50),
    delivery_address TEXT,
    delivery_date DATE,
    budget DECIMAL(10,2),
    assigned_manager_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_manager_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Таблица комментариев к заявкам
CREATE TABLE IF NOT EXISTS application_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT,
    user_id INT,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Таблица файлов к заявкам
CREATE TABLE IF NOT EXISTS application_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Вставка тестовых данных
INSERT IGNORE INTO users (username, email, password_hash, role, first_name, last_name) VALUES
('admin', 'admin@agrozayavki.ru', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Иван', 'Админов'),
('manager', 'manager@agrozayavki.ru', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', 'Анна', 'Менеджерова'),
('user', 'user@agrozayavki.ru', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'Петр', 'Пользователев');

INSERT INTO products (name, category, storage_temp, storage_humidity, shelf_life, seasonality, packaging, special_care, description) VALUES
('Пшеница озимая', 'Зерновые', '5-15°C', '12-14%', '2 года', 'Осенний посев', 'Мешки 50кг', 'Защита от влаги', 'Высококачественная озимая пшеница для посева'),
('Семена подсолнечника', 'Масличные', '0-10°C', '6-8%', '18 месяцев', 'Весенний посев', 'Мешки 25кг', 'Защита от грызунов', 'Гибридные семена подсолнечника высокой масличности'),
('Удобрение NPK 16:16:16', 'Удобрения', '15-25°C', 'Не критично', '3 года', 'Круглый год', 'Мешки 40кг', 'Защита от влаги', 'Комплексное минеральное удобрение'),
('Гербицид Раундап', 'Химикаты', '5-25°C', 'Сухое место', '5 лет', 'Весна-лето', 'Канистры 20л', 'Соблюдение мер безопасности', 'Системный гербицид сплошного действия'),
('Томаты семена', 'Овощные', '5-15°C', '40-60%', '4-5 лет', 'Весна', 'Пакеты 1г', 'Защита от света и влаги', 'Семена томатов гибрид F1');

INSERT INTO sets (name, description) VALUES
('Стартовый набор для зерновых', 'Комплект семян и удобрений для начинающих'),
('Профессиональный набор овощевода', 'Полный комплект для выращивания овощей'),
('Набор защиты растений', 'Комплект средств защиты от вредителей и болезней');

INSERT INTO set_products (set_id, product_id, quantity) VALUES
(1, 1, 10),  -- Пшеница в стартовом наборе
(1, 3, 5),   -- Удобрение в стартовом наборе
(2, 5, 20),  -- Томаты в профессиональном наборе
(2, 3, 3),   -- Удобрение в профессиональном наборе
(3, 4, 2);   -- Гербицид в наборе защиты

-- Тестовые заявки
INSERT IGNORE INTO applications (user_id, title, description, category, status, priority, quantity, unit, delivery_address, delivery_date, budget, assigned_manager_id) VALUES
(3, 'Закупка семян пшеницы озимой', 'Необходимо приобрести семена пшеницы озимой для посева на площади 100 га', 'seeds', 'pending', 'high', 5000, 'кг', 'г. Краснодар, ул. Полевая, 15', '2025-09-15', 250000.00, 2),
(3, 'Консультация по защите растений', 'Требуется консультация специалиста по защите озимых культур от вредителей', 'consultation', 'in_progress', 'medium', 1, 'услуга', 'г. Краснодар, ул. Полевая, 15', '2025-07-01', 15000.00, 2),
(3, 'Поставка удобрений NPK', 'Закупка комплексного удобрения для весенней подкормки', 'fertilizers', 'completed', 'medium', 2000, 'кг', 'г. Краснодар, ул. Полевая, 15', '2025-03-20', 80000.00, 2),
(1, 'Закупка нового трактора', 'Требуется современный трактор для обработки полей', 'equipment', 'pending', 'urgent', 1, 'шт', 'г. Ростов-на-Дону, пр. Агропромышленный, 45', '2025-08-01', 3500000.00, 2),
(1, 'Семена подсолнечника гибрид', 'Закупка гибридных семян подсолнечника для посева', 'seeds', 'in_progress', 'high', 500, 'кг', 'г. Ростов-на-Дону, пр. Агропромышленный, 45', '2025-04-15', 75000.00, 2);
