import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';

interface LoginProps {
  onLogin: (role: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check Local Storage first (Dynamic Users)
    const storedUsers = localStorage.getItem('app_users');
    let authenticated = false;

    if (storedUsers) {
        try {
            const users = JSON.parse(storedUsers);
            const user = users.find((u: any) => u.username === username && u.password === password);
            if (user) {
                onLogin(user.role);
                authenticated = true;
            }
        } catch (err) {
            console.error("Error parsing users from local storage", err);
        }
    }

    // Fallback for default admin if not authenticated via storage (or storage empty/corrupt)
    if (!authenticated) {
        if (username === 'admin' && password === 'admin') {
             onLogin('admin');
        } else if (username === 'editor' && password === 'editor') {
             onLogin('editor');
        } else {
             setError('نام کاربری یا رمز عبور اشتباه است.');
        }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">ورود به پنل مدیریت</h1>
          <p className="text-gray-500 mt-2">لطفا برای ادامه وارد شوید</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">نام کاربری</label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                placeholder="نام کاربری خود را وارد کنید"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">رمز عبور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                placeholder="••••••••"
                dir="ltr"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/30 active:scale-95"
          >
            ورود به سیستم
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          <p>پیش‌فرض: admin / admin</p>
        </div>
      </div>
    </div>
  );
};

export default Login;