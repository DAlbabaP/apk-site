-- Создайте базу данных (если ещё не создана)
CREATE DATABASE IF NOT EXISTS shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shop;

-- Таблица товаров
CREATE TABLE IF NOT EXISTS products (
 id INT AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(255) NOT NULL,
 category VARCHAR(50) NOT NULL,
 storage_temp INT,
 storage_humidity INT,
 shelf_life INT,
 seasonality VARCHAR(20),
 packaging VARCHAR(20),
 special_care VARCHAR(20),
 description TEXT
);

-- Таблица наборов
CREATE TABLE IF NOT EXISTS sets (
 id INT AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(255) NOT NULL,
 type VARCHAR(50) NOT NULL,
 description TEXT
);

-- Связующая таблица "товары в наборе"
CREATE TABLE IF NOT EXISTS set_products (
 set_id INT NOT NULL,
 product_id INT NOT NULL,
 PRIMARY KEY (set_id, product_id),
 FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE,
 FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
