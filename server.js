import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// Database Configuration
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

// --- GLOBAL VARIABLES ---
let botInstance = null;

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

    // Categories Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL
      )
    `);

    // Seed default categories
    const [catCount] = await connection.query('SELECT COUNT(*) as count FROM categories');
    if (catCount[0].count === 0) {
        await connection.query('INSERT IGNORE INTO categories (name) VALUES ("الکترونیک"), ("لوازم جانبی"), ("پوشاک")');
    }

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

    // Settings Table (For Bot Configuration)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value TEXT
      )
    `);

    connection.release();
    console.log('✅ Database tables initialized.');
    
    // Start the bot after DB is ready
    await startBot();

  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
  }
};

initDb();

// --- HELPER FUNCTIONS ---

async function getSetting(key) {
    try {
        const [rows] = await pool.query('SELECT setting_value FROM settings WHERE setting_key = ?', [key]);
        return rows.length > 0 ? rows[0].setting_value : null;
    } catch (e) {
        return null;
    }
}

async function setSetting(key, value) {
    await pool.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', [key, value, value]);
}

// --- BOT LOGIC ---

async function startBot() {
    // 1. Stop existing bot if running
    if (botInstance) {
        console.log('🔄 Stopping existing bot instance...');
        try {
            await botInstance.stopPolling();
        } catch (e) { console.error('Error stopping bot:', e); }
        botInstance = null;
    }

    // 2. Fetch Token from DB (preferred) or Env
    let token = await getSetting('bot_token');
    if (!token) token = process.env.BOT_TOKEN;

    if (!token || token.length < 20) {
        console.log('⚠️ Bot Token not set. Bot is offline.');
        return;
    }

    // 3. Fetch Configuration
    const welcomeMessage = (await getSetting('welcome_message')) || 'سلام! به فروشگاه ما خوش آمدید 🌹';
    const btnSearch = (await getSetting('btn_search_text')) || '🔍 جستجوی نام';
    const btnCode = (await getSetting('btn_code_text')) || '🔢 جستجوی کد';
    const btnCategory = (await getSetting('btn_cat_text')) || '📂 دسته‌بندی‌ها';
    const btnCart = (await getSetting('btn_cart_text')) || '🛒 سبد خرید';
    const btnSignUp = (await getSetting('btn_signup_text')) || '📱 ثبت نام با شماره موبایل';

    console.log(`🤖 Starting Bot with token: ${token.substring(0, 10)}...`);

    try {
        botInstance = new TelegramBot(token, { polling: true });

        // Error Handling
        botInstance.on('polling_error', (error) => {
            console.log(`[Bot Error] ${error.code}: ${error.message}`);
        });

        // /start Command
        botInstance.onText(/\/start/, async (msg) => {
            const chatId = msg.chat.id;
            try {
                // Check if user exists
                const [users] = await pool.query('SELECT * FROM users WHERE chat_id = ?', [chatId]);
                
                if (users.length > 0) {
                    // Show Main Menu
                    sendMainMenu(chatId, welcomeMessage, { btnSearch, btnCode, btnCategory, btnCart });
                } else {
                    // Request Contact
                    botInstance.sendMessage(chatId, 'برای استفاده از خدمات ربات، لطفا ابتدا شماره تماس خود را تایید کنید 👇', {
                        reply_markup: {
                            keyboard: [[{ text: btnSignUp, request_contact: true }]],
                            resize_keyboard: true,
                            one_time_keyboard: true
                        }
                    });
                }
            } catch (err) {
                console.error(err);
            }
        });

        // Contact Handler
        botInstance.on('contact', async (msg) => {
            const chatId = msg.chat.id;
            const contact = msg.contact;
            if (contact && contact.user_id === chatId) {
                await pool.query(
                    'INSERT INTO users (chat_id, name, phone_number) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE phone_number = ?',
                    [chatId, contact.first_name, contact.phone_number, contact.phone_number]
                );
                await botInstance.sendMessage(chatId, '✅ ثبت نام شما با موفقیت انجام شد!', {
                    reply_markup: { remove_keyboard: true }
                });
                sendMainMenu(chatId, welcomeMessage, { btnSearch, btnCode, btnCategory, btnCart });
            }
        });

        // Callback Query Handler
        botInstance.on('callback_query', async (query) => {
            const chatId = query.message.chat.id;
            const data = query.data;

            if (data === 'categories') {
                const [cats] = await pool.query('SELECT name FROM categories ORDER BY name');
                if (cats.length > 0) {
                    const buttons = cats.map(c => [{ text: c.name, callback_data: `cat_${c.name}` }]);
                    botInstance.sendMessage(chatId, 'لطفا دسته مورد نظر را انتخاب کنید:', {
                        reply_markup: { inline_keyboard: buttons }
                    });
                } else {
                    botInstance.sendMessage(chatId, 'هنوز دسته‌بندی وجود ندارد.');
                }
            } else if (data === 'cart') {
                botInstance.sendMessage(chatId, 'سبد خرید شما در حال حاضر خالی است. لطفا محصولات را به سبد اضافه کنید.');
            } else if (data === 'search') {
                botInstance.sendMessage(chatId, 'لطفا نام محصول را بنویسید:');
            } else if (data === 'search_code') {
                botInstance.sendMessage(chatId, 'لطفا کد محصول را وارد کنید:');
            } else if (data.startsWith('cat_')) {
                const catName = data.split('cat_')[1];
                botInstance.sendMessage(chatId, `محصولات دسته ${catName}: \n(لیست محصولات اینجا نمایش داده می‌شود)`);
            }
        });

    } catch (err) {
        console.error('Failed to start bot:', err);
    }
}

function sendMainMenu(chatId, message, btns) {
    if (!botInstance) return;
    botInstance.sendMessage(chatId, message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: btns.btnSearch, callback_data: 'search' }, { text: btns.btnCode, callback_data: 'search_code' }],
                [{ text: btns.btnCategory, callback_data: 'categories' }, { text: btns.btnCart, callback_data: 'cart' }]
            ]
        }
    });
}


// --- API ENDPOINTS ---

// 0. Settings API
app.get('/api/settings', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM settings');
        const settings = {};
        rows.forEach(row => { settings[row.setting_key] = row.setting_value });
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        const { 
            bot_token, channel_id, welcome_message, 
            btn_search_text, btn_code_text, btn_cat_text, btn_cart_text, btn_signup_text 
        } = req.body;

        await setSetting('bot_token', bot_token);
        await setSetting('channel_id', channel_id);
        await setSetting('welcome_message', welcome_message);
        await setSetting('btn_search_text', btn_search_text);
        await setSetting('btn_code_text', btn_code_text);
        await setSetting('btn_cat_text', btn_cat_text);
        await setSetting('btn_cart_text', btn_cart_text);
        await setSetting('btn_signup_text', btn_signup_text);

        // Restart bot with new settings
        await startBot();

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 1. Dashboard Stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [products] = await pool.query('SELECT COUNT(*) as count FROM products');
    const [orders] = await pool.query('SELECT COUNT(*) as count FROM orders');
    const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [sales] = await pool.query('SELECT SUM(total) as total FROM orders WHERE status = "completed"');

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

// 3. Categories
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT name FROM categories ORDER BY name');
    const categories = rows.map(r => r.name);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });
        await pool.query('INSERT IGNORE INTO categories (name) VALUES (?)', [name]);
        res.json({ success: true });
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

// Catch-all
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});