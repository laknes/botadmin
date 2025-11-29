import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { TrendingUp, Users, ShoppingBag, DollarSign, Loader2 } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalUsers: 0,
    chartData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({ title, value, sub, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold mt-1 text-slate-800">
            {loading ? <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div> : value}
          </h3>
          <p className={`text-xs mt-1 font-medium ${sub.includes('+') ? 'text-green-600' : 'text-red-500'}`}>
            {sub} نسبت به هفته قبل
          </p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">داشبورد گزارش‌ها</h1>
        <p className="text-gray-500 mt-1">نمای کلی وضعیت ربات فروشگاهی شما (زنده)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="فروش کل" 
          value={`${Number(stats.totalSales).toLocaleString()} تومان`} 
          sub="+۰٪" 
          icon={DollarSign} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="سفارشات جدید" 
          value={stats.totalOrders} 
          sub="+۰٪" 
          icon={ShoppingBag} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="کاربران ربات" 
          value={stats.totalUsers} 
          sub="+۰٪" 
          icon={Users} 
          color="bg-indigo-500" 
        />
        <StatCard 
          title="نرخ تبدیل" 
          value="--٪" 
          sub="۰٪" 
          icon={TrendingUp} 
          color="bg-purple-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-4 text-slate-800">آمار فروش هفتگی</h3>
          <div className="h-80 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={stats.chartData.length ? stats.chartData : []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px'}} />
                <Bar dataKey="sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-4 text-slate-800">تعداد سفارشات</h3>
          <div className="h-80 w-full" dir="ltr">
             <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={stats.chartData.length ? stats.chartData : []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{borderRadius: '8px'}} />
                <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;