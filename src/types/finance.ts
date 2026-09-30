export type TransactionType = 'income' | 'expense';
export type BudgetTier = 'needs' | 'wants' | 'savings';

export type PaymentMethod = 
  | 'Bank Transfer' 
  | 'Credit Card' 
  | 'Debit Card' 
  | 'Cash' 
  | 'UPI' 
  | 'Digital Wallet';

export interface Transaction {
  id: string;
  date: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  isRecurring?: boolean;
}

export interface CategoryDef {
  id: string;
  name: string;
  tier: BudgetTier;
  color: string;
  bgColor: string;
  iconName: string;
}

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  frequency: 'Monthly' | 'Bi-Weekly' | 'Weekly' | 'Project-based';
  isVariable?: boolean;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: 'emergency' | 'investment' | 'purchase' | 'vacation' | 'education' | 'general';
  icon: string;
  color: string;
}

export interface ScenarioProfile {
  id: string;
  name: string;
  personaTitle: string;
  avatar: string;
  currency: {
    symbol: string;
    code: string;
  };
  scenarioTag: 'Salaried Professional' | 'College Student' | 'Freelancer' | 'Household Manager' | 'Custom';
  description: string;
  incomeSources: IncomeSource[];
  initialTransactions: Transaction[];
  categoryBudgets: Record<string, number>;
  goals: SavingsGoal[];
  scenarioNotes: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  quickActions?: Array<{ label: string; action: string }>;
}

export interface BudgetPlanRecommendation {
  strategyName: string;
  summary: string;
  recommendedCategories: Array<{
    category: string;
    allocatedAmount: number;
    percentageOfIncome: number;
    type: 'needs' | 'wants' | 'savings';
    reasoning: string;
  }>;
  totalAllocated: number;
  projectedMonthlySavings: number;
  savingsRatePercentage: number;
  keyAdvice: string[];
}

export interface SpendingAuditInsights {
  healthScore: number;
  healthRating: 'Critical' | 'Fair' | 'Good' | 'Excellent' | 'Prime';
  scoreBreakdown: {
    savingsRateScore: number;
    budgetAdherenceScore: number;
    essentialNeedsRatioScore: number;
    discretionaryDisciplineScore: number;
  };
  executiveSummary: string;
  topOverspendingCategories: Array<{
    category: string;
    spent: number;
    budget: number;
    overBy: number;
    actionTip: string;
  }>;
  immediateActionItems: string[];
  savingsOpportunities: Array<{
    title: string;
    potentialMonthlySaving: number;
    description: string;
  }>;
  endOfMonthForecast: {
    projectedTotalSpend: number;
    projectedSavings: number;
    verdict: string;
  };
}
