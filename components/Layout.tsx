import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Send, 
  Users, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Bell,
  Bot
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  userRole: string;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, userRole, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: 'داشبورد', icon: LayoutDashboard, path: '/' },
    { label: 'مدیریت محصولات', icon: Package, path: '/products' },
    { label: 'سفارشات', icon: ShoppingCart, path: '/orders' },
    { label: 'طراحی ربات', icon: Bot, path: '/bot-designer' },
    { label: 'پیام رسانی', icon: Send, path: '/broadcast' },
    { label: 'کاربران و نقش‌ها', icon: Users, path: '/users' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {!isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(true)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 right-0 z-30 w-64 bg-slate-900 text-white transition-transform duration-300 transform ${
          !isSidebarOpen ? 'translate-x-full lg:translate-x-0' : 'translate-x-0'
        } lg:translate-x-0 flex flex-col shadow-xl`}
      >
        <div className="h-16 flex items-center justify-between px-6 bg-slate-800 border-b border-slate-700">
          <span className="text-xl font-bold bg-gradient-to-l from-blue-400 to-indigo-500 text-transparent bg-clip-text">
            مدیریت ربات
          </span>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold">
              {userRole === 'admin' ? 'A' : 'E'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">مدیر سیستم</span>
              <span className="text-xs text-slate-400">{userRole === 'admin' ? 'ادمین ارشد' : 'مدیر محتوا'}</span>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            خروج از حساب
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 lg:px-8">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex-1"></div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-500 hover:text-indigo-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 left-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;