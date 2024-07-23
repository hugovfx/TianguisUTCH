# TianguisUTCH
En este repositorio se encuentra nuestro sitio web de proyecto integrador

```sql
CREATE TABLE images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  url VARCHAR(255) NOT NULL
);

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  category_id INT,
  description TEXT,
  image_id INT,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (image_id) REFERENCES images(id)
);

ALTER TABLE products
ADD COLUMN active TINYINT(1) DEFAULT 1;
