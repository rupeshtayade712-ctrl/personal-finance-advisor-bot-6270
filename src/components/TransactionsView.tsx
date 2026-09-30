import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Coffee,
  Utensils,
  ShoppingBag,
  Bus,
  Tag,
  CheckCircle2
} from 'lucide-react';
import { Transaction, PaymentMethod } from '../types/finance';
import { STANDARD_CATEGORIES } from '../data/mockProfiles';

interface TransactionsViewProps {
  transactions: Transaction[];
  currencySymbol: string;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenAddModal: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  currencySymbol,
  onAddTransaction,
  onDeleteTransaction,
  onOpenAddModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [quickAddedNotice, setQuickAddedNotice] = useState<string | null>(null);

  // Filter logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = selectedType === 'all' || t.type === selectedType;
      const matchesCat = selectedCategory === 'all' || t.category === selectedCategory;

      return matchesSearch && matchesType && matchesCat;
    });
  }, [transactions, searchTerm, selectedType, selectedCategory]);

  // Aggregate stats
  const totalFilteredExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalFilteredIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Type', 'Title', 'Category', 'Amount', 'Payment Method', 'Notes'];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.date,
      t.type,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.category.replace(/"/g, '""')}"`,
      t.amount,
      t.paymentMethod,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1-Click Quick Add frequent expenses
  const handleQuickAdd = (title: string, amount: number, category: string, method: PaymentMethod) => {
    const today = new Date().toISOString().slice(0, 10);
    onAddTransaction({
      title,
      amount,
      type: 'expense',
      category,
      date: today,
      paymentMethod: method,
      notes: 'Quick logged via 1-click tap',
    });
    setQuickAddedNotice(`Logged ${title} (${currencySymbol}${amount})`);
    setTimeout(() => setQuickAddedNotice(null), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-400" />
            Income & Expense Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Log daily and weekly transactions, categorize spending, and maintain full transparency
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition"
            title="Download CSV spreadsheet"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Quick-Add presets for busy professionals / daily spenders */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            ⚡ Quick-Log Frequent Expenses (1-Click):
          </span>
          {quickAddedNotice && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {quickAddedNotice}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleQuickAdd('Artisan Morning Coffee', 5, 'Dining & Takeout', 'UPI')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700 transition"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-400" />
            <span>Coffee ({currencySymbol}5)</span>
          </button>

          <button
            onClick={() => handleQuickAdd('Weekday Lunch Bento', 16, 'Dining & Takeout', 'Credit Card')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700 transition"
          >
            <Utensils className="w-3.5 h-3.5 text-orange-400" />
            <span>Lunch ({currencySymbol}16)</span>
          </button>

          <button
            onClick={() => handleQuickAdd('Grocery Fresh Staples', 45, 'Groceries & Food', 'Debit Card')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700 transition"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
            <span>Groceries ({currencySymbol}45)</span>
          </button>

          <button
            onClick={() => handleQuickAdd('City Transit Card Refill', 25, 'Transportation & Fuel', 'Credit Card')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700 transition"
          >
            <Bus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Metro / Fuel ({currencySymbol}25)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by merchant, note, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <div className="md:col-span-3 flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
            <button
              onClick={() => setSelectedType('all')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                selectedType === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedType('expense')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                selectedType === 'expense' ? 'bg-rose-500/20 text-rose-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setSelectedType('income')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                selectedType === 'income' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Income
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Categories</option>
              {STANDARD_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
              <option value="Salary">Salary</option>
              <option value="Freelance">Freelance</option>
              <option value="Dividends">Dividends</option>
              <option value="Allowance">Allowance</option>
            </select>
          </div>
        </div>

        {/* Aggregate Filter Badges */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <span>
            Showing <strong className="text-white">{filteredTransactions.length}</strong> transactions
          </span>
          <div className="flex items-center gap-4">
            <span>
              Total Inflow: <strong className="text-emerald-400 font-mono">+{currencySymbol}{totalFilteredIncome.toLocaleString()}</strong>
            </span>
            <span>
              Total Outflow: <strong className="text-rose-400 font-mono">-{currencySymbol}{totalFilteredExpense.toLocaleString()}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-lg">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CreditCard className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-300">No transactions match your search</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting filters or log a new transaction</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap font-mono text-xs">
                        {tx.date}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{tx.title}</div>
                        {tx.notes && <div className="text-[11px] text-slate-400">{tx.notes}</div>}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/80">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap text-xs">
                        {tx.paymentMethod}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold">
                        <span className={isIncome ? 'text-emerald-400' : 'text-slate-100'}>
                          {isIncome ? '+' : '-'}{currencySymbol}{tx.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
