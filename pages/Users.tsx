import React, { useState, useEffect } from 'react';
import { User, Shield, Edit2, Trash2, Plus, X, Check, Search } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'editor';
  lastActive: string;
}

const MOCK_USERS: UserData[] = [
  { id: '1', name: 'مدیر سیستم', username: 'admin', role: 'admin', lastActive: 'آنلاین' },
  { id: '2', name: 'سارا احمدی', username: 'sara_content', role: 'editor', lastActive: '۲ ساعت پیش' },
  { id: '3', name: 'علی رضاپور', username: 'ali_support', role: 'editor', lastActive: '۱ روز پیش' },
];

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>(MOCK_USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [currentUser, setCurrentUser] = useState<Partial<UserData>>({
    name: '',
    username: '',
    role: 'editor'
  });

  // Load/Save to LocalStorage to make it feel real
  useEffect(() => {
    const savedUsers = localStorage.getItem('app_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
  }, []);

  const saveUsersToStorage = (newUsers: UserData[]) => {
    localStorage.setItem('app_users', JSON.stringify(newUsers));
    setUsers(newUsers);
  };

  const handleOpenModal = (user?: UserData) => {
    if (user) {
      setCurrentUser(user);
    } else {
      setCurrentUser({ name: '', username: '', role: 'editor' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!currentUser.name || !currentUser.username) return;

    if (currentUser.id) {
      // Edit
      const updatedUsers = users.map(u => u.id === currentUser.id ? { ...u, ...currentUser } as UserData : u);
      saveUsersToStorage(updatedUsers);
    } else {
      // Add
      const newUser = {
        ...currentUser,
        id: Date.now().toString(),
        lastActive: 'هم‌اکنون'
      } as UserData;
      saveUsersToStorage([...users, newUser]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (id === '1') {
      alert('امکان حذف مدیر اصلی سیستم وجود ندارد.');
      return;
    }
    if (confirm('آیا از حذف این کاربر اطمینان دارید؟')) {
      const updatedUsers = users.filter(u => u.id !== id);
      saveUsersToStorage(updatedUsers);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.includes(searchTerm) || u.username.includes(searchTerm)
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">مدیریت کاربران و نقش‌ها</h1>
          <p className="text-gray-500 mt-1">مدیریت دسترسی کارمندان به پنل</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          افزودن کاربر جدید
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="جستجو در کاربران..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
              <tr>
                <th className="px-6 py-4">کاربر</th>
                <th className="px-6 py-4">نام کاربری</th>
                <th className="px-6 py-4">نقش دسترسی</th>
                <th className="px-6 py-4">آخرین فعالیت</th>
                <th className="px-6 py-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-sm">@{user.username}</td>
                  <td className="px-6 py-4">
                    {user.role === 'admin' ? (
                      <span className="flex items-center gap-1 w-fit px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs font-medium">
                        <Shield size={12} />
                        ادمین ارشد
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 w-fit px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                        <Edit2 size={12} />
                        مدیر محتوا
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{user.lastActive}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleOpenModal(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        disabled={user.role === 'admin' && user.id === '1'}
                        className={`p-2 rounded-lg transition-colors ${
                          user.role === 'admin' && user.id === '1' 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">
                {currentUser.id ? 'ویرایش کاربر' : 'افزودن کاربر جدید'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-500" /></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام و نام خانوادگی</label>
                <input 
                  type="text" 
                  value={currentUser.name}
                  onChange={e => setCurrentUser({...currentUser, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام کاربری (برای ورود)</label>
                <input 
                  type="text" 
                  value={currentUser.username}
                  onChange={e => setCurrentUser({...currentUser, username: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نقش دسترسی</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCurrentUser({...currentUser, role: 'admin'})}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                      currentUser.role === 'admin' 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                      : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Shield size={20} />
                    <span className="text-sm font-medium">ادمین ارشد</span>
                  </button>
                  <button
                    onClick={() => setCurrentUser({...currentUser, role: 'editor'})}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                      currentUser.role === 'editor' 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                      : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Edit2 size={20} />
                    <span className="text-sm font-medium">مدیر محتوا</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-sm"
              >
                انصراف
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors text-sm flex items-center gap-2"
              >
                <Check size={16} />
                ذخیره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;