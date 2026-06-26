import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import API from '../utils/api';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  HiOutlineTrendingUp, HiOutlineTrendingDown, HiOutlineCurrencyDollar,
  HiOutlineShoppingCart, HiOutlineDocumentText, HiOutlinePlusCircle,
  HiOutlineArrowSmUp, HiOutlineArrowSmDown
} from 'react-icons/hi';

const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await API.get('/records/dashboard');
      setData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const today = data?.today || {};
  const monthly = data?.monthly || {};

  const todayStats = [
    { label: t('todaySales'), value: today.totalSales || 0, icon: HiOutlineShoppingCart, color: 'from-blue-500 to-blue-600', gradient: 'bg-gradient-to-br from-blue-500 to-blue-600' },
    { label: t('todayPurchases'), value: today.productPurchase || 0, icon: HiOutlineDocumentText, color: 'from-orange-500 to-orange-600', gradient: 'bg-gradient-to-br from-orange-500 to-orange-600' },
    { label: t('todayExpenses'), value: today.otherExpenses || 0, icon: HiOutlineDocumentText, color: 'from-purple-500 to-purple-600', gradient: 'bg-gradient-to-br from-purple-500 to-purple-600' },
    { label: t('todayProfit'), value: today.dailyProfit || 0, icon: HiOutlineCurrencyDollar, color: 'from-emerald-500 to-emerald-600', gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-600', isProfit: true },
  ];

  const monthlyStats = [
    { label: t('monthlySales'), value: monthly.totalSales || 0, icon: HiOutlineTrendingUp, gradient: 'bg-gradient-to-br from-cyan-500 to-blue-600' },
    { label: t('monthlyPurchases'), value: monthly.totalPurchases || 0, icon: HiOutlineTrendingDown, gradient: 'bg-gradient-to-br from-amber-500 to-orange-600' },
    { label: t('monthlyExpenses'), value: monthly.totalExpenses || 0, icon: HiOutlineDocumentText, gradient: 'bg-gradient-to-br from-violet-500 to-purple-600' },
    { label: t('monthlyProfit'), value: monthly.totalProfit || 0, icon: HiOutlineCurrencyDollar, gradient: 'bg-gradient-to-br from-emerald-500 to-green-600', isProfit: true },
  ];

  const chartData = data?.chartData || [];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('welcomeBack')}, {user?.name}!
          </h1>
          <p className="mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {user?.shopName} &bull; {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={() => navigate('/add-record')} className="btn-primary flex items-center gap-2 w-fit">
          <HiOutlinePlusCircle className="w-5 h-5" />
          {t('addRecord')}
        </button>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {todayStats.map((stat, i) => (
          <div key={i} className={`${stat.gradient} stat-card animate-slide-up`} style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-center justify-between mb-3">
              <stat.icon className="w-8 h-8 text-white/80" />
              {stat.isProfit && stat.value > 0 && (
                <HiOutlineArrowSmUp className="w-5 h-5 text-white/80" />
              )}
              {stat.isProfit && stat.value < 0 && (
                <HiOutlineArrowSmDown className="w-5 h-5 text-white/80" />
              )}
            </div>
            <p className="text-white/80 text-sm font-medium">{stat.label}</p>
            <p className="text-white text-xl lg:text-2xl font-bold mt-1">{formatCurrency(stat.value)}</p>
          </div>
        ))}
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {monthlyStats.map((stat, i) => (
          <div key={i} className="card animate-slide-up" style={{ animationDelay: `${(i + 4) * 0.1}s` }}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.gradient} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</p>
            <p className="text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{formatCurrency(stat.value)}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{t('dailyProfitTrend')}</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={(v) => new Date(v).getDate().toString()} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-primary)' }}
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Profit']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN')}
                />
                <Area type="monotone" dataKey="profit" stroke="#22c55e" fill="url(#profitGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-tertiary)' }}>
              {t('noDataAvailable')}
            </div>
          )}
        </div>

        {/* Sales vs Purchase */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{t('monthlyComparison')}</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={(v) => new Date(v).getDate().toString()} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-primary)' }}
                  formatter={(value, name) => [`₹${Number(value).toLocaleString('en-IN')}`, name === 'sales' ? 'Sales' : 'Purchase']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN')}
                />
                <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="purchase" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-tertiary)' }}>
              {t('noDataAvailable')}
            </div>
          )}
        </div>
      </div>

      {/* Recent Records */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('weeklyOverview')}</h3>
          <button onClick={() => navigate('/history')} className="text-sm font-medium text-primary-500 hover:text-primary-600">
            View All →
          </button>
        </div>
        {data?.recentRecords?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>{t('date')}</th>
                  <th className="text-right py-3 px-4 text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>{t('sales')}</th>
                  <th className="text-right py-3 px-4 text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>{t('purchases')}</th>
                  <th className="text-right py-3 px-4 text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>{t('expenses')}</th>
                  <th className="text-right py-3 px-4 text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>{t('profit')}</th>
                </tr>
              </thead>
              <tbody>
                {data.recentRecords.map((record) => (
                  <tr key={record._id} style={{ borderBottom: '1px solid var(--border-color)' }}
                    className="hover:opacity-80 transition-opacity">
                    <td className="py-3 px-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {new Date(record.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-medium text-blue-500">{formatCurrency(record.totalSales)}</td>
                    <td className="py-3 px-4 text-sm text-right font-medium text-orange-500">{formatCurrency(record.productPurchase)}</td>
                    <td className="py-3 px-4 text-sm text-right font-medium text-purple-500">{formatCurrency(record.otherExpenses)}</td>
                    <td className={`py-3 px-4 text-sm text-right font-bold ${record.dailyProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {formatCurrency(record.dailyProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
            {t('noRecords')}
          </div>
        )}
      </div>
    </div>
  );
}
