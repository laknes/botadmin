import React, { useState, useEffect } from 'react';
import { Search, Eye, Filter, Loader2 } from 'lucide-react';
import { Order } from '../types';

const statusStyles = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-orange-100 text-orange-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusLabels = {
  completed: 'تکمیل شده',
  pending: 'در حال پردازش',
  cancelled: 'لغو شده',
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const fetchOrders = async () => {
          try {
              const response = await fetch('/api/orders');
              if (response.ok) {
                  setOrders(await response.json());
              }
          } catch (error) {
              console.error("Failed to fetch orders", error);
          } finally {
              setLoading(false);
          }
      };
      fetchOrders();
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">مدیریت سفارشات</h1>
        <p className="text-gray-500 mt-1">لیست سفارشات ثبت شده از طریق ربات تلگرام (دیتابیس)</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="جستجو با شماره سفارش یا نام مشتری..."
              className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            <Filter size={18} />
            فیلتر وضعیت
          </button>
        </div>

        <div className="overflow-x-auto">
          {orders.length === 0 ? (
             <div className="p-8 text-center text-gray-500">هنوز سفارشی ثبت نشده است.</div>
          ) : (
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
              <tr>
                <th className="px-6 py-4">شناسه سفارش</th>
                <th className="px-6 py-4">مشتری</th>
                <th className="px-6 py-4">تاریخ</th>
                <th className="px-6 py-4">مبلغ کل</th>
                <th className="px-6 py-4">وضعیت</th>
                <th className="px-6 py-4 text-center">جزئیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-600 text-sm">{order.id}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{order.customerName}</td>
                  <td className="px-6 py-4 text-gray-500">{order.date}</td>
                  <td className="px-6 py-4 text-slate-800 font-bold">{order.total.toLocaleString()} تومان</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[order.status] || 'bg-gray-100'}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
        
        {/* Pagination Mock */}
        <div className="p-4 border-t border-gray-100 flex justify-center">
            <div className="flex gap-2">
                <button className="px-3 py-1 bg-gray-100 text-gray-500 rounded disabled:opacity-50">قبلی</button>
                <button className="px-3 py-1 bg-indigo-600 text-white rounded">۱</button>
                <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">۲</button>
                <button className="px-3 py-1 bg-gray-100 text-gray-500 rounded hover:bg-gray-200">بعدی</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;