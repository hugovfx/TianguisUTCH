const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const mysql = require('mysql2');
const path = require('path');

// Configuración del servidor Express
const app = express();
const port = 3000;

// Configuración para Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

// Configuración de conexión a MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'soloyo77',
  database: 'dbAplicacionesWeb'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database.');
});

// Middleware para servir archivos estáticos
app.use(express.static('public'));

// Ruta para mostrar el formulario
app.get('/postProduct.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'postProduct.html'));
});

// Ruta para manejar el formulario de subida de imágenes
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const image = fs.readFileSync(imagePath);
    const base64Image = Buffer.from(image).toString('base64');

    // Subir la imagen a Imgur
    const imgurResponse = await axios.post('https://api.imgur.com/3/image', {
      image: base64Image,
      type: 'base64'
    }, {
      headers: {
        Authorization: 'TianguisUTCH2'
      }
    });

    // Obtener la URL de la imagen subida
    const imageUrl = imgurResponse.data.data.link;

    // Guardar la URL en la base de datos
    db.query('INSERT INTO images (url) VALUES (?)', [imageUrl], (err, results) => {
      if (err) throw err;

      // Obtener el ID de la imagen
      const imageId = results.insertId;

      // Obtener el resto de los datos del producto
      const { name, price, category, description } = req.body;

      // Insertar el producto en la base de datos
      db.query('INSERT INTO products (name, price, category_id, description, image_id) VALUES (?, ?, ?, ?, ?)', [name, price, category, description, imageId], (err) => {
        if (err) throw err;

        // Eliminar el archivo local después de subir
        fs.unlinkSync(imagePath);

        res.send('Producto añadido exitosamente.');
      });
    });
  } catch (error) {
    res.status(500).send('Error al subir la imagen: ' + error.message);
  }
});

// Ruta para mostrar la página de marketplace
app.get('/marketplace.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'marketplace.html'));
});

// Ruta para obtener los productos publicados
app.get('/api/products', (req, res) => {
  db.query(`
    SELECT p.name, p.price, p.description, p.active, i.url AS image_url
    FROM products p
    JOIN images i ON p.image_id = i.id
  `, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Ruta para obtener las categorías
app.get('/api/categories', (req, res) => {
  db.query('SELECT id, name FROM categories', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Configurar el middleware para servir archivos de subida
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
