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
    
    // 1. Panel Users Table (Admins)
    await connection.query(`
        CREATE TABLE IF NOT EXISTS panel_users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(100),
            role VARCHAR(20) DEFAULT 'admin',
            last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Seed Initial Admin if provided in env (from installation script)
    if (process.env.ADMIN_INIT_USER && process.env.ADMIN_INIT_PASS) {
        // Simple check to see if table is empty or user doesn't exist
        const [rows] = await connection.query('SELECT * FROM panel_users WHERE username = ?', [process.env.ADMIN_INIT_USER]);
        if (rows.length === 0) {
            console.log(`👤 Seeding initial admin user: ${process.env.ADMIN_INIT_USER}`);
            await connection.query(
                'INSERT INTO panel_users (username, password, name, role) VALUES (?, ?, ?, ?)', 
                [process.env.ADMIN_INIT_USER, process.env.ADMIN_INIT_PASS, 'مدیر سیستم', 'admin']
            );
        }
    }

    // 2. Products Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(50),
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        price DECIMAL(15,0),
        stock INT DEFAULT 0,
        description TEXT,
        image_url LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    try {
        await connection.query("ALTER TABLE products ADD COLUMN code VARCHAR(50)");
    } catch (e) { }

    // 3. Categories Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL
      )
    `);

    const [catCount] = await connection.query('SELECT COUNT(*) as count FROM categories');
    if (catCount[0].count === 0) {
        await connection.query('INSERT IGNORE INTO categories (name) VALUES ("الکترونیک"), ("لوازم جانبی"), ("پوشاک")');
    }

    // 4. Orders Table
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

    // 5. Bot Users Table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          chat_id BIGINT PRIMARY KEY,
          name VARCHAR(255),
          phone_number VARCHAR(20),
          username VARCHAR(255),
          registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
    try {
        await connection.query("ALTER TABLE users ADD COLUMN username VARCHAR(255)");
    } catch (e) { }

    // 6. Settings Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value TEXT
      )
    `);

    connection.release();
    console.log('✅ Database tables initialized.');
    
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
    } catch (e) { return null; }
}

async function setSetting(key, value) {
    await pool.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', [key, value, value]);
}

// Convert Base64 Data URL to Buffer for Telegram
function processImageForBot(imageUrl) {
    if (!imageUrl) return null;
    
    // Check if it's a base64 string
    if (imageUrl.startsWith('data:image')) {
        try {
            // Extract base64 part
            const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                return Buffer.from(matches[2], 'base64');
            }
        } catch (e) {
            console.error("Error converting base64 image:", e);
            return null;
        }
    }
    
    // Return as is if it's an http link or file path (though file path won't work remotely)
    if (imageUrl.startsWith('http')) {
        return imageUrl;
    }
    
    return null; // Invalid image format
}

// --- BOT LOGIC ---

async function startBot() {
    if (botInstance) {
        try { await botInstance.stopPolling(); } catch (e) {}
        botInstance = null;
    }

    let token = await getSetting('bot_token');
    if (!token) token = process.env.BOT_TOKEN;

    if (!token || token.length < 20) {
        console.log('⚠️ Bot Token not set. Bot is offline.');
        return;
    }

    const welcomeMessage = (await getSetting('welcome_message')) || 'سلام! به فروشگاه ما خوش آمدید 🌹';
    const botDescription = (await getSetting('bot_description')) || '';
    const btnSearch = (await getSetting('btn_search_text')) || '🔍 جستجوی نام';
    const btnCode = (await getSetting('btn_code_text')) || '🔢 جستجوی کد';
    const btnCategory = (await getSetting('btn_cat_text')) || '📂 دسته‌بندی‌ها';
    const btnCart = (await getSetting('btn_cart_text')) || '🛒 سبد خرید';
    const btnSignUp = (await getSetting('btn_signup_text')) || '📱 ثبت نام با شماره موبایل';

    console.log(`🤖 Starting Bot with token: ${token.substring(0, 10)}...`);

    try {
        botInstance = new TelegramBot(token, { polling: true });
        
        // Set Bot Description (Before Start)
        if (botDescription) {
            try {
                await botInstance.setMyDescription({ description: botDescription });
            } catch (descErr) {
                console.warn("Failed to set bot description:", descErr.message);
            }
        }

        botInstance.on('polling_error', (error) => {
            if (error.code !== 'ETELEGRAM') {
                 console.log(`[Bot Polling Error]: ${error.message}`);
            }
        });

        botInstance.onText(/\/start/, async (msg) => {
            const chatId = msg.chat.id;
            const username = msg.chat.username ? `@${msg.chat.username}` : '';
            // Handle Deep Linking (e.g. /start prod_123)
            const text = msg.text || '';
            const args = text.split(' ');
            
            // If user is just starting or using deep link
            try {
                const [users] = await pool.query('SELECT * FROM users WHERE chat_id = ?', [chatId]);
                
                // If deep linking to a product (args[1]), show product immediately if registered
                // OR show product preview but require registration for purchasing? 
                // For simplicity: Check registration first.
                
                if (users.length > 0) {
                    await pool.query('UPDATE users SET username = ? WHERE chat_id = ?', [username, chatId]);
                    
                    if (args.length > 1 && args[1].startsWith('prod_')) {
                        // Show specific product
                        const prodId = args[1].replace('prod_', '');
                        return sendProductDetails(chatId, prodId);
                    }
                    
                    sendMainMenu(chatId, welcomeMessage, { btnSearch, btnCode, btnCategory, btnCart });
                } else {
                    botInstance.sendMessage(chatId, 'برای استفاده از خدمات ربات، لطفا ابتدا شماره تماس خود را تایید کنید 👇', {
                        reply_markup: {
                            keyboard: [[{ text: btnSignUp, request_contact: true }]],
                            resize_keyboard: true,
                            one_time_keyboard: true
                        }
                    });
                }
            } catch (err) { console.error(err); }
        });

        botInstance.on('contact', async (msg) => {
            const chatId = msg.chat.id;
            const contact = msg.contact;
            const username = msg.chat.username ? `@${msg.chat.username}` : '';
            
            if (contact && contact.user_id === chatId) {
                await pool.query(
                    'INSERT INTO users (chat_id, name, phone_number, username) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE phone_number = ?, username = ?',
                    [chatId, contact.first_name, contact.phone_number, username, contact.phone_number, username]
                );
                await botInstance.sendMessage(chatId, '✅ ثبت نام شما با موفقیت انجام شد!', {
                    reply_markup: { remove_keyboard: true }
                });
                sendMainMenu(chatId, welcomeMessage, { btnSearch, btnCode, btnCategory, btnCart });
            }
        });

        botInstance.on('callback_query', async (query) => {
            const chatId = query.message.chat.id;
            const data = query.data;

            try {
                if (data === 'back_home') {
                    sendMainMenu(chatId, welcomeMessage, { btnSearch, btnCode, btnCategory, btnCart });
                } else if (data === 'categories') {
                    const [cats] = await pool.query('SELECT name FROM categories ORDER BY name');
                    if (cats.length > 0) {
                        const buttons = [];
                        for(let i = 0; i < cats.length; i += 2) {
                            const row = [{ text: cats[i].name, callback_data: `cat_${cats[i].name}` }];
                            if (i + 1 < cats.length) row.push({ text: cats[i+1].name, callback_data: `cat_${cats[i+1].name}` });
                            buttons.push(row);
                        }
                        // Add back button
                        buttons.push([{ text: '🏠 منوی اصلی', callback_data: 'back_home' }]);
                        
                        botInstance.sendMessage(chatId, 'لطفا دسته مورد نظر را انتخاب کنید:', { reply_markup: { inline_keyboard: buttons } });
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
                    const [products] = await pool.query('SELECT id, name, price FROM products WHERE category = ? LIMIT 20', [catName]);
                    if (products.length > 0) {
                        const buttons = products.map(p => ([{
                            text: `${p.name} - ${Number(p.price).toLocaleString()} تومان`,
                            callback_data: `prod_${p.id}`
                        }]));
                        buttons.push([{ text: '🔙 بازگشت به لیست دسته‌ها', callback_data: 'categories' }]);
                        buttons.push([{ text: '🏠 منوی اصلی', callback_data: 'back_home' }]);
                        
                        botInstance.sendMessage(chatId, `محصولات دسته ${catName}:`, { reply_markup: { inline_keyboard: buttons } });
                    } else {
                        botInstance.sendMessage(chatId, `هیچ محصولی در دسته ${catName} یافت نشد.`);
                    }
                } else if (data.startsWith('prod_')) {
                    const prodId = data.split('prod_')[1];
                    await sendProductDetails(chatId, prodId);
                }
            } catch (err) {
                console.error("Bot Callback Error:", err);
            }
        });

    } catch (err) {
        console.error('Failed to start bot:', err);
    }
}

async function sendProductDetails(chatId, prodId) {
    if (!botInstance) return;
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [prodId]);
    
    if (rows.length > 0) {
        const p = rows[0];
        const caption = `<b>${p.name}</b>\n\n🔖 کد محصول: ${p.code || '---'}\n💰 قیمت: ${Number(p.price).toLocaleString()} تومان\n📦 موجودی: ${p.stock > 0 ? p.stock : 'ناموجود'}\n\n📝 ${p.description || ''}`;
        
        const inlineKeyboard = [
            [{ text: '🛒 افزودن به سبد خرید', callback_data: `add_${p.id}` }]
        ];
        
        // Navigation Buttons
        const navRow = [];
        if (p.category) {
            navRow.push({ text: '🔙 بازگشت به لیست', callback_data: `cat_${p.category}` });
        }
        navRow.push({ text: '🏠 منوی اصلی', callback_data: 'back_home' });
        inlineKeyboard.push(navRow);

        const opts = { 
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: inlineKeyboard }
        };
        
        const img = processImageForBot(p.image_url);
        if (img) {
            await botInstance.sendPhoto(chatId, img, { ...opts, caption: caption });
        } else {
            await botInstance.sendMessage(chatId, caption, opts);
        }
    } else {
        botInstance.sendMessage(chatId, 'محصول یافت نشد.');
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

// Auth API
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await pool.query('SELECT * FROM panel_users WHERE username = ? AND password = ?', [username, password]);
        
        if (rows.length > 0) {
            const user = rows[0];
            // Update last active
            await pool.query('UPDATE panel_users SET last_active = NOW() WHERE id = ?', [user.id]);
            res.json({ success: true, user: { id: user.id, name: user.name, username: user.username, role: user.role } });
        } else {
            res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است.' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Settings API
app.get('/api/settings', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM settings');
        const settings = {};
        rows.forEach(row => { settings[row.setting_key] = row.setting_value });
        res.json(settings);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/settings', async (req, res) => {
    try {
        const { 
            bot_token, channel_id, welcome_message, bot_description,
            btn_search_text, btn_code_text, btn_cat_text, btn_cart_text, btn_signup_text 
        } = req.body;

        await setSetting('bot_token', bot_token);
        await setSetting('channel_id', channel_id);
        await setSetting('welcome_message', welcome_message);
        await setSetting('bot_description', bot_description);
        await setSetting('btn_search_text', btn_search_text);
        await setSetting('btn_code_text', btn_code_text);
        await setSetting('btn_cat_text', btn_cat_text);
        await setSetting('btn_cart_text', btn_cart_text);
        await setSetting('btn_signup_text', btn_signup_text);
        
        await startBot();
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Bot Action: Send Product to Channel
app.post('/api/bot/send-product', async (req, res) => {
    try {
        const { productId } = req.body;
        if (!botInstance) return res.status(503).json({ error: 'ربات فعال نیست. لطفا ابتدا توکن ربات را تنظیم کنید.' });

        let channelId = await getSetting('channel_id');
        if (!channelId) return res.status(400).json({ error: 'آیدی کانال تنظیم نشده است.' });
        
        // Ensure channel ID starts with @
        if (!channelId.startsWith('@') && !channelId.startsWith('-100')) {
             channelId = `@${channelId}`;
        }

        const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
        if (rows.length === 0) return res.status(404).json({ error: 'محصول یافت نشد.' });

        const p = rows[0];
        const caption = `<b>${p.name}</b>\n\n🔖 کد محصول: ${p.code || '---'}\n💰 قیمت: ${Number(p.price).toLocaleString()} تومان\n📦 موجودی: ${p.stock > 0 ? p.stock : 'ناموجود'}\n\n📝 ${p.description || ''}\n\n👇 جهت خرید کلیک کنید:`;
        
        // Get Bot Username for deep linking
        let botUsername = '';
        try {
            const me = await botInstance.getMe();
            botUsername = me.username;
        } catch(e) {
            console.error("Failed to get bot info", e);
        }

        const opts = {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: [[{ text: '🛍 خرید این محصول', url: `https://t.me/${botUsername}?start=prod_${p.id}` }]] }
        };

        const img = processImageForBot(p.image_url);
        
        try {
            if (img) {
                await botInstance.sendPhoto(channelId, img, opts);
            } else {
                await botInstance.sendMessage(channelId, caption, opts);
            }
            res.json({ success: true });
        } catch (botErr) {
            console.error("Telegram API Error:", botErr.message);
            res.status(500).json({ error: `خطا در ارسال به تلگرام: ${botErr.message}` });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Standard CRUD endpoints (Products, Categories, Orders...)
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [orders] = await pool.query('SELECT COUNT(*) as count FROM orders');
    const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [sales] = await pool.query('SELECT SUM(total) as total FROM orders WHERE status = "completed"');
    res.json({
      totalSales: sales[0].total || 0,
      totalOrders: orders[0].count || 0,
      totalUsers: users[0].count || 0,
      chartData: []
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(rows.map(row => ({ ...row, price: Number(row.price), imageUrl: row.image_url })));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/products', async (req, res) => {
  try {
    const { id, code, name, category, price, stock, description, imageUrl } = req.body;
    const [existing] = await pool.query('SELECT id FROM products WHERE name = ? OR (code = ? AND code IS NOT NULL AND code != "")', [name, code]);
    if (existing.length > 0) return res.status(409).json({ error: 'Duplicate' });
    
    await pool.query('INSERT INTO products (id, code, name, category, price, stock, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [id, code, name, category, price, stock, description, imageUrl]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, code, category, price, stock, description, imageUrl } = req.body;
    const [existing] = await pool.query('SELECT id FROM products WHERE (name = ? OR (code = ? AND code IS NOT NULL AND code != "")) AND id != ?', [name, code, req.params.id]);
    if (existing.length > 0) return res.status(409).json({ error: 'Duplicate' });

    await pool.query('UPDATE products SET name=?, code=?, category=?, price=?, stock=?, description=?, image_url=? WHERE id=?', [name, code, category, price, stock, description, imageUrl, req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT name FROM categories ORDER BY name');
    res.json(rows.map(r => r.name));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/categories', async (req, res) => {
    try {
        await pool.query('INSERT IGNORE INTO categories (name) VALUES (?)', [req.body.name]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/categories/:oldName', async (req, res) => {
    try {
        await pool.query('UPDATE categories SET name = ? WHERE name = ?', [req.body.name, req.params.oldName]);
        await pool.query('UPDATE products SET category = ? WHERE category = ?', [req.body.name, req.params.oldName]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/categories/:name', async (req, res) => {
    try {
        await pool.query('DELETE FROM categories WHERE name = ?', [req.params.name]);
        await pool.query('UPDATE products SET category = NULL WHERE category = ?', [req.params.name]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/orders', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(rows.map(row => ({
        id: row.id, customerName: row.customer_name, total: Number(row.total), status: row.status, date: new Date(row.created_at).toLocaleDateString('fa-IR'), items: row.items_count
    })));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/bot-users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users ORDER BY registered_at DESC');
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});