const mongoose = require('mongoose');

const dailyRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  totalSales: {
    type: Number,
    required: [true, 'Total sales is required'],
    min: 0
  },
  productPurchase: {
    type: Number,
    required: [true, 'Product purchase amount is required'],
    min: 0
  },
  otherExpenses: {
    type: Number,
    default: 0,
    min: 0
  },
  dailyProfit: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

dailyRecordSchema.index({ user: 1, date: -1 });
dailyRecordSchema.index({ user: 1, date: 1 }, { unique: true });

dailyRecordSchema.pre('save', function (next) {
  this.dailyProfit = this.totalSales - this.productPurchase - this.otherExpenses;
  this.updatedAt = Date.now();
  next();
});

dailyRecordSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.totalSales !== undefined && update.productPurchase !== undefined) {
    const expenses = update.otherExpenses || 0;
    update.dailyProfit = update.totalSales - update.productPurchase - expenses;
  }
  update.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('DailyRecord', dailyRecordSchema);
