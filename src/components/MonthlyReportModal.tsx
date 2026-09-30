import React from 'react';
import { 
  FileText, 
  Printer, 
  X, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Target, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { ScenarioProfile, Transaction } from '../types/finance';
import { STANDARD_CATEGORIES } from '../data/mockProfiles';

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ScenarioProfile;
  transactions: Transaction[];
  categoryBudgets: Record<string, number>;
  currencySymbol: string;
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
  isOpen,
  onClose,
  profile,
  transactions,
  categoryBudgets,
  currencySymbol,
}) => {
  if (!isOpen) return null;

  const incomeTxs = transactions.filter((t) => t.type === 'income');
  const expenseTxs = transactions.filter((t) => t.type === 'expense');

  const totalIncome = incomeTxs.reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = expenseTxs.reduce((acc, t) => acc + t.amount, 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Category totals
  const categoryTotals: Record<string, number> = {};
  expenseTxs.forEach((t) => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl my-8 p-6 sm:p-8 shadow-2xl space-y-6 text-slate-200 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Monthly Financial Summary & Health Report</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="space-y-6">
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 print:border-black">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white print:text-black tracking-tight">
                Personal Finance Monthly Report
              </h1>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
                Prepared by FinBot for <strong className="text-emerald-400 print:text-black">{profile.name}</strong> • Scenario: {profile.scenarioTag}
              </p>
            </div>
            <div className="text-right text-xs text-slate-400 print:text-slate-600">
              <div>Reporting Period: <strong>September 2026</strong></div>
              <div>Generated: {new Date().toLocaleDateString()}</div>
            </div>
          </div>

          {/* Section 1: Executive Cash Flow Summary */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 print:text-slate-700">
              1. Monthly Cash Flow Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 print:border-slate-300 print:bg-slate-50">
                <span className="text-[11px] text-slate-400 print:text-slate-600 block">Total Income</span>
                <span className="text-lg font-bold text-white print:text-black font-mono mt-0.5 block">
                  {currencySymbol}{totalIncome.toLocaleString()}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 print:border-slate-300 print:bg-slate-50">
                <span className="text-[11px] text-slate-400 print:text-slate-600 block">Total Expenses</span>
                <span className="text-lg font-bold text-rose-400 print:text-rose-700 font-mono mt-0.5 block">
                  {currencySymbol}{totalExpenses.toLocaleString()}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 print:border-slate-300 print:bg-slate-50">
                <span className="text-[11px] text-slate-400 print:text-slate-600 block">Savings Achieved</span>
                <span className="text-lg font-bold text-emerald-400 print:text-emerald-700 font-mono mt-0.5 block">
                  {currencySymbol}{netSavings.toLocaleString()}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 print:border-slate-300 print:bg-slate-50">
                <span className="text-[11px] text-slate-400 print:text-slate-600 block">Savings Rate</span>
                <span className="text-lg font-bold text-cyan-400 print:text-cyan-700 font-mono mt-0.5 block">
                  {savingsRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Overspending & Category Audit */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 print:text-slate-700">
              2. Category Spending vs. Budget Caps
            </h3>
            <div className="rounded-xl border border-slate-800 print:border-slate-300 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800/60 print:bg-slate-100 text-slate-400 print:text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5 text-right">Budget</th>
                    <th className="p-2.5 text-right">Actual Spent</th>
                    <th className="p-2.5 text-right">Variance</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 print:divide-slate-200">
                  {STANDARD_CATEGORIES.map((cat) => {
                    const spent = categoryTotals[cat.name] || 0;
                    const budget = categoryBudgets[cat.name] || 0;
                    if (spent === 0 && budget === 0) return null;
                    const diff = budget - spent;
                    const isOver = diff < 0;

                    return (
                      <tr key={cat.id} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-medium text-slate-200 print:text-black">{cat.name}</td>
                        <td className="p-2.5 text-right font-mono">{currencySymbol}{budget.toLocaleString()}</td>
                        <td className="p-2.5 text-right font-mono">{currencySymbol}{spent.toLocaleString()}</td>
                        <td className={`p-2.5 text-right font-mono font-bold ${isOver ? 'text-rose-400 print:text-rose-600' : 'text-emerald-400 print:text-emerald-600'}`}>
                          {diff >= 0 ? '+' : '-'}{currencySymbol}{Math.abs(diff).toLocaleString()}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isOver ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {isOver ? 'Over Limit' : 'Within Cap'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Savings Goals Tracking */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 print:text-slate-700">
              3. Progress Toward Next Month Financial Goals
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.goals.map((g) => {
                const pct = Math.min(100, Math.round((g.currentAmount / (g.targetAmount || 1)) * 100));
                return (
                  <div key={g.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 print:border-slate-300 print:bg-slate-50 text-xs">
                    <div className="flex justify-between items-center font-bold text-white print:text-black">
                      <span>{g.title}</span>
                      <span className="font-mono text-emerald-400 print:text-emerald-700">{pct}%</span>
                    </div>
                    <div className="flex justify-between text-slate-400 print:text-slate-600 text-[11px] mt-1">
                      <span>Saved: {currencySymbol}{g.currentAmount.toLocaleString()}</span>
                      <span>Target: {currencySymbol}{g.targetAmount.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Action Items for Next Month */}
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 print:bg-emerald-50 print:border-emerald-300">
            <h4 className="text-xs font-bold text-emerald-400 print:text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Strategic Action Plan for Next Month
            </h4>
            <ul className="text-xs text-slate-300 print:text-slate-800 space-y-1.5 list-disc list-inside">
              <li>
                <strong>Cap Weekend Dining:</strong> Trim restaurant orders by 15% to recover budget overruns.
              </li>
              <li>
                <strong>Automate Salary Deposit:</strong> Transfer {currencySymbol}{Math.round(totalIncome * 0.20).toLocaleString()} to the Emergency Shield on Day 1.
              </li>
              <li>
                <strong>Subscription Cleanup:</strong> Verify streaming and software licenses before automatic renewal.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
