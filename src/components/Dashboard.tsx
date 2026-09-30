import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight, 
  Bot, 
  ChevronRight,
  Flame,
  Calendar,
  Layers,
  HeartHandshake
} from 'lucide-react';
import { Transaction, ScenarioProfile, CategoryDef } from '../types/finance';
import { STANDARD_CATEGORIES } from '../data/mockProfiles';

interface DashboardProps {
  profile: ScenarioProfile;
  transactions: Transaction[];
  categoryBudgets: Record<string, number>;
  currencySymbol: string;
  onNavigateToTab: (tab: 'overview' | 'advisor' | 'transactions' | 'budget' | 'goals') => void;
  onAskBot: (prompt: string) => void;
  onOpenAddModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  profile,
  transactions,
  categoryBudgets,
  currencySymbol,
  onNavigateToTab,
  onAskBot,
  onOpenAddModal,
}) => {
  // Calculations
  const incomeTransactions = transactions.filter((t) => t.type === 'income');
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');

  const totalIncome = incomeTransactions.reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce((acc, t) => acc + t.amount, 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Category totals
  const categoryTotals: Record<string, number> = {};
  expenseTransactions.forEach((t) => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  // 50/30/20 rule classification
  let actualNeeds = 0;
  let actualWants = 0;
  let actualSavings = 0;

  const categoryTierMap: Record<string, 'needs' | 'wants' | 'savings'> = {};
  STANDARD_CATEGORIES.forEach((c) => {
    categoryTierMap[c.name] = c.tier;
  });

  expenseTransactions.forEach((t) => {
    const tier = categoryTierMap[t.category] || 'wants';
    if (tier === 'needs') actualNeeds += t.amount;
    else if (tier === 'wants') actualWants += t.amount;
    else if (tier === 'savings') actualSavings += t.amount;
  });

  const targetNeeds = Math.round(totalIncome * 0.50);
  const targetWants = Math.round(totalIncome * 0.30);
  const targetSavings = Math.round(totalIncome * 0.20);

  const needsPct = totalIncome > 0 ? Math.round((actualNeeds / totalIncome) * 100) : 0;
  const wantsPct = totalIncome > 0 ? Math.round((actualWants / totalIncome) * 100) : 0;
  const savingsPct = totalIncome > 0 ? Math.round((actualSavings / totalIncome) * 100) : 0;

  // Predictive spending
  // Assuming current date is ~day 28 of 30
  const daysInMonth = 30;
  const currentDay = 28;
  const dailyBurn = currentDay > 0 ? Math.round(totalExpenses / currentDay) : 0;
  const projectedMonthSpend = Math.round(dailyBurn * daysInMonth);
  const projectedSavings = Math.max(0, totalIncome - projectedMonthSpend);

  // Financial Health Score calculation
  let healthScore = 50;
  if (savingsRate >= 25) healthScore += 30;
  else if (savingsRate >= 15) healthScore += 20;
  else if (savingsRate >= 5) healthScore += 10;

  if (needsPct <= 50) healthScore += 10;
  if (wantsPct <= 30) healthScore += 10;

  healthScore = Math.min(96, Math.max(35, healthScore));

  // Overspending detection
  const overspentList: Array<{ category: string; spent: number; budget: number; overBy: number; pct: number }> = [];
  Object.keys(categoryBudgets).forEach((cat) => {
    const budget = categoryBudgets[cat] || 0;
    const spent = categoryTotals[cat] || 0;
    if (budget > 0 && spent > budget) {
      overspentList.push({
        category: cat,
        spent,
        budget,
        overBy: spent - budget,
        pct: Math.round((spent / budget) * 100),
      });
    }
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome & Scenario Persona Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950/60 border border-slate-700/80 p-5 sm:p-7 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Scenario: {profile.scenarioTag}
              </span>
              <span className="text-xs text-slate-400">Current Month: September 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-emerald-400">{profile.name}</span>!
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {profile.description}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={() => onAskBot('Can you give me an executive audit of my finances and where I should cut expenses this week?')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition transform active:scale-95"
            >
              <Bot className="w-4 h-4" />
              <span>Ask FinBot Audit</span>
            </button>
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm border border-slate-700 flex items-center gap-2 transition"
            >
              <span>+ Log Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Financial KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Monthly Income */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Monthly Income</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {currencySymbol}{totalIncome.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
              100%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <Wallet className="w-3 h-3 text-slate-400" />
            <span>{incomeTransactions.length} recorded income credits</span>
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500/30"></div>
        </div>

        {/* Total Monthly Expenses */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Monthly Expenses</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {currencySymbol}{totalExpenses.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-slate-400">
              {totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0}% of income
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{expenseTransactions.length} transactions across categories</span>
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500/30"></div>
        </div>

        {/* Net Monthly Savings */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Net Savings Retained</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${netSavings >= 0 ? 'text-white' : 'text-rose-400'}`}>
              {currencySymbol}{netSavings.toLocaleString()}
            </span>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${savingsRate >= 20 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {savingsRate}% rate
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {savingsRate >= 20 ? '🎉 Exceeds 20% savings rule' : 'Targeting 20% minimum savings target'}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500/30"></div>
        </div>

        {/* Financial Health Score */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Financial Health Score</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {healthScore}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              healthScore >= 80 ? 'bg-emerald-500/20 text-emerald-400' : healthScore >= 65 ? 'bg-sky-500/20 text-sky-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {healthScore >= 80 ? 'Prime' : healthScore >= 65 ? 'Strong' : 'Moderate'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            AI-evaluated cashflow, debt, and buffer metrics
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500/30"></div>
        </div>
      </div>

      {/* Overspending Alerts (If Any) */}
      {overspentList.length > 0 && (
        <div className="rounded-xl bg-amber-950/30 border border-amber-500/30 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-amber-200">
                  Budget Overrun Alert: {overspentList.length} category {overspentList.length > 1 ? 'exceeded limits' : 'exceeded limit'}
                </h3>
                <button
                  onClick={() => onAskBot(`I have overspent in ${overspentList.map(o => o.category).join(', ')}. How can I rebalance my budget and make up for this deficit?`)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-100 underline decoration-amber-500/50 underline-offset-2"
                >
                  <Bot className="w-3.5 h-3.5" />
                  Ask FinBot for Recovery Strategy
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {overspentList.map((item) => (
                  <div key={item.category} className="rounded-lg bg-slate-900/90 border border-amber-500/20 p-3 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-200">
                      <span>{item.category}</span>
                      <span className="text-rose-400 font-bold">+{currencySymbol}{item.overBy.toLocaleString()}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                      <span>Spent: {currencySymbol}{item.spent.toLocaleString()}</span>
                      <span>Cap: {currencySymbol}{item.budget.toLocaleString()} ({item.pct}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Middle Row: 50/30/20 Rule Breakdown + Predictive Spending Runway */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 50/30/20 Budget Rule Visualizer */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                50 / 30 / 20 Budget Rule Analysis
              </h2>
              <p className="text-xs text-slate-400">
                Gold standard allocation framework applied to your {currencySymbol}{totalIncome.toLocaleString()} monthly income
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('budget')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>Adjust Caps</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Needs Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-400"></span>
                  Essential Needs (Target: 50% max)
                </span>
                <span className="font-mono text-slate-300">
                  {currencySymbol}{actualNeeds.toLocaleString()} / {currencySymbol}{targetNeeds.toLocaleString()} ({needsPct}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    needsPct <= 50 ? 'bg-sky-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, (actualNeeds / (targetNeeds || 1)) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Housing, groceries, utilities, transit & healthcare</span>
                <span className={needsPct <= 50 ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                  {needsPct <= 50 ? '✓ Within 50% target' : '⚠️ Exceeding 50% target'}
                </span>
              </div>
            </div>

            {/* Wants Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-orange-400"></span>
                  Discretionary Wants (Target: 30% max)
                </span>
                <span className="font-mono text-slate-300">
                  {currencySymbol}{actualWants.toLocaleString()} / {currencySymbol}{targetWants.toLocaleString()} ({wantsPct}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    wantsPct <= 30 ? 'bg-orange-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, (actualWants / (targetWants || 1)) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Dining out, shopping, streaming, and leisure</span>
                <span className={wantsPct <= 30 ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                  {wantsPct <= 30 ? '✓ Controlled spending' : '⚠️ Over 30% limit'}
                </span>
              </div>
            </div>

            {/* Savings & Investments Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400"></span>
                  Savings & Investments (Target: 20% min)
                </span>
                <span className="font-mono text-slate-300">
                  {currencySymbol}{actualSavings.toLocaleString()} / {currencySymbol}{targetSavings.toLocaleString()} ({savingsPct}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (actualSavings / (targetSavings || 1)) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Emergency fund, stocks, retirement accounts</span>
                <span className="text-emerald-400 font-medium">
                  {savingsPct >= 20 ? '✓ Goal Achieved' : 'Need more allocation'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Predictive Spending Analytics Card */}
        <div className="lg:col-span-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-bold text-white">Predictive Spending Forecast</h3>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                AI Run-Rate Model
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Based on your logged transactions through Day {currentDay}, your current daily burn rate is{' '}
              <strong className="text-white font-mono">{currencySymbol}{dailyBurn} / day</strong>.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80">
              <div>
                <span className="text-[11px] text-slate-400 block uppercase">Projected Spend</span>
                <span className="text-lg font-bold text-white font-mono">
                  {currencySymbol}{projectedMonthSpend.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block uppercase">Projected EOM Savings</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {currencySymbol}{projectedSavings.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Forecast Verdict:</span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Surplus of {currencySymbol}{projectedSavings.toLocaleString()} expected
            </span>
          </div>
        </div>
      </div>

      {/* Category Spending Ledger & Visualizer */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base font-bold text-white">Category Spending vs. Monthly Budget</h2>
            <p className="text-xs text-slate-400">
              Live tracking of actual expense outflows against your personalized targets
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('budget')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Manage Budget Limits</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STANDARD_CATEGORIES.map((cat) => {
            const spent = categoryTotals[cat.name] || 0;
            const budget = categoryBudgets[cat.name] || 0;
            const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
            const isOver = spent > budget && budget > 0;

            if (spent === 0 && budget === 0) return null;

            return (
              <div
                key={cat.id}
                className="rounded-xl bg-slate-950/60 border border-slate-800/90 p-4 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: cat.color }}></span>
                    <span className="text-xs font-bold text-slate-200">{cat.name}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isOver
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : pct >= 80
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}
                  >
                    {isOver ? `Over by ${currencySymbol}${spent - budget}` : `${pct}% of cap`}
                  </span>
                </div>

                <div className="flex items-baseline justify-between text-xs mb-2">
                  <span className="font-mono font-bold text-white">
                    {currencySymbol}{spent.toLocaleString()}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Cap: {currencySymbol}{budget.toLocaleString()}
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOver ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FinBot Interactive Quick Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/20 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Personal Finance Advisor Bot Ready</h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Have questions about your budget, emergency fund, or how to save more? Chat directly with FinBot.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateToTab('advisor')}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 flex-shrink-0 shadow-lg shadow-emerald-500/20 transition"
        >
          <span>Open Advisor Chat</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
