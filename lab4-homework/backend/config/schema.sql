-- schema.sql - Lab 4 Homework (ShopAdmin)
-- The server runs these statements automatically on start-up (CREATE ... IF NOT EXISTS),
-- you can also run this file by hand in MySQL Workbench.

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  age           TINYINT UNSIGNED NULL,
  gender        ENUM('male', 'female', 'other') NOT NULL DEFAULT 'other',
  email         VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url    VARCHAR(255) NULL,
  type          ENUM('normal', 'admin') NOT NULL DEFAULT 'normal',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS categories (
  id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  CONSTRAINT uq_categories_name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS products (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  name        VARCHAR(150) NOT NULL,
  quantity    INT UNSIGNED NOT NULL DEFAULT 0,
  price       DECIMAL(15, 2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id)
    REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE
);
