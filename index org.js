const express = require('express');
const multer = require('multer');
const axios = require('axios');
const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');
const pool = require('./db');

const app = express();
const port = 3000;

// Configurar Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para cargar la imagen
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const image = fs.readFileSync(imagePath);
    const base64Image = Buffer.from(image).toString('base64');

    const response = await axios.post('https://api.imgur.com/3/image', {
      image: base64Image,
      type: 'base64'
    }, {
      headers: {
        Authorization: 'TianguisUTCH2'
      }
    });

    const imgUrl = response.data.data.link;

    // Guardar URL en la base de datos
    pool.query('INSERT INTO images (url) VALUES (?)', [imgUrl], (error, results) => {
      if (error) throw error;
      fs.unlinkSync(imagePath); // Eliminar archivo local después de subir
      res.json({
        success: true,
        url: imgUrl
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Ruta para mostrar las imágenes
app.get('/images', (req, res) => {
  pool.query('SELECT * FROM images', (error, results) => {
    if (error) throw error;
    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
