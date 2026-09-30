import React, { useState } from 'react';
import { 
  Target, 
  Plus, 
  ShieldCheck, 
  Calendar, 
  DollarSign, 
  PiggyBank, 
  TrendingUp, 
  CheckCircle, 
  Sparkles,
  Zap,
  Check
} from 'lucide-react';
import { SavingsGoal, Transaction } from '../types/finance';

interface SavingsGoalsViewProps {
  goals: SavingsGoal[];
  currencySymbol: string;
  transactions: Transaction[];
  onAddGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  onContributeToGoal: (goalId: string, amount: number) => void;
}

export const SavingsGoalsView: React.FC<SavingsGoalsViewProps> = ({
  goals,
  currencySymbol,
  transactions,
  onAddGoal,
  onContributeToGoal,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGoalForContribution, setSelectedGoalForContribution] = useState<SavingsGoal | null>(null);
  const [contributionAmount, setContributionAmount] = useState<number>(200);

  // New Goal Form State
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState<number>(5000);
  const [newCurrent, setNewCurrent] = useState<number>(500);
  const [newDate, setNewDate] = useState('2027-01-01');
  const [newCategory, setNewCategory] = useState<SavingsGoal['category']>('emergency');

  // Calculate monthly essential expenses for emergency fund recommendations
  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const emergency3Months = totalExpenses * 3;
  const emergency6Months = totalExpenses * 6;

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newTarget <= 0) return;

    onAddGoal({
      title: newTitle.trim(),
      targetAmount: newTarget,
      currentAmount: Math.max(0, newCurrent),
      targetDate: newDate,
      category: newCategory,
      icon: newCategory === 'emergency' ? 'Shield' : newCategory === 'vacation' ? 'Plane' : 'Target',
      color: '#10b981',
    });

    setNewTitle('');
    setShowAddModal(false);
  };

  const handleMakeContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForContribution || contributionAmount <= 0) return;

    onContributeToGoal(selectedGoalForContribution.id, contributionAmount);
    setSelectedGoalForContribution(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Target className="w-6 h-6 text-emerald-400" />
            Goal-Based Savings & Wealth Reserves
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Build resilient emergency buffers, track vacation funds, and monitor milestone achievements
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition self-start sm:self-auto transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Goal</span>
        </button>
      </div>

      {/* Emergency Fund Readiness Benchmarking Card */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950/30 border border-emerald-500/20 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            AI Emergency Fund Benchmark
          </h3>
        </div>
        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
          Based on your current monthly outflow of <strong className="text-white font-mono">{currencySymbol}{totalExpenses.toLocaleString()}</strong>, here are your target financial safety shields:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4">
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">3-Month Baseline Shield</span>
            <span className="text-xl font-extrabold text-white font-mono mt-1 block">
              {currencySymbol}{emergency3Months.toLocaleString()}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Covers sudden medical or immediate repairs</p>
          </div>

          <div className="rounded-xl bg-slate-950/70 border border-emerald-500/30 p-4 bg-emerald-500/5">
            <span className="text-[11px] text-emerald-400 uppercase font-semibold block">6-Month Recommended Fortress</span>
            <span className="text-xl font-extrabold text-emerald-400 font-mono mt-1 block">
              {currencySymbol}{emergency6Months.toLocaleString()}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Full career transition and economic insulation</p>
          </div>

          <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">Automation Strategy</span>
            <p className="text-xs text-slate-300 mt-1">
              Deposit <strong className="text-white font-mono">{currencySymbol}350</strong> monthly to reach your 6-month goal in 12 months.
            </p>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {goals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.currentAmount / (goal.targetAmount || 1)) * 100));
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

          return (
            <div
              key={goal.id}
              className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-sm hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    <PiggyBank className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {pct}% Achieved
                  </span>
                </div>

                <h4 className="text-base font-bold text-white">{goal.title}</h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Target Date: {goal.targetDate}</span>
                </div>

                <div className="mt-4 flex items-baseline justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Saved so far</span>
                    <span className="text-lg font-bold text-emerald-400 font-mono">
                      {currencySymbol}{goal.currentAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[11px] block">Target Goal</span>
                    <span className="text-sm font-semibold text-white font-mono">
                      {currencySymbol}{goal.targetAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-2.5 w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2">
                  <span>Remaining: {currencySymbol}{remaining.toLocaleString()}</span>
                  {pct >= 100 && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Fully Funded!
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    setSelectedGoalForContribution(goal);
                    setContributionAmount(150);
                  }}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition"
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Deposit / Contribute to Goal</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Goal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                Create New Savings Goal
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Goal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Electric Vehicle, Tokyo Trip, House Downpayment"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target Amount ({currencySymbol})</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newTarget}
                    onChange={(e) => setNewTarget(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Starting Amount ({currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={newCurrent}
                    onChange={(e) => setNewCurrent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="emergency">Emergency Fund</option>
                    <option value="vacation">Vacation & Travel</option>
                    <option value="purchase">Major Purchase</option>
                    <option value="investment">Long-Term Investment</option>
                    <option value="education">Education</option>
                    <option value="general">General Savings</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Contribute to Goal */}
      {selectedGoalForContribution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Deposit to {selectedGoalForContribution.title}
            </h3>
            <p className="text-xs text-slate-400">
              Current Balance: {currencySymbol}{selectedGoalForContribution.currentAmount.toLocaleString()} / {currencySymbol}{selectedGoalForContribution.targetAmount.toLocaleString()}
            </p>

            <form onSubmit={handleMakeContribution} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Deposit Amount ({currencySymbol})</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-base font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedGoalForContribution(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                >
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
