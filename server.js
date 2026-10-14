const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Servir archivos del frontend desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Pool de conexión optimizado hacia MySQL en XAMPP
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'sneakers_store', 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error crítico al conectar con MySQL en XAMPP:', err.message);
  } else {
    console.log('🚀 Conexión exitosa con la base de datos en XAMPP.');
    connection.release();
  }
});

// ==========================================
// ENDPOINTS DE LA API (RUTAS ACADÉMICAS)
// ==========================================

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ exito: false, mensaje: 'Campos incompletos' });
  }

  const query = 'SELECT nombre, rol FROM usuarios WHERE email = ? AND password = ?';
  db.execute(query, [email, password], (err, results) => {
    if (err) return res.status(500).json({ exito: false, mensaje: err.message });
    
    if (results.length > 0) {
      res.json({ exito: true, nombre: results[0].nombre, rol: results[0].rol });
    } else {
      res.status(401).json({ exito: false, mensaje: 'Usuario o contraseña incorrectos.' });
    }
  });
});

app.post('/api/register', (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password) {
    return res.status(400).json({ exito: false, mensaje: 'Por favor, llena todos los campos.' });
  }

  const queryInsert = 'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, "cliente")';
  db.execute(queryInsert, [nombre, email, password], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ exito: false, mensaje: 'El correo electrónico ya está registrado.' });
      }
      return res.status(500).json({ exito: false, mensaje: err.message });
    }
    res.json({ exito: true, nombre, rol: 'cliente' });
  });
});

app.get('/api/admin/stats', (req, res) => {
  const query = `
    SELECT 
      COUNT(*) as total_modelos, 
      SUM(stock) as stock_total, 
      SUM(CASE WHEN stock <= 3 THEN 1 ELSE 0 END) as stock_bajo 
    FROM productos`;
    
  db.execute(query, [], (err, results) => {
    if (err) return res.status(500).json({ exito: false, mensaje: err.message });
    res.json({ exito: true, data: results });
  });
});

app.get('/api/admin/productos', (req, res) => {
  const query = 'SELECT id, nombre, marca, precio, stock FROM productos ORDER BY id DESC';
  db.execute(query, [], (err, results) => {
    if (err) return res.status(500).json({ exito: false, mensaje: err.message });
    res.json({ exito: true, productos: results });
  });
});

app.put('/api/admin/productos/stock', (req, res) => {
  const { id, nuevoStock, usuarioAdmin } = req.body;
  
  db.getConnection((err, connection) => {
    if (err) return res.status(500).json({ exito: false, mensaje: err.message });

    connection.beginTransaction(err => {
      if (err) { connection.release(); return res.status(500).json({ exito: false, mensaje: err.message }); }

      connection.execute('SELECT nombre, stock FROM productos WHERE id = ?', [id], (err, rows) => {
        if (err || rows.length === 0) {
          return connection.rollback(() => { connection.release(); res.status(404).json({ exito: false, mensaje: 'Producto no encontrado' }); });
        }

        const producto = rows[0];
        const stockAnterior = producto.stock;

        connection.execute('UPDATE productos SET stock = ? WHERE id = ?', [nuevoStock, id], (err) => {
          if (err) {
            return connection.rollback(() => { connection.release(); res.status(500).json({ exito: false, mensaje: err.message }); });
          }

          const descripcionBitacora = `${usuarioAdmin} modificó el stock de "${producto.nombre}" (ID: #${id}). De ${stockAnterior} u. a ${nuevoStock} u.`;
          connection.execute('INSERT INTO bitacora (descripcion, fecha) VALUES (?, NOW())', [descripcionBitacora], (err) => {
            if (err) {
              return connection.rollback(() => { connection.release(); res.status(500).json({ exito: false, mensaje: err.message }); });
            }

            connection.commit(err => {
              if (err) {
                return connection.rollback(() => { connection.release(); res.status(500).json({ exito: false, mensaje: err.message }); });
              }
              connection.release();
              res.json({ exito: true, mensaje: 'Inventario sincronizado con éxito.' });
            });
          });
        });
      });
    });
  });
});

app.get('/api/admin/movimientos', (req, res) => {
  const query = 'SELECT id, descripcion, fecha FROM bitacora ORDER BY id DESC LIMIT 15';
  db.execute(query, [], (err, results) => {
    if (err) return res.status(500).json({ exito: false, mensaje: err.message });
    res.json({ exito: true, movimientos: results });
  });
});

// Solución definitiva de enrutamiento compatible con Node v24
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



app.listen(PORT, () => {
  console.log(`🎯 Servidor escolar corriendo en http://localhost:${PORT}`);
});
