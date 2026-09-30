import React from 'react';
import { 
  Bot, 
  LayoutDashboard, 
  CreditCard, 
  PieChart, 
  Target, 
  PlusCircle, 
  FileText,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import { ScenarioProfile } from '../types/finance';

interface NavbarProps {
  activeTab: 'overview' | 'advisor' | 'transactions' | 'budget' | 'goals';
  setActiveTab: (tab: 'overview' | 'advisor' | 'transactions' | 'budget' | 'goals') => void;
  activeProfile: ScenarioProfile;
  allProfiles: ScenarioProfile[];
  onSelectProfile: (profile: ScenarioProfile) => void;
  currencySymbol: string;
  onSelectCurrency: (symbol: string) => void;
  onOpenAddModal: () => void;
  onOpenReportModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeProfile,
  allProfiles,
  onSelectProfile,
  currencySymbol,
  onSelectCurrency,
  onOpenAddModal,
  onOpenReportModal,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = React.useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = React.useState(false);

  const currencies = [
    { symbol: '$', code: 'USD', name: 'US Dollar ($)' },
    { symbol: '₹', code: 'INR', name: 'Indian Rupee (₹)' },
    { symbol: '€', code: 'EUR', name: 'Euro (€)' },
    { symbol: '£', code: 'GBP', name: 'British Pound (£)' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Personal Finance Advisor Bot
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  AI Active
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Dedicated Financial Planner for <span className="text-emerald-400 font-medium">{activeProfile.name}</span>
              </p>
            </div>
          </div>

          {/* Scenario Switcher & Currency */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Currency Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setCurrencyDropdownOpen(!currencyDropdownOpen);
                  setProfileDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition"
                title="Change display currency"
              >
                <span className="font-bold text-emerald-400">{currencySymbol}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {currencyDropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl bg-slate-900 border border-slate-700 shadow-xl py-1 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Select Currency
                  </div>
                  {currencies.map((cur) => (
                    <button
                      key={cur.code}
                      onClick={() => {
                        onSelectCurrency(cur.symbol);
                        setCurrencyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition ${
                        currencySymbol === cur.symbol ? 'text-emerald-400 font-semibold bg-emerald-500/5' : 'text-slate-300'
                      }`}
                    >
                      <span>{cur.name}</span>
                      <span className="font-mono text-slate-400">{cur.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Scenario Profile Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setCurrencyDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-xs text-slate-200 transition"
              >
                <span className="text-base">{activeProfile.avatar}</span>
                <div className="text-left hidden md:block">
                  <span className="font-bold text-white block leading-tight">{activeProfile.name}</span>
                  <span className="text-[10px] text-slate-400 leading-none">{activeProfile.scenarioTag}</span>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Switch Scenario Profile
                  </div>
                  {allProfiles.map((p) => {
                    const isSelected = p.id === activeProfile.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectProfile(p);
                          setProfileDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 text-xs flex items-start gap-2.5 hover:bg-slate-800/80 transition ${
                          isSelected ? 'bg-emerald-500/10 border-l-2 border-emerald-400' : ''
                        }`}
                      >
                        <span className="text-xl mt-0.5">{p.avatar}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white truncate">{p.name}</span>
                            {isSelected && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Active</span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block truncate">{p.personaTitle}</span>
                        </div>
                      </button>
                    );
                  })}
                  <div className="px-3 pt-2 mt-1 border-t border-slate-800 text-[11px] text-slate-500 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Built for Rupesh & adaptable to all financial life stages.
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action: Log Expense */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition transform active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Log Transaction</span>
            </button>

            {/* Monthly Report Quick Trigger */}
            <button
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
              title="Generate Monthly Financial Summary Report"
            >
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Report</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 sm:space-x-4 border-t border-slate-800/80 overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('advisor')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap relative ${
              activeTab === 'advisor'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Bot className="w-4 h-4 text-emerald-400 animate-bounce" />
            <span>Advisor Bot</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'transactions'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Transactions</span>
          </button>

          <button
            onClick={() => setActiveTab('budget')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'budget'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Budget Plan</span>
          </button>

          <button
            onClick={() => setActiveTab('goals')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'goals'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Savings Goals</span>
          </button>
        </div>
      </div>
    </header>
  );
};
