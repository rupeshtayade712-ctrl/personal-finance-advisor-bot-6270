import React, { useState } from 'react';
import { 
  PieChart, 
  Sparkles, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  DollarSign, 
  ArrowRight, 
  ShieldCheck, 
  Sliders,
  ChevronRight
} from 'lucide-react';
import { ScenarioProfile, Transaction, BudgetPlanRecommendation } from '../types/finance';
import { STANDARD_CATEGORIES } from '../data/mockProfiles';
import { requestAIBudgetPlan } from '../services/api';

interface BudgetPlannerViewProps {
  profile: ScenarioProfile;
  transactions: Transaction[];
  categoryBudgets: Record<string, number>;
  currencySymbol: string;
  onUpdateBudgets: (newBudgets: Record<string, number>) => void;
}

export const BudgetPlannerView: React.FC<BudgetPlannerViewProps> = ({
  profile,
  transactions,
  categoryBudgets,
  currencySymbol,
  onUpdateBudgets,
}) => {
  const [editingBudgets, setEditingBudgets] = useState<Record<string, number>>({ ...categoryBudgets });
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('balanced');
  const [aiRecommendation, setAiRecommendation] = useState<BudgetPlanRecommendation | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // Income & Expenses
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const categoryTotals: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

  const totalBudgeted = Object.values(editingBudgets).reduce((acc, val) => acc + (val || 0), 0);
  const unallocated = totalIncome - totalBudgeted;

  const handleBudgetChange = (catName: string, value: number) => {
    setEditingBudgets((prev) => ({
      ...prev,
      [catName]: Math.max(0, value),
    }));
  };

  const handleSaveBudgets = () => {
    onUpdateBudgets(editingBudgets);
    setAppliedSuccess(true);
    setTimeout(() => setAppliedSuccess(false), 3000);
  };

  const handleGenerateAIPlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const financialContext = {
        profileName: profile.name,
        currencySymbol,
        totalIncome,
        categories: STANDARD_CATEGORIES.map((c) => c.name),
        categoryTotals,
        categoryBudgets,
      };

      const plan = await requestAIBudgetPlan(financialContext, selectedStrategy);
      setAiRecommendation(plan);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleApplyAIRecommendation = () => {
    if (!aiRecommendation) return;

    const newBudgets: Record<string, number> = { ...editingBudgets };
    aiRecommendation.recommendedCategories.forEach((rec) => {
      newBudgets[rec.category] = rec.allocatedAmount;
    });

    setEditingBudgets(newBudgets);
    onUpdateBudgets(newBudgets);
    setAppliedSuccess(true);
    setTimeout(() => setAppliedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <PieChart className="w-6 h-6 text-emerald-400" />
            Personalized Monthly Budget Plan
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Automate budget caps, balance needs vs. wants, and eliminate budget overruns
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveBudgets}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition"
          >
            {appliedSuccess ? <Check className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{appliedSuccess ? 'Saved Successfully!' : 'Save Budget Limits'}</span>
          </button>
        </div>
      </div>

      {/* Income Allocation Bar */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
              Income Allocation Balance
            </span>
          </div>
          <div className="text-xs text-slate-400">
            Total Monthly Income: <strong className="text-white font-mono">{currencySymbol}{totalIncome.toLocaleString()}</strong>
          </div>
        </div>

        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
          <div
            className={`h-full transition-all duration-500 ${
              totalBudgeted > totalIncome ? 'bg-rose-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, totalIncome > 0 ? (totalBudgeted / totalIncome) * 100 : 0)}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center text-xs mt-3">
          <span className="text-slate-400">
            Allocated to Categories:{' '}
            <strong className="text-white font-mono">{currencySymbol}{totalBudgeted.toLocaleString()}</strong>
          </span>
          <span className={unallocated >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
            {unallocated >= 0
              ? `Unallocated Buffer: ${currencySymbol}${unallocated.toLocaleString()}`
              : `Over-allocated by ${currencySymbol}${Math.abs(unallocated).toLocaleString()}`}
          </span>
        </div>
      </div>

      {/* AI Budget Generator Card */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800/90 to-indigo-950/40 border border-emerald-500/30 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                AI-Powered Generator
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">Generate an Automated AI Budget Plan</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              FinBot uses machine learning guidelines and your income of {currencySymbol}{totalIncome.toLocaleString()} to compute mathematically sound caps tailored to your selected financial strategy.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            >
              <option value="balanced">Balanced 50/30/20 Standard</option>
              <option value="aggressive-savings">Aggressive Wealth Builder (40% Savings)</option>
              <option value="debt-payoff">Debt Payoff & Accelerated Freedom</option>
              <option value="student-frugal">Student / Frugal Minimum Baseline</option>
            </select>

            <button
              onClick={handleGenerateAIPlan}
              disabled={isGeneratingPlan}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isGeneratingPlan ? 'animate-spin' : ''}`} />
              <span>{isGeneratingPlan ? 'Computing AI Plan...' : 'Generate AI Plan'}</span>
            </button>
          </div>
        </div>

        {/* Render Generated AI Recommendation Modal / Block */}
        {aiRecommendation && (
          <div className="mt-5 pt-5 border-t border-slate-700/80 space-y-4 bg-slate-950/50 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  {aiRecommendation.strategyName}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">{aiRecommendation.summary}</p>
              </div>

              <button
                onClick={handleApplyAIRecommendation}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto transition"
              >
                <span>Apply This AI Plan to All Categories</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {aiRecommendation.recommendedCategories.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-200">
                    <span>{item.category}</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {currencySymbol}{item.allocatedAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                    <span>{item.percentageOfIncome}% of income</span>
                    <span className="capitalize">{item.type}</span>
                  </div>
                  {item.reasoning && (
                    <p className="text-[10px] text-slate-400 mt-1 italic">{item.reasoning}</p>
                  )}
                </div>
              ))}
            </div>

            {aiRecommendation.keyAdvice && aiRecommendation.keyAdvice.length > 0 && (
              <div className="pt-2 border-t border-slate-800 text-xs text-slate-300">
                <span className="font-bold text-emerald-400 block mb-1">Key Strategic Recommendations:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-400">
                  {aiRecommendation.keyAdvice.map((adv, i) => (
                    <li key={i}>{adv}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Budget Adjustment Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-sm">
        <h3 className="text-base font-bold text-white mb-1">Category Spending Limits</h3>
        <p className="text-xs text-slate-400 mb-4">
          Adjust the allocated cap for each category to match your lifestyle priorities
        </p>

        <div className="space-y-4">
          {STANDARD_CATEGORIES.map((cat) => {
            const currentAlloc = editingBudgets[cat.name] || 0;
            const actualSpent = categoryTotals[cat.name] || 0;
            const isOver = actualSpent > currentAlloc && currentAlloc > 0;
            const pctUsed = currentAlloc > 0 ? Math.round((actualSpent / currentAlloc) * 100) : 0;

            return (
              <div
                key={cat.id}
                className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-4 hover:border-slate-700 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }}></span>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-white">{cat.name}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Tier: {cat.tier}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right text-xs">
                      <span className="text-slate-400 block text-[11px]">Actual Spent:</span>
                      <span className={`font-mono font-bold ${isOver ? 'text-rose-400' : 'text-slate-200'}`}>
                        {currencySymbol}{actualSpent.toLocaleString()} ({pctUsed}%)
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
                      <span className="text-xs font-mono text-emerald-400">{currencySymbol}</span>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={currentAlloc}
                        onChange={(e) => handleBudgetChange(cat.name, parseFloat(e.target.value) || 0)}
                        className="w-24 bg-transparent text-xs font-mono font-bold text-white focus:outline-none text-right"
                      />
                    </div>
                  </div>
                </div>

                {/* Micro Progress Bar */}
                <div className="mt-3 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOver ? 'bg-rose-500' : pctUsed >= 80 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, pctUsed)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
