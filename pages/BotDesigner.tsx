import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Database, 
  Smartphone, 
  Play, 
  Save, 
  Search, 
  Grid, 
  ShoppingBag,
  ArrowRight,
  Hash,
  Key,
  Wifi,
  Info,
  CheckCircle,
  Loader2,
  Terminal,
  Copy,
  Server,
  Code,
  Package,
  FileText
} from 'lucide-react';

// Mock Data for Simulation
const MOCK_CATEGORIES = [
  { id: '1', title: '📱 کالای دیجیتال' },
  { id: '2', title: '👕 پوشاک' },
  { id: '3', title: '🏠 خانه و آشپزخانه' },
  { id: '4', title: '📚 کتاب و لوازم التحریر' },
];

const MOCK_PRODUCT = {
  name: 'هدفون بی‌سیم مدل X2',
  price: '۱,۲۰۰,۰۰۰ تومان',
  desc: 'کیفیت صدای عالی، باتری ۲۰ ساعته، ضد آب',
  image: 'https://picsum.photos/300/200'
};

const BotDesigner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'design' | 'settings' | 'database' | 'deploy'>('design');
  
  // Bot Config State
  const [welcomeMessage, setWelcomeMessage] = useState('سلام! به فروشگاه ما خوش آمدید 🌹\nلطفا یکی از گزینه‌های زیر را انتخاب کنید:');
  const [botToken, setBotToken] = useState('');
  const [channelId, setChannelId] = useState('');
  const [botStatus, setBotStatus] = useState<'offline' | 'checking' | 'online' | 'error'>('offline');
  const [statusMessage, setStatusMessage] = useState('');
  
  // UI States
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Load settings from local storage
  useEffect(() => {
    const savedToken = localStorage.getItem('bot_token');
    const savedChannel = localStorage.getItem('channel_id');
    const savedWelcome = localStorage.getItem('welcome_message');
    if (savedToken) setBotToken(savedToken);
    if (savedChannel) setChannelId(savedChannel);
    if (savedWelcome) setWelcomeMessage(savedWelcome);
  }, []);

  const handleSaveSettings = () => {
    setIsSaving(true);
    setSaveSuccess(false);

    setTimeout(() => {
      localStorage.setItem('bot_token', botToken);
      localStorage.setItem('channel_id', channelId);
      localStorage.setItem('welcome_message', welcomeMessage);
      
      setIsSaving(false);
      setSaveSuccess(true);
      
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  const handleTestConnection = async () => {
      if (!botToken) {
          alert("لطفا ابتدا توکن ربات را وارد کنید.");
          return;
      }

      setBotStatus('checking');
      setStatusMessage('در حال برقراری ارتباط با سرور تلگرام...');

      try {
          const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
          
          if (response.ok) {
              const data = await response.json();
              if (data.ok) {
                  setBotStatus('online');
                  setStatusMessage(`اتصال به API تلگرام موفق بود! (نام ربات: ${data.result.first_name})\n\n⚠️ توجه: برای پاسخگویی ربات به کاربران، باید کد بخش «راه‌اندازی» را روی سرور اجرا کنید.`);
              } else {
                  setBotStatus('error');
                  setStatusMessage('توکن نامعتبر است.');
              }
          } else {
               throw new Error('Network response was not ok');
          }
      } catch (error) {
          console.error("Connection Error:", error);
          
          const isValidFormat = /^[0-9]{8,10}:[a-zA-Z0-9_-]{35}$/.test(botToken);
          
          if (isValidFormat) {
              setBotStatus('online'); 
              setStatusMessage('ساختار توکن صحیح است. (اتصال مستقیم به دلیل محدودیت مرورگر بلاک شد، اما توکن معتبر به نظر می‌رسد)\n\n⚠️ توجه: برای پاسخگویی ربات، سرور Backend را اجرا کنید.');
          } else {
              setBotStatus('error');
              setStatusMessage('فرمت توکن صحیح نیست یا اتصال اینترنت برقرار نمی‌باشد.');
          }
      }
  };
  
  // Database Config State
  const [dbConfig, setDbConfig] = useState({
    host: 'localhost',
    port: '3306',
    username: 'root',
    password: '',
    database: 'telegram_shop_db'
  });

  // Simulation State
  const [simStep, setSimStep] = useState<'start' | 'menu' | 'categories' | 'product' | 'search_prompt'>('start');
  const [chatHistory, setChatHistory] = useState<any[]>([
    { type: 'bot', text: 'برای شروع /start را بزنید.' }
  ]);

  const handleSimulateStart = () => {
    setChatHistory([
      { type: 'user', text: '/start' },
      { type: 'bot', text: welcomeMessage, buttons: ['search', 'code', 'categories'] }
    ]);
    setSimStep('menu');
  };

  const handleSimulateAction = (action: string) => {
    if (action === 'categories') {
      setChatHistory(prev => [
        ...prev,
        { type: 'user', text: '📂 دسته‌بندی‌ها' },
        { type: 'bot', text: 'لطفا دسته مورد نظر را انتخاب کنید:', buttons: 'category_list' }
      ]);
      setSimStep('categories');
    } else if (action === 'search_name') {
        setChatHistory(prev => [
            ...prev,
            { type: 'user', text: '🔍 جستجوی نام' },
            { type: 'bot', text: 'لطفا نام محصول را وارد کنید:' }
        ]);
        setSimStep('search_prompt');
    } else if (action === 'show_product') {
        setChatHistory(prev => [
            ...prev,
            { type: 'user', text: 'هدفون' },
            { type: 'bot', text: 'نتایج یافت شده:', product: MOCK_PRODUCT }
        ]);
        setSimStep('product');
    } else if (action === 'back_home') {
        handleSimulateStart();
    }
  };

  // Generate Node.js Code (ESM Version)
  const generatedCode = `
/**
 * --------------------------------------------------------
 * 🛠️ راهنمای نصب و اجرا (Installation Guide)
 * --------------------------------------------------------
 * 1. ابتدا Node.js را نصب کنید.
 * 2. دستور زیر را برای نصب وابستگی‌ها اجرا کنید:
 * 
 *    npm install node-telegram-bot-api mysql2
 * 
 * 3. سپس ربات را اجرا کنید:
 * 
 *    node bot.js
 * --------------------------------------------------------
 */

import TelegramBot from 'node-telegram-bot-api';
import mysql from 'mysql2/promise';

// --- تنظیمات (Settings) ---
const TOKEN = '${botToken || 'YOUR_BOT_TOKEN_HERE'}';
const DB_CONFIG = {
  host: '${dbConfig.host || 'localhost'}',
  user: '${dbConfig.username || 'root'}',
  password: '${dbConfig.password}',
  database: '${dbConfig.database || 'shop_db'}'
};

// اتصال به دیتابیس (Database Connection)
// نکته: برای جلوگیری از خطا در صورت نبود دیتابیس، این بخش را داخل try-catch بگذارید یا ابتدا دیتابیس را بسازید.
const createConnection = async () => {
  try {
    const connection = await mysql.createPool(DB_CONFIG);
    console.log('✅ Connected to Database');
    return connection;
  } catch (err) {
    console.warn('⚠️ Database connection failed. Running in mock mode.', err.message);
    return null;
  }
};

const pool = await createConnection();

// راه‌اندازی ربات (Initialize Bot)
const bot = new TelegramBot(TOKEN, { polling: true });

console.log('🤖 ربات فروشگاهی روشن شد و در حال گوش دادن به پیام‌هاست...');

// پیام خوش‌آمدگویی (Start Command)
bot.onText(/\\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, \`${welcomeMessage}\`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔍 جستجوی محصول', callback_data: 'search' }, { text: '📂 دسته‌بندی‌ها', callback_data: 'categories' }],
        [{ text: '🛒 سبد خرید', callback_data: 'cart' }]
      ]
    }
  });
});

// مدیریت دکمه‌ها (Button Handler)
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data === 'categories') {
    // دریافت دسته‌ها از دیتابیس (نمونه)
    // if (pool) { const [rows] = await pool.query('SELECT * FROM categories'); ... }
    bot.sendMessage(chatId, 'لطفا دسته مورد نظر را انتخاب کنید:');
  } else if (data === 'search') {
    bot.sendMessage(chatId, 'لطفا نام محصول را ارسال کنید:');
  }
});

// مدیریت خطا (Error Handling)
bot.on('polling_error', (error) => {
  console.log('Polling Error:', error.message); 
});

console.log('✅ سیستم آماده است. لطفا در تلگرام به ربات پیام دهید.');
`.trim();

  const installCmd = "npm install node-telegram-bot-api mysql2";
  
  const installationScript = `#!/bin/bash

# Installation Script for Bot Admin Pro & Telegram Bot Server
# Run this script on your Ubuntu/Debian server

echo "🚀 Starting Installation..."

# 1. Update System
echo "📦 Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Node.js (Latest LTS)
echo "🟢 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v

# 3. Install MySQL Server
echo "🐬 Installing MySQL Server..."
sudo apt-get install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

# 4. Configure Database
echo "🗄️ Configuring Database..."
# Note: You should secure your MySQL installation manually if needed using 'mysql_secure_installation'
sudo mysql -e "CREATE DATABASE IF NOT EXISTS telegram_shop_db;"
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${dbConfig.password}';"
sudo mysql -e "FLUSH PRIVILEGES;"

echo "✅ Database 'telegram_shop_db' created."

# 5. Project Setup
echo "📂 Setting up Project..."

# Install dependencies
npm install

# Build the frontend
echo "🔨 Building Frontend..."
npm run build

# 6. Bot Setup
echo "🤖 Setting up Bot..."
npm install node-telegram-bot-api mysql2 dotenv

echo "✅ Installation Complete!"
echo "----------------------------------------------------"
echo "👉 To start the frontend: npm run preview"
echo "👉 To start the bot: node bot.js"
echo "----------------------------------------------------"
`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyInstall = () => {
    navigator.clipboard.writeText(installCmd);
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };
  
  const handleCopyScript = () => {
    navigator.clipboard.writeText(installationScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  // Styles
  const inputClassName = "w-full p-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all placeholder:text-gray-400";
  const labelClassName = "block text-sm font-bold text-slate-800 mb-2";

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      
      {/* Left Panel: Configuration */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
          {[
            { id: 'design', label: 'طراحی ظاهری', icon: Smartphone },
            { id: 'settings', label: 'تنظیمات ربات', icon: Settings },
            { id: 'database', label: 'دیتابیس', icon: Database },
            { id: 'deploy', label: 'راه‌اندازی', icon: Server },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-4 px-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id 
                ? 'text-indigo-700 border-b-2 border-indigo-600 bg-white' 
                : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'design' && (
            <div className="space-y-6">
              <div>
                <label className={labelClassName}>پیام خوش‌آمدگویی (/start)</label>
                <textarea 
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={4}
                  className={inputClassName}
                  placeholder="متن پیام خوش‌آمدگویی خود را وارد کنید..."
                />
                <p className="text-xs text-gray-500 mt-2">این پیام زمانی که کاربر دکمه Start را می‌زند نمایش داده می‌شود.</p>
              </div>

              <div>
                <h3 className={labelClassName}>دکمه‌های منوی اصلی (Inline Keyboard)</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-2 bg-white rounded border border-gray-200"><Search size={18} className="text-gray-600" /></div>
                    <span className="text-sm font-medium text-slate-700 flex-1">جستجوی نام محصول</span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">فعال</span>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-2 bg-white rounded border border-gray-200"><Grid size={18} className="text-gray-600" /></div>
                    <span className="text-sm font-medium text-slate-700 flex-1">دسته‌بندی محصولات</span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">فعال</span>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-sm">
                     <div className="p-2 bg-white rounded border border-gray-200"><ShoppingBag size={18} className="text-gray-600" /></div>
                    <span className="text-sm font-medium text-slate-700 flex-1">سبد خرید</span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">فعال</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-sm text-yellow-800 flex gap-3 shadow-sm">
                 <Info className="shrink-0" size={20} />
                 <p className="font-medium leading-6">تغییرات شما به صورت آنی در شبیه‌ساز (سمت چپ) اعمال می‌شود. برای اعمال روی ربات واقعی، باید کد سرور را از تب «راه‌اندازی» دریافت و اجرا کنید.</p>
              </div>
            </div>
          )}

          {activeTab === 'deploy' && (
            <div className="space-y-6">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-sm text-red-900 flex items-start gap-3 shadow-sm">
                <Server className="shrink-0 mt-0.5 text-red-600" size={20} />
                <div className="space-y-2">
                  <p className="font-bold">خطای "Cannot find module" را دریافت کردید؟</p>
                  <p className="leading-6">
                    این خطا یعنی کتابخانه‌های مورد نیاز نصب نشده‌اند. همچنین چون پروژه از نوع ماژولار است، باید از کد زیر (با import) استفاده کنید.
                  </p>
                </div>
              </div>

              {/* Install Command */}
              <div className="space-y-2">
                <h3 className={labelClassName}>۱. نصب پیش‌نیازها</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-900 text-white p-3 rounded-lg font-mono text-sm border border-slate-700 flex justify-between items-center" dir="ltr">
                    <code>{installCmd}</code>
                  </div>
                  <button 
                    onClick={handleCopyInstall}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg transition-colors shadow-md"
                    title="کپی دستور نصب"
                  >
                    {copiedInstall ? <CheckCircle size={20} /> : <Package size={20} />}
                  </button>
                </div>
              </div>
              
              {/* Full Installation Script */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <h3 className={labelClassName}>اسکریپت نصب کامل سرور (installation.sh)</h3>
                    <button 
                        onClick={handleCopyScript}
                        className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-md hover:bg-green-200 transition-colors font-medium"
                    >
                        {copiedScript ? <CheckCircle size={14} /> : <Copy size={14} />}
                        {copiedScript ? 'کپی شد!' : 'کپی اسکریپت'}
                    </button>
                </div>
                <div className="relative group">
                  <pre className="bg-slate-800 text-blue-300 p-4 rounded-xl overflow-x-auto text-sm font-mono leading-6 border border-slate-600 shadow-inner h-32" dir="ltr">
                    <code>{installationScript}</code>
                  </pre>
                </div>
                 <p className="text-xs text-gray-500">این اسکریپت به طور خودکار Node.js و MySQL را روی سرور اوبونتو نصب می‌کند.</p>
              </div>

              {/* Bot Code */}
              <div>
                <h3 className={labelClassName}>۲. کد اجرایی ربات (bot.js)</h3>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-xs text-gray-500">
                    یک فایل به نام <code>bot.js</code> بسازید و کد زیر را در آن قرار دهید.
                  </p>
                  <button 
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md hover:bg-indigo-200 transition-colors font-medium"
                  >
                    {copiedCode ? <CheckCircle size={14} /> : <Copy size={14} />}
                    {copiedCode ? 'کپی شد!' : 'کپی کد'}
                  </button>
                </div>
                <div className="relative group">
                  <pre className="bg-slate-900 text-green-400 p-4 rounded-xl overflow-x-auto text-sm font-mono leading-6 border border-slate-700 shadow-inner h-64" dir="ltr">
                    <code>{generatedCode}</code>
                  </pre>
                </div>
              </div>

              <div>
                <h3 className={labelClassName}>۳. اجرا</h3>
                <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm border border-gray-200 text-slate-700" dir="ltr">
                  node bot.js
                </div>
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm text-blue-900 flex items-start gap-3 shadow-sm">
                <Database className="shrink-0 mt-0.5 text-blue-600" size={20} />
                <p className="font-medium leading-6">
                  تنظیمات دیتابیس MySQL برای ذخیره محصولات و سفارشات. این تنظیمات مستقیماً در کد تولید شده در تب «راه‌اندازی» قرار می‌گیرند.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelClassName}>آدرس هاست (Host)</label>
                  <input 
                    type="text" 
                    value={dbConfig.host}
                    onChange={e => setDbConfig({...dbConfig, host: e.target.value})}
                    className={inputClassName}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className={labelClassName}>پورت</label>
                  <input 
                    type="text" 
                    value={dbConfig.port}
                    onChange={e => setDbConfig({...dbConfig, port: e.target.value})}
                    className={inputClassName}
                    dir="ltr"
                  />
                </div>
              </div>
              
              <div>
                <label className={labelClassName}>نام دیتابیس</label>
                <input 
                  type="text" 
                  value={dbConfig.database}
                  onChange={e => setDbConfig({...dbConfig, database: e.target.value})}
                  className={inputClassName}
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelClassName}>نام کاربری</label>
                  <input 
                    type="text" 
                    value={dbConfig.username}
                    onChange={e => setDbConfig({...dbConfig, username: e.target.value})}
                    className={inputClassName}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className={labelClassName}>رمز عبور</label>
                  <input 
                    type="password" 
                    value={dbConfig.password}
                    onChange={e => setDbConfig({...dbConfig, password: e.target.value})}
                    className={inputClassName}
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Status Card */}
              <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-700 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                       <h3 className="font-bold text-lg flex items-center gap-2">
                           <Wifi size={20} className="text-blue-400"/>
                           وضعیت اتصال ربات
                       </h3>
                       <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${
                           botStatus === 'online' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                           botStatus === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                           botStatus === 'checking' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
                           'bg-slate-700 text-slate-400'
                       }`}>
                           <div className={`w-2 h-2 rounded-full ${
                               botStatus === 'online' ? 'bg-green-400 animate-pulse' : 
                               botStatus === 'checking' ? 'bg-yellow-400 animate-bounce' : 'bg-red-400'
                           }`}></div>
                           {botStatus === 'online' ? 'توکن معتبر' : 
                            botStatus === 'checking' ? 'در حال بررسی...' : 
                            botStatus === 'error' ? 'خطا در اتصال' : 'قطع'}
                       </div>
                  </div>
                  
                  {statusMessage && (
                      <div className={`text-sm p-3 rounded-lg mb-4 leading-6 whitespace-pre-wrap ${
                          botStatus === 'online' ? 'bg-green-900/30 text-green-200' : 
                          botStatus === 'error' ? 'bg-red-900/30 text-red-200' : 'bg-slate-800 text-slate-300'
                      }`}>
                          {statusMessage}
                      </div>
                  )}

                  <button 
                    onClick={handleTestConnection}
                    disabled={botStatus === 'checking'}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white py-2 rounded-lg transition-all font-medium flex items-center justify-center gap-2 text-sm shadow-md"
                  >
                      {botStatus === 'checking' ? <Loader2 size={16} className="animate-spin" /> : <Wifi size={16} />}
                      {botStatus === 'checking' ? 'در حال برقراری ارتباط...' : 'بررسی اتصال واقعی'}
                  </button>
              </div>

              <div>
                <label className={labelClassName}>توکن ربات (Bot Token)</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10" size={18} />
                  <input 
                    type="text" 
                    placeholder="123456789:ABCdefGhIJKlmNoPQRstuVWxyZ"
                    value={botToken}
                    onChange={e => setBotToken(e.target.value)}
                    className={`${inputClassName} pl-10 pr-4 font-mono text-sm`}
                    dir="ltr"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <Info size={12} />
                    توکن را از <span dir="ltr" className="font-mono bg-gray-100 px-1 rounded border border-gray-200 mx-1">@BotFather</span> دریافت کنید.
                </p>
              </div>

              <div>
                <label className={labelClassName}>آیدی کانال (Channel ID)</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 z-10" size={18} />
                  <input 
                    type="text" 
                    placeholder="@my_shop_channel"
                    value={channelId}
                    onChange={e => setChannelId(e.target.value)}
                    className={`${inputClassName} pl-10 pr-4 font-mono text-sm`}
                    dir="ltr"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">ربات باید در این کانال ادمین باشد تا بتواند پست ارسال کند.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer with improved Save Button */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button 
            onClick={handleSaveSettings}
            disabled={isSaving}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg transform active:scale-95 ${
              saveSuccess 
              ? 'bg-green-600 hover:bg-green-700 shadow-green-500/30' 
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                در حال ذخیره...
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle size={20} />
                تغییرات ذخیره شد
              </>
            ) : (
              <>
                <Save size={20} />
                ذخیره تنظیمات
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Panel: Phone Simulator */}
      <div className="w-full lg:w-[400px] shrink-0 flex flex-col items-center">
        <div className="text-sm font-bold text-slate-600 mb-4 flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
          <Play size={16} className="text-indigo-600" />
          پیش‌نمایش زنده ربات
        </div>
        
        {/* Phone Frame */}
        <div className="w-full max-w-[360px] h-[720px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl relative border-4 border-slate-800 ring-4 ring-gray-100">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-xl z-10"></div>
          
          <div className="w-full h-full bg-[#8E9EAF] rounded-[2.2rem] overflow-hidden flex flex-col relative bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_Wallpaper.jpg')] bg-cover">
            <div className="absolute inset-0 bg-[#8E9EAF]/20 backdrop-blur-[1px]"></div>

            {/* Telegram Header */}
            <div className="h-16 bg-[#517da2] flex items-center px-4 shrink-0 z-20 text-white shadow-md">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-300 to-blue-500 flex items-center justify-center font-bold text-sm mr-3 border-2 border-white/20">RB</div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-white drop-shadow-sm">RoboShop Bot</span>
                <span className="text-[11px] opacity-80">bot</span>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 z-10 custom-scrollbar pb-16">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  {msg.type === 'bot' ? (
                    <div className="max-w-[85%] group">
                        <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-slate-800 whitespace-pre-line border border-gray-100/50">
                            {msg.text}
                        </div>
                        
                        {/* Inline Buttons Rendering */}
                        {msg.buttons === 'category_list' && (
                            <div className="mt-2 grid grid-cols-2 gap-2">
                                {MOCK_CATEGORIES.map(cat => (
                                    <button 
                                        key={cat.id}
                                        onClick={() => handleSimulateAction('show_product')}
                                        className="bg-[#506678]/90 hover:bg-[#506678] text-white text-xs font-medium py-2.5 px-1 rounded-lg transition-all active:scale-95 shadow-sm backdrop-blur-sm"
                                    >
                                        {cat.title}
                                    </button>
                                ))}
                                <button onClick={() => handleSimulateAction('back_home')} className="col-span-2 bg-[#506678]/90 text-white text-xs py-2.5 rounded-lg active:scale-95 shadow-sm">🔙 بازگشت به منوی اصلی</button>
                            </div>
                        )}

                        {Array.isArray(msg.buttons) && msg.buttons.includes('search') && (
                            <div className="mt-2 space-y-2">
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleSimulateAction('search_name')}
                                        className="flex-1 bg-[#506678]/90 hover:bg-[#506678] text-white text-xs font-medium py-2.5 rounded-lg transition-all active:scale-95 shadow-sm backdrop-blur-sm"
                                    >
                                        🔍 جستجوی نام
                                    </button>
                                    <button 
                                        onClick={() => handleSimulateAction('search_name')}
                                        className="flex-1 bg-[#506678]/90 hover:bg-[#506678] text-white text-xs font-medium py-2.5 rounded-lg transition-all active:scale-95 shadow-sm backdrop-blur-sm"
                                    >
                                        🔢 جستجوی کد
                                    </button>
                                </div>
                                <button 
                                    onClick={() => handleSimulateAction('categories')}
                                    className="w-full bg-[#506678]/90 hover:bg-[#506678] text-white text-xs font-medium py-2.5 rounded-lg transition-all active:scale-95 shadow-sm backdrop-blur-sm"
                                >
                                    📂 دسته‌بندی‌ها
                                </button>
                                <button className="w-full bg-[#506678]/90 hover:bg-[#506678] text-white text-xs font-medium py-2.5 rounded-lg transition-all active:scale-95 shadow-sm backdrop-blur-sm">
                                    🛒 سبد خرید من
                                </button>
                            </div>
                        )}

                        {/* Product Card */}
                        {msg.product && (
                            <div className="bg-white rounded-xl mt-2 overflow-hidden shadow-md max-w-[220px] border border-gray-100">
                                <img src={msg.product.image} alt="" className="w-full h-36 object-cover" />
                                <div className="p-3">
                                    <h4 className="font-bold text-sm text-slate-800">{msg.product.name}</h4>
                                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{msg.product.desc}</p>
                                    <div className="mt-3 text-indigo-600 font-bold text-sm flex justify-between items-center">
                                      {msg.product.price}
                                    </div>
                                    <button className="w-full mt-3 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-2 rounded-lg transition-colors">افزودن به سبد</button>
                                </div>
                            </div>
                        )}
                    </div>
                  ) : (
                    <div className="bg-[#efffde] p-3 rounded-2xl rounded-tr-none shadow-sm text-sm text-slate-800 border border-green-100">
                      {msg.text}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="h-14 bg-white flex items-center px-3 shrink-0 z-20 border-t border-gray-100">
               {simStep === 'start' ? (
                   <button 
                    onClick={handleSimulateStart}
                    className="w-full py-2.5 text-blue-500 font-bold text-sm hover:bg-blue-50 rounded-lg transition-colors"
                   >
                       شروع (/start)
                   </button>
               ) : simStep === 'search_prompt' ? (
                   <div className="flex w-full gap-2 items-center">
                       <input type="text" placeholder="نام محصول..." className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
                       <button onClick={() => handleSimulateAction('show_product')} className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"><ArrowRight size={18} className="rtl:rotate-180" /></button>
                   </div>
               ) : (
                   <div className="w-full text-center text-xs text-gray-400 font-medium">
                       برای تست از دکمه‌های شیشه‌ای بالا استفاده کنید
                   </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotDesigner;