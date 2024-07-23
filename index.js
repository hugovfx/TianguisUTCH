const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const session = require('express-session');
const bodyParser = require('body-parser');
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

// Configuración de sesiones
app.use(session({
  secret: 'mi-secreto',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Cambia a `true` si estás usando HTTPS
}));

// Ruta para la página de inicio de sesión
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Ruta para el inicio de sesión (método POST)
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM users WHERE user_email = ? AND user_password = ?';
  
  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error en el servidor');
    }
    if (results.length > 0) {
      req.session.user = results[0];
      res.redirect('/');
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
    res.send('No has iniciado sesión.');
  }
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
app.post('/postProducto', (req, res) => {
  const { name, price, category, description } = req.body;
  // Aquí deberías tener la lógica para manejar el archivo de imagen y guardar la URL en la base de datos

  // Suponiendo que la lógica para manejar el archivo de imagen y guardarlo en la base de datos está implementada
  // Y tienes un ID de producto generado
  res.send('Producto publicado con éxito.');
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

// Ruta para manejar el cierre de sesión
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error al cerrar sesión');
    }
    res.redirect('/login');
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});

