import React, { useState, useEffect } from 'react';
import { Smartphone, Search, Calendar, User } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface BotUser {
  chat_id: number;
  name: string;
  phone_number: string;
  username?: string;
  registered_at: string;
}

const BotUsers: React.FC = () => {
  const [users, setUsers] = useState<BotUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/bot-users');
        if (response.ok) {
          setUsers(await response.json());
        }
      } catch (error) {
        console.error("Failed to fetch bot users", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.phone_number && u.phone_number.includes(searchTerm)) ||
    (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">کاربران ربات تلگرام</h1>
        <p className="text-gray-500 mt-1">لیست افرادی که در ربات عضو شده و شماره خود را تایید کرده‌اند</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="جستجو با نام، شماره یا آیدی..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
               هیچ کاربری یافت نشد.
            </div>
          ) : (
            <table className="w-full text-right">
              <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
                <tr>
                  <th className="px-6 py-4">نام کاربر</th>
                  <th className="px-6 py-4">شماره تماس</th>
                  <th className="px-6 py-4">آیدی تلگرام</th>
                  <th className="px-6 py-4">شناسه عددی (Chat ID)</th>
                  <th className="px-6 py-4">تاریخ عضویت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.chat_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          <User size={20} />
                        </div>
                        <span className="font-medium text-slate-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-600 text-sm" dir="ltr">{user.phone_number}</td>
                    <td className="px-6 py-4 font-mono text-blue-500 text-sm" dir="ltr">{user.username || '---'}</td>
                    <td className="px-6 py-4 font-mono text-gray-400 text-sm">{user.chat_id}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            {new Date(user.registered_at).toLocaleDateString('fa-IR')}
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default BotUsers;