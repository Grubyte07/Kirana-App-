import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { HiOutlineCurrencyDollar, HiOutlineCalendar, HiOutlineDocumentText, HiOutlineCheck } from 'react-icons/hi';

export default function AddRecord() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [existingRecord, setExistingRecord] = useState(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    totalSales: '',
    productPurchase: '',
    otherExpenses: '',
    notes: ''
  });

  const profit = (parseFloat(form.totalSales) || 0) - (parseFloat(form.productPurchase) || 0) - (parseFloat(form.otherExpenses) || 0);

  useEffect(() => {
    checkExistingRecord();
  }, [form.date]);

  const checkExistingRecord = async () => {
    try {
      const { data } = await API.get(`/records?search=${form.date}`);
      if (data.records && data.records.length > 0) {
        const record = data.records[0];
        setExistingRecord(record);
        setForm({
          date: new Date(record.date).toISOString().split('T')[0],
          totalSales: record.totalSales.toString(),
          productPurchase: record.productPurchase.toString(),
          otherExpenses: record.otherExpenses.toString(),
          notes: record.notes || ''
        });
      } else {
        setExistingRecord(null);
      }
    } catch (error) {
      setExistingRecord(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCalculate = () => {
    setCalculating(true);
    setTimeout(() => setCalculating(false), 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.totalSales || !form.productPurchase) {
      toast.error('Please fill in sales and purchase amounts');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        date: form.date,
        totalSales: parseFloat(form.totalSales),
        productPurchase: parseFloat(form.productPurchase),
        otherExpenses: parseFloat(form.otherExpenses) || 0,
        notes: form.notes
      };

      if (existingRecord) {
        await API.put(`/records/${existingRecord._id}`, payload);
        toast.success(t('recordUpdated'));
      } else {
        await API.post('/records', payload);
        toast.success(t('recordSaved'));
      }
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {existingRecord ? t('edit') + ' ' + t('addRecord') : t('addDailyRecord')}
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-tertiary)' }}>
          {existingRecord ? 'Update your daily record' : 'Enter your daily sales and expenses'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card animate-slide-up">
          {/* Date */}
          <div className="mb-5">
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              <HiOutlineCalendar className="w-4 h-4" />
              {t('date')}
            </label>
            <input
              type="date" name="date" value={form.date} onChange={handleChange}
              className="input-field"
            />
          </div>

          {/* Total Sales */}
          <div className="mb-5">
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              <HiOutlineCurrencyDollar className="w-4 h-4" />
              {t('totalSalesToday')}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold" style={{ color: 'var(--text-tertiary)' }}>₹</span>
              <input
                type="number" name="totalSales" value={form.totalSales} onChange={handleChange}
                className="input-field pl-10 text-lg font-semibold" placeholder="0"
                min="0" step="1" required
              />
            </div>
          </div>

          {/* Product Purchase */}
          <div className="mb-5">
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              <HiOutlineCurrencyDollar className="w-4 h-4" />
              {t('totalPurchaseToday')}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold" style={{ color: 'var(--text-tertiary)' }}>₹</span>
              <input
                type="number" name="productPurchase" value={form.productPurchase} onChange={handleChange}
                className="input-field pl-10 text-lg font-semibold" placeholder="0"
                min="0" step="1" required
              />
            </div>
          </div>

          {/* Other Expenses */}
          <div className="mb-5">
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              <HiOutlineCurrencyDollar className="w-4 h-4" />
              {t('otherExpensesToday')}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold" style={{ color: 'var(--text-tertiary)' }}>₹</span>
              <input
                type="number" name="otherExpenses" value={form.otherExpenses} onChange={handleChange}
                className="input-field pl-10 text-lg font-semibold" placeholder="0"
                min="0" step="1"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="mb-5">
            <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              <HiOutlineDocumentText className="w-4 h-4" />
              {t('notes')} ({t('notes') === 'नोट्स' ? 'वैकल्पिक' : 'optional'})
            </label>
            <textarea
              name="notes" value={form.notes} onChange={handleChange}
              className="input-field resize-none" rows="3"
              placeholder="Any notes for today..."
            />
          </div>
        </div>

        {/* Profit Preview */}
        <div className={`card animate-scale-in ${profit >= 0 ? 'border-emerald-200 dark:border-emerald-800' : 'border-red-200 dark:border-red-800'}`}
          style={{ borderWidth: '2px' }}>
          <div className="text-center">
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
              {calculating ? 'Calculating...' : t('netProfit')}
            </p>
            <p className={`text-4xl font-bold ${profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              ₹{Math.abs(profit).toLocaleString('en-IN')}
              {profit < 0 && <span className="text-red-400"> (Loss)</span>}
            </p>
            <div className="flex justify-center gap-6 mt-3 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              <span>Sales: ₹{Number(form.totalSales || 0).toLocaleString('en-IN')}</span>
              <span>− Purchase: ₹{Number(form.productPurchase || 0).toLocaleString('en-IN')}</span>
              <span>− Expenses: ₹{Number(form.otherExpenses || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button type="button" onClick={handleCalculate} className="btn-secondary flex-1 flex items-center justify-center gap-2">
            Calculate
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <HiOutlineCheck className="w-5 h-5" />
                {t('calculateAndSave')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
