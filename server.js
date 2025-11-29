import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(express.static(path.join(__dirname, 'dist')));

// Database Configuration
// In a real production environment, use process.env variables.
// For this setup, we default to the standard local config.
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'telegram_shop_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create Connection Pool
const pool = mysql.createPool(dbConfig);

// Initialize Database Tables
const initDb = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Products Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        price DECIMAL(15,0),
        stock INT DEFAULT 0,
        description TEXT,
        image_url LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Orders Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        customer_name VARCHAR(255),
        total DECIMAL(15,0),
        status VARCHAR(50) DEFAULT 'pending',
        items_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Users Table (Bot Users)
    await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          chat_id BIGINT PRIMARY KEY,
          name VARCHAR(255),
          phone_number VARCHAR(20),
          registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

    connection.release();
    console.log('✅ Database tables initialized.');
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    console.error('   Please ensure MySQL is running and the database exists.');
  }
};

initDb();

// --- API Endpoints ---

// 1. Dashboard Stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [products] = await pool.query('SELECT COUNT(*) as count FROM products');
    const [orders] = await pool.query('SELECT COUNT(*) as count FROM orders');
    const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [sales] = await pool.query('SELECT SUM(total) as total FROM orders WHERE status = "completed"');

    // Mock weekly data for chart (in a real app, you'd aggregate this via SQL)
    const chartData = [
      { name: 'شنبه', sales: 0, orders: 0 },
      { name: 'یکشنبه', sales: 0, orders: 0 },
      { name: 'دوشنبه', sales: 0, orders: 0 },
      { name: 'سه‌شنبه', sales: 0, orders: 0 },
      { name: 'چهارشنبه', sales: 0, orders: 0 },
      { name: 'پنجشنبه', sales: 0, orders: 0 },
      { name: 'جمعه', sales: 0, orders: 0 },
    ];

    res.json({
      totalSales: sales[0].total || 0,
      totalOrders: orders[0].count || 0,
      totalUsers: users[0].count || 0,
      chartData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Products
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    // Map database fields to frontend types if necessary (snake_case to camelCase)
    const products = rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      price: Number(row.price),
      stock: row.stock,
      description: row.description,
      imageUrl: row.image_url
    }));
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { id, name, category, price, stock, description, imageUrl } = req.body;
    await pool.query(
      'INSERT INTO products (id, name, category, price, stock, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, category, price, stock, description, imageUrl]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, category, price, stock, description, imageUrl } = req.body;
    await pool.query(
      'UPDATE products SET name=?, category=?, price=?, stock=?, description=?, image_url=? WHERE id=?',
      [name, category, price, stock, description, imageUrl, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Categories (Derived from Products)
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != ""');
    const categories = rows.map(r => r.category);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Orders
app.get('/api/orders', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    const orders = rows.map(row => ({
        id: row.id,
        customerName: row.customer_name,
        total: Number(row.total),
        status: row.status,
        date: new Date(row.created_at).toLocaleDateString('fa-IR'),
        items: row.items_count
    }));
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Catch-all for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Access the app at http://localhost:${PORT}`);
});