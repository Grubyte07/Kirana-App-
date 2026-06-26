import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API from '../utils/api';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { HiOutlineChartSquareBar, HiOutlineTrendingUp } from 'react-icons/hi';

export default function Analytics() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(6);

  useEffect(() => {
    fetchAnalytics();
  }, [months]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/records/analytics?months=${months}`);
      setData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const COLORS = ['#3b82f6', '#f97316', '#8b5cf6', '#22c55e'];

  const monthlyChartData = data?.monthlyData
    ? Object.entries(data.monthlyData).map(([key, val]) => ({
        month: key,
        sales: val.sales,
        purchases: val.purchases,
        expenses: val.expenses,
        profit: val.profit,
        avgProfit: val.days > 0 ? Math.round(val.profit / val.days) : 0
      }))
    : [];

  const expenseDistribution = data?.totalStats ? [
    { name: 'Purchases', value: data.totalStats.totalPurchases },
    { name: 'Other Expenses', value: data.totalStats.totalExpenses },
    { name: 'Profit', value: data.totalStats.totalProfit },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('analytics')}</h1>
          <p className="mt-1" style={{ color: 'var(--text-tertiary)' }}>Deep dive into your business performance</p>
        </div>
        <select value={months} onChange={(e) => setMonths(parseInt(e.target.value))} className="input-field w-auto">
          <option value={3}>Last 3 Months</option>
          <option value={6}>Last 6 Months</option>
          <option value={12}>Last 12 Months</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
        </div>
      ) : data ? (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card">
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('totalSales')}</p>
              <p className="text-xl font-bold text-blue-500 mt-1">{formatCurrency(data.totalStats.totalSales)}</p>
            </div>
            <div className="card">
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('totalPurchases')}</p>
              <p className="text-xl font-bold text-orange-500 mt-1">{formatCurrency(data.totalStats.totalPurchases)}</p>
            </div>
            <div className="card">
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('totalExpenses')}</p>
              <p className="text-xl font-bold text-purple-500 mt-1">{formatCurrency(data.totalStats.totalExpenses)}</p>
            </div>
            <div className="card">
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('profitPercentage')}</p>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{data.profitPercentage}%</p>
            </div>
          </div>

          {/* Daily Profit Trend */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <HiOutlineTrendingUp className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('dailyProfitTrend')}</h3>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={data.dailyTrend}>
                <defs>
                  <linearGradient id="profitTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                  tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth()+1}`; }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-primary)' }}
                  formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Profit']}
                  labelFormatter={(l) => new Date(l).toLocaleDateString('en-IN')} />
                <Area type="monotone" dataKey="profit" stroke="#22c55e" fill="url(#profitTrendGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{t('monthlyComparison')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                    formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`]} />
                  <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="purchases" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{t('dailyProfitTrend')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                    formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`]} />
                  <Line type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="avgProfit" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{t('expenseAnalysis')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={expenseDistribution} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {expenseDistribution.map((entry, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`]}
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{t('salesAnalysis')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyChartData}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                    formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`]} />
                  <Area type="monotone" dataKey="sales" stroke="#3b82f6" fill="url(#salesGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="purchases" stroke="#f97316" fill="transparent" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Trend Detail */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <HiOutlineChartSquareBar className="w-5 h-5 text-primary-500" />
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Daily Sales vs Purchase vs Expenses</h3>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                  tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth()+1}`; }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                  formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`]} />
                <Bar dataKey="sales" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="purchase" fill="#f97316" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expenses" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>{t('noDataAvailable')}</div>
      )}
    </div>
  );
}
