import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Database, 
  Smartphone, 
  Play, 
  Save, 
  CheckCircle,
  Loader2,
  Copy,
  Server,
  Download,
  Wifi,
  RefreshCw
} from 'lucide-react';
import { useFeedback } from '../components/Feedback';

const MOCK_PRODUCT = {
  name: 'هدفون بی‌سیم مدل X2',
  price: '۱,۲۰۰,۰۰۰ تومان',
  desc: 'کیفیت صدای عالی، باتری ۲۰ ساعته، ضد آب',
  image: 'https://picsum.photos/300/200'
};

const BotDesigner: React.FC = () => {
  const { showToast, setLoading: setGlobalLoading } = useFeedback();
  const [activeTab, setActiveTab] = useState<'design' | 'settings' | 'deploy'>('design');
  
  // Bot Config State
  const [welcomeMessage, setWelcomeMessage] = useState('سلام! به فروشگاه ما خوش آمدید 🌹\nلطفا یکی از گزینه‌های زیر را انتخاب کنید:');
  const [botDescription, setBotDescription] = useState('این ربات جهت خرید آنلاین محصولات فروشگاه ما طراحی شده است.');
  
  // Custom Button Texts
  const [btnSearchText, setBtnSearchText] = useState('🔍 جستجوی نام');
  const [btnCodeText, setBtnCodeText] = useState('🔢 جستجوی کد');
  const [btnCategoryText, setBtnCategoryText] = useState('📂 دسته‌بندی‌ها');
  const [btnCartText, setBtnCartText] = useState('🛒 سبد خرید');
  const [btnSignUpText, setBtnSignUpText] = useState('📱 ثبت نام با شماره موبایل');

  const [botToken, setBotToken] = useState('');
  const [channelId, setChannelId] = useState('');
  const [botStatus, setBotStatus] = useState<'offline' | 'checking' | 'online' | 'error'>('offline');
  const [statusMessage, setStatusMessage] = useState('');
  
  // UI States
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Load settings from Server API
  useEffect(() => {
    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                if (data.bot_token) setBotToken(data.bot_token);
                if (data.channel_id) setChannelId(data.channel_id);
                if (data.welcome_message) setWelcomeMessage(data.welcome_message);
                if (data.bot_description) setBotDescription(data.bot_description);
                if (data.btn_search_text) setBtnSearchText(data.btn_search_text);
                if (data.btn_code_text) setBtnCodeText(data.btn_code_text);
                if (data.btn_cat_text) setBtnCategoryText(data.btn_cat_text);
                if (data.btn_cart_text) setBtnCartText(data.btn_cart_text);
                if (data.btn_signup_text) setBtnSignUpText(data.btn_signup_text);
            }
        } catch (e) {
            console.error("Failed to load settings from server", e);
        }
    };
    
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setGlobalLoading(true);
    setSaveSuccess(false);

    try {
        const payload = {
            bot_token: botToken,
            channel_id: channelId,
            welcome_message: welcomeMessage,
            bot_description: botDescription,
            btn_search_text: btnSearchText,
            btn_code_text: btnCodeText,
            btn_cat_text: btnCategoryText,
            btn_cart_text: btnCartText,
            btn_signup_text: btnSignUpText
        };

        const res = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            setSaveSuccess(true);
            showToast('تنظیمات با موفقیت ذخیره و اعمال شد', 'success');
            setTimeout(() => setSaveSuccess(false), 3000);
        } else {
            showToast('خطا در ذخیره تنظیمات روی سرور', 'error');
        }
    } catch (e) {
        showToast('خطا در برقراری ارتباط با سرور', 'error');
    } finally {
        setGlobalLoading(false);
    }
  };

  const handleTestConnection = async () => {
      if (!botToken.trim()) {
          setBotStatus('error');
          setStatusMessage("⚠️ خطا: فیلد توکن خالی است. لطفا توکن را وارد کنید.");
          showToast('لطفا توکن را وارد کنید', 'warning');
          return;
      }

      setBotStatus('checking');
      setStatusMessage('⏳ در حال ارسال درخواست به سرورهای تلگرام...');

      try {
          const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
          
          if (response.ok) {
              const data = await response.json();
              if (data.ok) {
                  setBotStatus('online');
                  setStatusMessage(`✅ اتصال موفقیت‌آمیز بود!\n\n🤖 نام ربات: ${data.result.first_name}\n🆔 نام کاربری: @${data.result.username}\n⏰ آخرین بررسی: ${new Date().toLocaleTimeString('fa-IR')}`);
                  showToast('اتصال به ربات با موفقیت برقرار شد', 'success');
              } else {
                  setBotStatus('error');
                  setStatusMessage('❌ خطا از سمت تلگرام: توکن ارسال شده نامعتبر است.');
                  showToast('توکن ربات نامعتبر است', 'error');
              }
          } else {
               setBotStatus('error');
               setStatusMessage(`❌ خطا در ارتباط: ${response.status}`);
               showToast('خطا در اتصال به تلگرام', 'error');
          }
      } catch (error) {
          setBotStatus('error');
          setStatusMessage('❌ خطا در برقراری ارتباط. لطفا اینترنت سرور را بررسی کنید.');
          showToast('خطا در شبکه', 'error');
      }
  };

  // Simulation State
  const [simStep, setSimStep] = useState<'start' | 'signup' | 'menu' | 'categories' | 'product' | 'search_prompt' | 'code_prompt'>('start');
  const [isSimUserRegistered, setIsSimUserRegistered] = useState(false); 
  const [chatHistory, setChatHistory] = useState<any[]>([
    { type: 'bot', text: 'برای شروع /start را بزنید.' }
  ]);

  const handleSimulateStart = () => {
    setChatHistory([{ type: 'user', text: '/start' }]);

    if (!isSimUserRegistered) {
      setTimeout(() => {
        setChatHistory(prev => [
            ...prev,
            { type: 'bot', text: 'سلام! برای استفاده از ربات لطفا ابتدا شماره تماس خود را به اشتراک بگذارید.', buttons: 'signup' }
        ]);
        setSimStep('signup');
      }, 500);
    } else {
      setTimeout(() => {
        setChatHistory(prev => [
            ...prev,
            { type: 'bot', text: welcomeMessage, buttons: ['search', 'categories'] }
        ]);
        setSimStep('menu');
      }, 500);
    }
  };

  const handleSimulateAction = (action: string) => {
    if (action === 'share_contact') {
         setChatHistory(prev => [
            ...prev,
            { type: 'user', text: '📱 اشتراک‌گذاری شماره', isContact: true },
            { type: 'bot', text: '✅ ثبت نام شما با موفقیت انجام شد!' },
            { type: 'bot', text: welcomeMessage, buttons: ['search', 'categories'] }
        ]);
        setIsSimUserRegistered(true);
        setSimStep('menu');
    } else if (action === 'categories') {
      setChatHistory(prev => [
        ...prev,
        { type: 'user', text: btnCategoryText },
        { type: 'bot', text: 'لطفا دسته مورد نظر را انتخاب کنید:', buttons: 'category_list' }
      ]);
      setSimStep('categories');
    } else if (action === 'search_name') {
        setChatHistory(prev => [
            ...prev,
            { type: 'user', text: btnSearchText },
            { type: 'bot', text: 'لطفا نام محصول را وارد کنید:' }
        ]);
        setSimStep('search_prompt');
    } else if (action === 'search_code') {
        setChatHistory(prev => [
            ...prev,
            { type: 'user', text: btnCodeText },
            { type: 'bot', text: 'لطفا کد محصول را وارد کنید:' }
        ]);
        setSimStep('code_prompt');
    } else if (action === 'show_product') {
        setChatHistory(prev => [
            ...prev,
            { type: 'user', text: 'هدفون' },
            { type: 'bot', text: 'نتایج یافت شده:', product: MOCK_PRODUCT }
        ]);
        setSimStep('product');
    } else if (action === 'cart') {
        setChatHistory(prev => [
            ...prev,
            { type: 'user', text: btnCartText },
            { type: 'bot', text: 'سبد خرید شما در حال حاضر خالی است. لطفا محصولات را به سبد اضافه کنید.' }
        ]);
    } else if (action === 'back_home') {
        setChatHistory(prev => [
            ...prev,
            { type: 'user', text: '🔙 بازگشت' },
            { type: 'bot', text: welcomeMessage, buttons: ['search', 'categories'] }
        ]);
        setSimStep('menu');
    }
  };

  const toggleSimUser = () => {
    setIsSimUserRegistered(!isSimUserRegistered);
    setChatHistory([{ type: 'bot', text: 'وضعیت کاربر تغییر کرد. لطفا /start را بزنید.' }]);
    setSimStep('start');
  };

  const installationScript = `#!/bin/bash

# ==========================================
# 🚀 Bot Admin Pro - Auto Installation Script
# ==========================================

# Ensure running in bash
if [ -z "$BASH_VERSION" ]; then
    echo "⚠️  Please run this script with bash: bash installation.sh"
    exit 1
fi

echo ""
echo "  ____        _       _       _           _       "
echo " |  _ \\      | |     | |     | |         (_)      "
echo " | |_) | ___ | |_    | | __ _| |__   __ _ _ _ __  "
echo " |  _ < / _ \\| __|   | |/ _\` | '_ \\ / _\` | | '_ \\ "
echo " | |_) | (_) | |_    | | (_| | |_) | (_| | | | | |"
echo " |____/ \\___/ \\__|   |_|\\__,_|_.__/ \\__,_|_|_| |_|"
echo ""
echo "--------------------------------------------------"
echo " This script will install Node.js, MySQL, and"
echo " configure your Telegram Shop Admin Panel."
echo "--------------------------------------------------"
echo ""

# --- 1. System Updates ---
echo "📦 Updating system packages..."
sudo apt-get update
# sudo apt-get upgrade -y # Optional

# --- 2. Install Node.js ---
echo "🟢 Installing Node.js (LTS)..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "   Node.js is already installed."
fi

# --- 3. Install MySQL ---
echo "🐬 Installing MySQL Server..."
if ! command -v mysql &> /dev/null; then
    sudo apt-get install -y mysql-server
    sudo systemctl start mysql
    sudo systemctl enable mysql
else
    echo "   MySQL is already installed."
fi

# --- 4. Interactive Configuration ---
echo ""
echo "🔐 CONFIGURATION SETUP"
echo "----------------------"

# Database Name
read -p "📝 Enter Database Name (default: telegram_shop_db): " INPUT_DB_NAME
DB_NAME=\${INPUT_DB_NAME:-telegram_shop_db}

# Database User
read -p "👤 Enter Database User (default: root): " INPUT_DB_USER
DB_USER=\${INPUT_DB_USER:-root}

# Database Password
while true; do
    echo ""
    # Using read -s -p for better compatibility and tr -d to strip carriage returns
    read -s -p "🔑 Set/Enter MySQL '\$DB_USER' Password: " RAW_DB_PASS
    echo ""
    read -s -p "🔑 Confirm Password: " RAW_DB_PASS_CONFIRM
    echo ""
    
    # Strip potential carriage returns (CR) from input if pasted from Windows
    DB_PASS=$(echo -n "\$RAW_DB_PASS" | tr -d '\r')
    DB_PASS_CONFIRM=$(echo -n "\$RAW_DB_PASS_CONFIRM" | tr -d '\r')
    
    if [ "\$DB_PASS" = "\$DB_PASS_CONFIRM" ]; then
        break
    else
        echo "❌ Passwords do not match. Try again."
    fi
done

# Admin Panel Credentials
echo ""
echo "🛡️  Create Admin Panel User"
read -p "   Username: " ADMIN_USER

while true; do
    read -s -p "   Password: " RAW_ADMIN_PASS
    echo ""
    ADMIN_PASS=$(echo -n "\$RAW_ADMIN_PASS" | tr -d '\r')
    
    if [ -z "\$ADMIN_PASS" ]; then
        echo "❌ Password cannot be empty."
    else
        break
    fi
done

# --- 5. Configure Database ---
echo ""
echo "🗄️  Configuring MySQL..."

# Try to connect and set password if using socket auth (fresh install)
if sudo mysql -e "STATUS;" &>/dev/null; then
    echo "   Configuring root user authentication..."
    sudo mysql -e "ALTER USER '\$DB_USER'@'localhost' IDENTIFIED WITH mysql_native_password BY '\$DB_PASS';"
    sudo mysql -e "FLUSH PRIVILEGES;"
fi

# Create Database
mysql -u"\$DB_USER" -p"\$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS \$DB_NAME;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database '\$DB_NAME' created/verified."
else
    echo "❌ Failed to create database. Please check your password."
    echo "   Installation will continue, but the app might fail to start."
fi

# --- 6. Project Setup ---
echo ""
echo "📂 Setting up Project..."
npm install

# Create .env file
echo "📝 Generating .env file..."
cat > .env <<EOL
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=\$DB_USER
DB_PASSWORD=\$DB_PASS
DB_NAME=\$DB_NAME

# Initial Admin User (Used for seeding database)
ADMIN_INIT_USER=\$ADMIN_USER
ADMIN_INIT_PASS=\$ADMIN_PASS

# Placeholder for Bot Token (Set via Admin Panel later)
BOT_TOKEN=
EOL

# --- 7. Build and Start ---
echo ""
echo "🔨 Building Application..."
npm run build

echo "🤖 Installing Production Dependencies..."
npm install node-telegram-bot-api mysql2 dotenv express

echo "🔄 Installing Process Manager (PM2)..."
sudo npm install -g pm2

echo "🚀 Starting Server..."
pm2 delete bot-admin-pro 2>/dev/null || true
pm2 start server.js --name "bot-admin-pro"
pm2 save
pm2 startup | tail -n 1 | bash 2>/dev/null

echo ""
echo "=============================================="
echo "✅ INSTALLATION COMPLETE!"
echo "=============================================="
echo ""
echo "🌐 Admin Panel URL: http://YOUR_SERVER_IP:3000"
echo "👤 Login Username:  \$ADMIN_USER"
echo "🔑 Login Password:  (Hidden)"
echo ""
echo "⚠️  NOTE: Login to the panel to set your Telegram Bot Token."
echo "=============================================="
`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(installationScript);
    setCopiedScript(true);
    showToast('اسکریپت در کلیپ‌بورد کپی شد', 'info');
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleDownloadScript = () => {
    const element = document.createElement("a");
    const file = new Blob([installationScript], {type: 'text/x-sh'});
    element.href = URL.createObjectURL(file);
    element.download = "installation.sh";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast('دانلود آغاز شد', 'info');
  };

  const inputClassName = "w-full p-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all placeholder:text-gray-400";
  const labelClassName = "block text-sm font-bold text-slate-800 mb-2";

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
          {[
            { id: 'design', label: 'طراحی ظاهری', icon: Smartphone },
            { id: 'settings', label: 'تنظیمات ربات', icon: Settings },
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

        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'design' && (
            <div className="space-y-6">
              <div>
                <label className={labelClassName}>توضیحات قبل از شروع ربات (Bot Description)</label>
                <textarea 
                  value={botDescription}
                  onChange={(e) => setBotDescription(e.target.value)}
                  rows={3}
                  className={inputClassName}
                  placeholder="متنی که کاربر قبل از زدن دکمه Start مشاهده می‌کند..."
                />
                <p className="text-xs text-gray-500 mt-1">این متن در صفحه پروفایل ربات یا صفحه خالی قبل از شروع نمایش داده می‌شود.</p>
              </div>

              <div>
                <label className={labelClassName}>پیام خوش‌آمدگویی (/start)</label>
                <textarea 
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={4}
                  className={inputClassName}
                  placeholder="متن پیام خوش‌آمدگویی خود را وارد کنید..."
                />
              </div>

              <div>
                <h3 className={labelClassName}>دکمه‌های منوی اصلی</h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block">دکمه جستجوی نام</label>
                        <input type="text" value={btnSearchText} onChange={e => setBtnSearchText(e.target.value)} className={inputClassName} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block">دکمه جستجوی کد</label>
                        <input type="text" value={btnCodeText} onChange={e => setBtnCodeText(e.target.value)} className={inputClassName} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block">دکمه دسته‌بندی</label>
                        <input type="text" value={btnCategoryText} onChange={e => setBtnCategoryText(e.target.value)} className={inputClassName} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-2 block">دکمه سبد خرید</label>
                        <input type="text" value={btnCartText} onChange={e => setBtnCartText(e.target.value)} className={inputClassName} />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className={labelClassName}>دکمه ثبت نام</h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="text-xs font-bold text-gray-500 mb-2 block">متن دکمه اشتراک‌گذاری شماره</label>
                    <input type="text" value={btnSignUpText} onChange={e => setBtnSignUpText(e.target.value)} className={inputClassName} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deploy' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 text-sm text-emerald-900 flex items-start gap-3 shadow-sm">
                <CheckCircle className="shrink-0 mt-0.5 text-emerald-600" size={20} />
                <div className="space-y-2">
                  <p className="font-bold">سیستم یکپارچه (Unified Server)</p>
                  <p className="leading-6">اسکریپت زیر به صورت تعاملی نام کاربری و رمز عبور ادمین و همچنین رمز دیتابیس را از شما دریافت کرده و سرور را راه‌اندازی می‌کند.</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <h3 className={labelClassName}>اسکریپت نصب و راه‌اندازی (installation.sh)</h3>
                    <div className="flex gap-2">
                        <button onClick={handleDownloadScript} className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-md font-medium"><Download size={14} /> دانلود</button>
                        <button onClick={handleCopyScript} className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-md font-medium">{copiedScript ? <CheckCircle size={14} /> : <Copy size={14} />} کپی</button>
                    </div>
                </div>
                <div className="relative group">
                  <pre className="bg-slate-800 text-blue-300 p-4 rounded-xl overflow-x-auto text-sm font-mono leading-6 border border-slate-600 shadow-inner h-64" dir="ltr">
                    <code>{installationScript}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-700 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                       <h3 className="font-bold text-lg flex items-center gap-2">
                           <Wifi size={20} className="text-blue-400"/>
                           وضعیت اتصال ربات
                       </h3>
                       <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${
                           botStatus === 'online' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-slate-700 text-slate-400'
                       }`}>
                           <div className={`w-2 h-2 rounded-full ${botStatus === 'online' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                           {botStatus === 'online' ? 'توکن معتبر' : 'قطع'}
                       </div>
                  </div>
                  {statusMessage && (
                      <div className="text-sm p-4 rounded-xl mb-4 leading-7 whitespace-pre-wrap border font-medium bg-slate-800 text-slate-300 border-slate-700">
                          {statusMessage}
                      </div>
                  )}
                  <button onClick={handleTestConnection} disabled={botStatus === 'checking'} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white py-2 rounded-lg transition-all font-medium flex items-center justify-center gap-2 text-sm shadow-md">
                      {botStatus === 'checking' ? <Loader2 size={16} className="animate-spin" /> : <Wifi size={16} />}
                      {botStatus === 'checking' ? 'در حال برقراری ارتباط...' : 'بررسی اتصال واقعی'}
                  </button>
              </div>

              <div>
                <label className={labelClassName}>توکن ربات</label>
                <input type="text" value={botToken} onChange={e => setBotToken(e.target.value)} className={`${inputClassName} font-mono`} dir="ltr" />
              </div>

              <div>
                <label className={labelClassName}>آیدی کانال</label>
                <input type="text" value={channelId} onChange={e => setChannelId(e.target.value)} className={`${inputClassName} font-mono`} dir="ltr" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button 
            onClick={handleSaveSettings}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg transform active:scale-95 ${
              saveSuccess ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {saveSuccess ? <CheckCircle size={20} /> : <Save size={20} />}
            {saveSuccess ? 'تنظیمات ذخیره و اعمال شد' : 'ذخیره و اعمال تنظیمات'}
          </button>
        </div>
      </div>

      {/* Simulator */}
      <div className="w-full lg:w-[400px] shrink-0 flex flex-col items-center">
         <div className="flex gap-2 w-full mb-4">
             <div className="flex-1 text-sm font-bold text-slate-600 flex items-center justify-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                <Play size={16} className="text-indigo-600" />
                پیش‌نمایش زنده ربات
             </div>
             <button onClick={toggleSimUser} className="bg-white p-2 rounded-full border border-gray-200"><RefreshCw size={20} /></button>
        </div>
        <div className="w-full max-w-[360px] h-[600px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl relative border-4 border-slate-800">
             <div className="w-full h-full bg-[#8E9EAF] rounded-[2.2rem] overflow-hidden flex flex-col relative">
                <div className="h-16 bg-[#517da2] flex items-center px-4 shrink-0 text-white">
                    <span className="font-bold text-sm">RoboShop Bot</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {chatHistory.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                             <div className={`p-3 rounded-2xl text-sm ${msg.type === 'user' ? 'bg-[#efffde]' : 'bg-white'}`}>{msg.text}</div>
                        </div>
                    ))}
                </div>
                <div className="min-h-[3rem] bg-white border-t p-2 flex items-center justify-center">
                    <button onClick={handleSimulateStart} className="text-blue-500 font-bold text-sm">Start / Menu</button>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default BotDesigner;