const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const multer = require('multer');
const app = express();
const port = 3000;

// Configuración para la base de datos MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'soloyo77',
  database: 'dbAplicacionesWeb',
  port: 3306
});

// Conexión a la base de datos
db.connect(err => {
  if (err) throw err;
  console.log('Conectado a la base de datos MySQL.');
});

// Configuración de middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'mi-secreto',  // Asegúrate de usar una cadena secreta única
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Cambia a `true` si estás usando HTTPS
}));


// Configuración de multer para manejo de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Ruta para la página de inicio de sesión
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Ruta para el inicio de sesión (método POST)
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM users WHERE user_email = ?';

  db.query(query, [email], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error en el servidor');
    }
    if (results.length > 0) {
      const user = results[0];
      bcrypt.compare(password, user.user_password, (err, match) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error en el servidor');
        }
        if (match) {
          req.session.user = user;  // Guardar información del usuario en la sesión
          res.redirect('/');
        } else {
          res.redirect('/login');
        }
      });
    } else {
      res.redirect('/login');
    }
  });
});


// Ruta para la página principal
app.get('/', (req, res) => {
  if (req.session.user) {
    res.send(`Bienvenido ${req.session.user.user_nombre} ${req.session.user.user_apellido}!`);
  } else {
    res.redirect('/login'); // Redirigir a la página de login si no está autenticado
  }
});

app.use((req, res, next) => {
  console.log('Sesión:', req.session);
  next();
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error al cerrar sesión');
    }
    res.redirect('/login');
  });
});



// Ruta para la página de publicación de productos
app.get('/postProducto', (req, res) => {
  if (req.session.user) {
    res.sendFile(path.join(__dirname, 'public', 'postProducto.html'));
  } else {
    res.redirect('/login');
  }
});

// Ruta para manejar el formulario de publicación de productos (método POST)
app.post('/postProducto', upload.single('image'), (req, res) => {
  if (!req.session.user) {
    return res.status(403).send('No estás autenticado');
  }

  const { name, price, category, description } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const userId = req.session.user.id; // ID del usuario autenticado

  const query = `
    INSERT INTO products (name, price, category_id, description, image_id, user_id, active)
    VALUES (?, ?, ?, ?, (SELECT id FROM images WHERE url = ? LIMIT 1), ?, ?)
  `;
  const values = [name, price, category, description, imageUrl, userId, 1];

  db.query(query, values, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al publicar el producto');
    }
    res.send('Producto publicado con éxito.');
  });
});

// Ruta para obtener productos
app.get('/getProducts', (req, res) => {
  const query = `
    SELECT p.id, p.name, p.price, c.name AS category, p.description, i.url AS img
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN images i ON p.image_id = i.id
    WHERE p.active = 1;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error en el servidor');
    }
    res.json(results);
  });
});

// Ruta para obtener categorías
app.get('/getCategories', (req, res) => {
  const query = 'SELECT id, name FROM categories';

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error en el servidor');
    }
    res.json(results);
  });
});

// Ruta para obtener información del usuario autenticado
app.get('/user-info', (req, res) => {
  if (req.session.user) {
    res.json({
      isAuthenticated: true,
      userName: `${req.session.user.user_nombre} ${req.session.user.user_apellido}`
    });
  } else {
    res.json({
      isAuthenticated: false
    });
  }
});



// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});

// Ruta para la página principal
app.get('/main', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

// Ruta para obtener categorías
app.get('/api/categories', (req, res) => {
  const query = 'SELECT * FROM categories';

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error en el servidor');
    }
    res.json(results);
  });
});
