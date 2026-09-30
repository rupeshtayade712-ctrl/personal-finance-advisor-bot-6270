import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { AdvisorBot } from './components/AdvisorBot';
import { TransactionsView } from './components/TransactionsView';
import { BudgetPlannerView } from './components/BudgetPlannerView';
import { SavingsGoalsView } from './components/SavingsGoalsView';
import { MonthlyReportModal } from './components/MonthlyReportModal';
import { AddTransactionModal } from './components/AddTransactionModal';
import { SCENARIO_PROFILES } from './data/mockProfiles';
import { ScenarioProfile, Transaction, SavingsGoal } from './types/finance';

export default function App() {
  // Profiles
  const [profiles] = useState<ScenarioProfile[]>(SCENARIO_PROFILES);
  const [activeProfile, setActiveProfile] = useState<ScenarioProfile>(SCENARIO_PROFILES[0]); // Rupesh is default!
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'advisor' | 'transactions' | 'budget' | 'goals'>('overview');
  const [initialBotPrompt, setInitialBotPrompt] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Profile-specific data state
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(`finbot_tx_${SCENARIO_PROFILES[0].id}`);
    return saved ? JSON.parse(saved) : SCENARIO_PROFILES[0].initialTransactions;
  });

  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(`finbot_budgets_${SCENARIO_PROFILES[0].id}`);
    return saved ? JSON.parse(saved) : SCENARIO_PROFILES[0].categoryBudgets;
  });

  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem(`finbot_goals_${SCENARIO_PROFILES[0].id}`);
    return saved ? JSON.parse(saved) : SCENARIO_PROFILES[0].goals;
  });

  // Switch Profile
  const handleSelectProfile = (newProfile: ScenarioProfile) => {
    setActiveProfile(newProfile);
    setCurrencySymbol(newProfile.currency.symbol);

    const savedTx = localStorage.getItem(`finbot_tx_${newProfile.id}`);
    setTransactions(savedTx ? JSON.parse(savedTx) : newProfile.initialTransactions);

    const savedBudgets = localStorage.getItem(`finbot_budgets_${newProfile.id}`);
    setCategoryBudgets(savedBudgets ? JSON.parse(savedBudgets) : newProfile.categoryBudgets);

    const savedGoals = localStorage.getItem(`finbot_goals_${newProfile.id}`);
    setGoals(savedGoals ? JSON.parse(savedGoals) : newProfile.goals);
  };

  // Persist state changes
  useEffect(() => {
    try {
      localStorage.setItem(`finbot_tx_${activeProfile.id}`, JSON.stringify(transactions));
    } catch (e) {
      console.error(e);
    }
  }, [transactions, activeProfile.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`finbot_budgets_${activeProfile.id}`, JSON.stringify(categoryBudgets));
    } catch (e) {
      console.error(e);
    }
  }, [categoryBudgets, activeProfile.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`finbot_goals_${activeProfile.id}`, JSON.stringify(goals));
    } catch (e) {
      console.error(e);
    }
  }, [goals, activeProfile.id]);

  // Handlers
  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`,
    };
    setTransactions((prev) => [transaction, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateBudgets = (newBudgets: Record<string, number>) => {
    setCategoryBudgets(newBudgets);
  };

  const handleAddGoal = (newGoal: Omit<SavingsGoal, 'id'>) => {
    const goal: SavingsGoal = {
      ...newGoal,
      id: `goal-${Date.now()}`,
    };
    setGoals((prev) => [...prev, goal]);
  };

  const handleContributeToGoal = (goalId: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          return {
            ...g,
            currentAmount: g.currentAmount + amount,
          };
        }
        return g;
      })
    );

    // Also record a transaction for transparency
    const targetGoal = goals.find((g) => g.id === goalId);
    handleAddTransaction({
      title: `Deposit to ${targetGoal ? targetGoal.title : 'Savings Goal'}`,
      amount,
      type: 'expense',
      category: 'Investments & Savings',
      paymentMethod: 'Bank Transfer',
      date: new Date().toISOString().slice(0, 10),
      notes: 'Automated goal contribution',
    });
  };

  const handleAskBot = (prompt: string) => {
    setInitialBotPrompt(prompt);
    setActiveTab('advisor');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setInitialBotPrompt('');
        }}
        activeProfile={activeProfile}
        allProfiles={profiles}
        onSelectProfile={handleSelectProfile}
        currencySymbol={currencySymbol}
        onSelectCurrency={setCurrencySymbol}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'overview' && (
          <Dashboard
            profile={activeProfile}
            transactions={transactions}
            categoryBudgets={categoryBudgets}
            currencySymbol={currencySymbol}
            onNavigateToTab={setActiveTab}
            onAskBot={handleAskBot}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        )}

        {activeTab === 'advisor' && (
          <AdvisorBot
            profile={{ ...activeProfile, goals }}
            transactions={transactions}
            categoryBudgets={categoryBudgets}
            currencySymbol={currencySymbol}
            initialPrompt={initialBotPrompt}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            currencySymbol={currencySymbol}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetPlannerView
            profile={activeProfile}
            transactions={transactions}
            categoryBudgets={categoryBudgets}
            currencySymbol={currencySymbol}
            onUpdateBudgets={handleUpdateBudgets}
          />
        )}

        {activeTab === 'goals' && (
          <SavingsGoalsView
            goals={goals}
            currencySymbol={currencySymbol}
            transactions={transactions}
            onAddGoal={handleAddGoal}
            onContributeToGoal={handleContributeToGoal}
          />
        )}
      </main>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        currencySymbol={currencySymbol}
        onAddTransaction={handleAddTransaction}
      />

      <MonthlyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        profile={{ ...activeProfile, goals }}
        transactions={transactions}
        categoryBudgets={categoryBudgets}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}
