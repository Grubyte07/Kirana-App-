import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlinePencil, HiOutlineTrash, HiOutlineX, HiOutlineCalendar } from 'react-icons/hi';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function History() {
  const { t } = useLanguage();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchDate, setSearchDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchRecords();
  }, [filterMonth, filterYear]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterMonth) {
        params.month = filterMonth;
        params.year = filterYear;
      } else if (searchDate) {
        params.search = searchDate;
      }
      const { data } = await API.get('/records', { params });
      setRecords(data.records);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilterMonth('');
    fetchRecords();
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setEditForm({
      totalSales: record.totalSales,
      productPurchase: record.productPurchase,
      otherExpenses: record.otherExpenses,
      notes: record.notes || ''
    });
  };

  const handleUpdate = async () => {
    try {
      await API.put(`/records/${editingRecord._id}`, editForm);
      toast.success(t('recordUpdated'));
      setEditingRecord(null);
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update');
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/records/${id}`);
      toast.success(t('recordDeleted'));
      setShowDeleteConfirm(null);
      fetchRecords();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('history')}</h1>
        <p className="mt-1" style={{ color: 'var(--text-tertiary)' }}>View and manage all your daily records</p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)}
                className="input-field pl-11" placeholder={t('search')}
              />
            </div>
          </div>
          <button onClick={handleSearch} className="btn-primary px-6">
            {t('search')}
          </button>
          <div className="flex gap-3">
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="input-field w-auto">
              <option value="">{t('allMonths')}</option>
              {months.map((m, i) => (
                <option key={i} value={i + 1}>{t(m.toLowerCase()) || m}</option>
              ))}
            </select>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="input-field w-auto">
              {[2024, 2025, 2026, 2027, 2028].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
            {t('noRecords')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <th className="text-left py-3 px-4 lg:px-6 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('date')}</th>
                  <th className="text-right py-3 px-4 lg:px-6 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('sales')}</th>
                  <th className="text-right py-3 px-4 lg:px-6 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('purchases')}</th>
                  <th className="text-right py-3 px-4 lg:px-6 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('expenses')}</th>
                  <th className="text-right py-3 px-4 lg:px-6 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('profit')}</th>
                  <th className="text-center py-3 px-4 lg:px-6 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id} style={{ borderBottom: '1px solid var(--border-color)' }}
                    className="hover:opacity-80 transition-opacity">
                    <td className="py-3 px-4 lg:px-6">
                      <div className="flex items-center gap-2">
                        <HiOutlineCalendar className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {new Date(record.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 lg:px-6 text-sm text-right font-medium text-blue-500">{formatCurrency(record.totalSales)}</td>
                    <td className="py-3 px-4 lg:px-6 text-sm text-right font-medium text-orange-500">{formatCurrency(record.productPurchase)}</td>
                    <td className="py-3 px-4 lg:px-6 text-sm text-right font-medium text-purple-500">{formatCurrency(record.otherExpenses)}</td>
                    <td className={`py-3 px-4 lg:px-6 text-sm text-right font-bold ${record.dailyProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {formatCurrency(record.dailyProfit)}
                    </td>
                    <td className="py-3 px-4 lg:px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(record)}
                          className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors">
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setShowDeleteConfirm(record._id)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingRecord(null)}>
          <div className="w-full max-w-md card animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{t('edit')} Record</h3>
              <button onClick={() => setEditingRecord(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <HiOutlineX className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('sales')}</label>
                <input type="number" value={editForm.totalSales}
                  onChange={(e) => setEditForm({ ...editForm, totalSales: parseFloat(e.target.value) || 0 })}
                  className="input-field" min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('purchases')}</label>
                <input type="number" value={editForm.productPurchase}
                  onChange={(e) => setEditForm({ ...editForm, productPurchase: parseFloat(e.target.value) || 0 })}
                  className="input-field" min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('expenses')}</label>
                <input type="number" value={editForm.otherExpenses}
                  onChange={(e) => setEditForm({ ...editForm, otherExpenses: parseFloat(e.target.value) || 0 })}
                  className="input-field" min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{t('notes')}</label>
                <textarea value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="input-field resize-none" rows="2" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingRecord(null)} className="btn-secondary flex-1">{t('cancel')}</button>
                <button onClick={handleUpdate} className="btn-primary flex-1">{t('save')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(null)}>
          <div className="w-full max-w-sm card animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{t('confirmDelete')}</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="btn-secondary flex-1">{t('cancel')}</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">{t('delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
