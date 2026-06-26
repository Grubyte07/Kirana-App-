import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API from '../utils/api';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { HiOutlineDownload, HiOutlineDocumentText, HiOutlineDocumentDownload } from 'react-icons/hi';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MonthlyReport() {
  const { t } = useLanguage();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const printRef = useRef();

  useEffect(() => {
    fetchReport();
  }, [selectedMonth, selectedYear]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/records/monthly-report?month=${selectedMonth}&year=${selectedYear}`);
      setReport(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const COLORS = ['#3b82f6', '#f97316', '#8b5cf6', '#22c55e'];

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Kirana Profit Manager - Monthly Report', 14, 22);
    doc.setFontSize(12);
    doc.text(`Month: ${months[selectedMonth - 1]} ${selectedYear}`, 14, 32);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 40);

    doc.autoTable({
      startY: 50,
      head: [['Date', 'Sales (Rs.)', 'Purchase (Rs.)', 'Expenses (Rs.)', 'Profit (Rs.)']],
      body: report?.records?.map(r => [
        new Date(r.date).toLocaleDateString('en-IN'),
        Number(r.totalSales).toLocaleString('en-IN'),
        Number(r.productPurchase).toLocaleString('en-IN'),
        Number(r.otherExpenses).toLocaleString('en-IN'),
        Number(r.dailyProfit).toLocaleString('en-IN')
      ]) || [],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' }
      }
    });

    const finalY = doc.lastAutoTable.finalY || 50;
    const pf = (v) => `Rs. ${Number(v || 0).toLocaleString('en-IN')}`;
    doc.setFontSize(11);
    doc.text(`Total Sales: ${pf(report?.stats?.totalSales)}`, 14, finalY + 10);
    doc.text(`Total Purchases: ${pf(report?.stats?.totalPurchases)}`, 14, finalY + 18);
    doc.text(`Total Expenses: ${pf(report?.stats?.totalExpenses)}`, 14, finalY + 26);
    doc.setFontSize(13);
    doc.text(`Net Profit: ${pf(report?.stats?.totalProfit)}`, 14, finalY + 36);
    doc.setFontSize(11);
    doc.text(`Profit Percentage: ${report?.stats?.profitPercentage || 0}%`, 14, finalY + 46);
    doc.text(`Days with Records: ${report?.stats?.daysWithRecords || 0}`, 14, finalY + 54);

    doc.save(`kirana-report-${months[selectedMonth - 1]}-${selectedYear}.pdf`);
  };

  const exportExcel = () => {
    const data = report?.records?.map(r => ({
      'Date': new Date(r.date).toLocaleDateString('en-IN'),
      'Sales (Rs.)': r.totalSales,
      'Purchase (Rs.)': r.productPurchase,
      'Expenses (Rs.)': r.otherExpenses,
      'Profit (Rs.)': r.dailyProfit,
      'Notes': r.notes || ''
    })) || [];

    data.push({});
    data.push({
      'Date': 'TOTAL',
      'Sales (Rs.)': report?.stats?.totalSales || 0,
      'Purchase (Rs.)': report?.stats?.totalPurchases || 0,
      'Expenses (Rs.)': report?.stats?.totalExpenses || 0,
      'Profit (Rs.)': report?.stats?.totalProfit || 0,
      'Notes': ''
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Report');
    XLSX.writeFile(wb, `kirana-report-${months[selectedMonth - 1]}-${selectedYear}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const pieData = report?.stats ? [
    { name: 'Sales', value: report.stats.totalSales || 0 },
    { name: 'Purchases', value: report.stats.totalPurchases || 0 },
    { name: 'Expenses', value: report.stats.totalExpenses || 0 },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('monthlyReport')}</h1>
          <p className="mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {months[selectedMonth - 1]} {selectedYear}
          </p>
        </div>
        <div className="flex items-center gap-3 no-print">
          <button onClick={exportPDF} className="btn-secondary flex items-center gap-2 text-sm">
            <HiOutlineDownload className="w-4 h-4" />
            {t('exportPDF')}
          </button>
          <button onClick={exportExcel} className="btn-secondary flex items-center gap-2 text-sm">
            <HiOutlineDownload className="w-4 h-4" />
            {t('exportExcel')}
          </button>
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2 text-sm">
            <HiOutlineDocumentDownload className="w-4 h-4" />
            {t('print')}
          </button>
        </div>
      </div>

      {/* Month Selector */}
      <div className="card no-print">
        <div className="flex flex-col sm:flex-row gap-4">
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="input-field">
            {months.map((m, i) => (
              <option key={i} value={i + 1}>{t(m.toLowerCase()) || m}</option>
            ))}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="input-field w-auto">
            {[2024, 2025, 2026, 2027, 2028].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
        </div>
      ) : report ? (
        <div ref={printRef}>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>{t('totalSales')}</p>
              <p className="text-2xl font-bold text-blue-500 mt-1">{formatCurrency(report.stats.totalSales)}</p>
            </div>
            <div className="card">
              <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>{t('totalPurchases')}</p>
              <p className="text-2xl font-bold text-orange-500 mt-1">{formatCurrency(report.stats.totalPurchases)}</p>
            </div>
            <div className="card">
              <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>{t('totalExpenses')}</p>
              <p className="text-2xl font-bold text-purple-500 mt-1">{formatCurrency(report.stats.totalExpenses)}</p>
            </div>
            <div className="card">
              <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>{t('netProfit')}</p>
              <p className={`text-2xl font-bold mt-1 ${report.stats.totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {formatCurrency(report.stats.totalProfit)}
              </p>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('avgDailyProfit')}</p>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(report.stats.avgDailyProfit)}</p>
            </div>
            <div className="card">
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('highestProfitDay')}</p>
              <p className="text-lg font-bold text-emerald-500">{formatCurrency(report.stats.highestProfit)}</p>
              {report.stats.highestProfitDay && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  {new Date(report.stats.highestProfitDay).toLocaleDateString('en-IN')}
                </p>
              )}
            </div>
            <div className="card">
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('lowestProfitDay')}</p>
              <p className="text-lg font-bold text-red-500">{formatCurrency(report.stats.lowestProfit)}</p>
              {report.stats.lowestProfitDay && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  {new Date(report.stats.lowestProfitDay).toLocaleDateString('en-IN')}
                </p>
              )}
            </div>
            <div className="card">
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('profitPercentage')}</p>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{report.stats.profitPercentage}%</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{report.stats.daysWithRecords} days</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Daily Profit</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={report.records.map(r => ({
                  date: new Date(r.date).getDate().toString(),
                  profit: r.dailyProfit
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                    formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Profit']} />
                  <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                    {report.records.map((entry, i) => (
                      <Cell key={i} fill={entry.dailyProfit >= 0 ? '#22c55e' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Sales vs Purchase</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={report.records.map(r => ({
                  date: new Date(r.date).getDate().toString(),
                  sales: r.totalSales,
                  purchase: r.productPurchase
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                    formatter={(v) => [`₹${v.toLocaleString('en-IN')}`]} />
                  <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="purchase" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{t('expenseAnalysis')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((entry, i) => (
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
                <BarChart data={report.records.map(r => ({
                  date: new Date(r.date).getDate().toString(),
                  sales: r.totalSales,
                  expenses: r.otherExpenses
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                    formatter={(v) => [`₹${v.toLocaleString('en-IN')}`]} />
                  <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Records Table */}
          <div className="card overflow-hidden p-0">
            <div className="p-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Daily Records - {months[selectedMonth - 1]} {selectedYear}
              </h3>
            </div>
            {report.records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <th className="text-left py-3 px-4 lg:px-6 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Date</th>
                      <th className="text-right py-3 px-4 lg:px-6 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Sales</th>
                      <th className="text-right py-3 px-4 lg:px-6 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Purchase</th>
                      <th className="text-right py-3 px-4 lg:px-6 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Expenses</th>
                      <th className="text-right py-3 px-4 lg:px-6 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.records.map((record) => (
                      <tr key={record._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td className="py-3 px-4 lg:px-6 text-sm" style={{ color: 'var(--text-primary)' }}>
                          {new Date(record.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="py-3 px-4 lg:px-6 text-sm text-right font-medium text-blue-500">{formatCurrency(record.totalSales)}</td>
                        <td className="py-3 px-4 lg:px-6 text-sm text-right font-medium text-orange-500">{formatCurrency(record.productPurchase)}</td>
                        <td className="py-3 px-4 lg:px-6 text-sm text-right font-medium text-purple-500">{formatCurrency(record.otherExpenses)}</td>
                        <td className={`py-3 px-4 lg:px-6 text-sm text-right font-bold ${record.dailyProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {formatCurrency(record.dailyProfit)}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: 'var(--bg-tertiary)', fontWeight: 700 }}>
                      <td className="py-3 px-4 lg:px-6 text-sm" style={{ color: 'var(--text-primary)' }}>TOTAL</td>
                      <td className="py-3 px-4 lg:px-6 text-sm text-right text-blue-500">{formatCurrency(report.stats.totalSales)}</td>
                      <td className="py-3 px-4 lg:px-6 text-sm text-right text-orange-500">{formatCurrency(report.stats.totalPurchases)}</td>
                      <td className="py-3 px-4 lg:px-6 text-sm text-right text-purple-500">{formatCurrency(report.stats.totalExpenses)}</td>
                      <td className={`py-3 px-4 lg:px-6 text-sm text-right ${report.stats.totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {formatCurrency(report.stats.totalProfit)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>{t('noRecords')}</div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>{t('noRecords')}</div>
      )}
    </div>
  );
}
