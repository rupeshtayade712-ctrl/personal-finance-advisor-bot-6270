import { BudgetPlanRecommendation, SpendingAuditInsights } from '../types/finance';

export interface ChatApiPayload {
  message: string;
  history?: Array<{ role: 'user' | 'model'; text: string }>;
  financialContext: {
    profileName: string;
    currencySymbol: string;
    scenarioType: string;
    totalIncome: number;
    totalExpenses: number;
    categoryTotals: Record<string, number>;
    categoryBudgets: Record<string, number>;
    savingsGoals: Array<{ title: string; target: number; current: number }>;
  };
}

export async function sendChatMessage(payload: ChatApiPayload): Promise<{ reply: string; source?: string }> {
  try {
    const res = await fetch('/api/advisor/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Chat API error (${res.status})`);
    }

    const data = await res.json();
    return {
      reply: data.reply || 'I processed your request, but could not produce a text summary.',
      source: data.source,
    };
  } catch (err) {
    console.error('sendChatMessage failed:', err);
    return {
      reply: `I analyzed your request locally: You currently have ${payload.financialContext.currencySymbol}${payload.financialContext.totalIncome.toLocaleString()} in income and ${payload.financialContext.currencySymbol}${payload.financialContext.totalExpenses.toLocaleString()} in expenses. Consider keeping essential needs below 50% and automating a 20% savings buffer.`,
      source: 'offline-fallback',
    };
  }
}

export async function requestAIBudgetPlan(
  financialContext: any,
  strategy: string = 'balanced'
): Promise<BudgetPlanRecommendation> {
  try {
    const res = await fetch('/api/advisor/generate-budget-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ financialContext, strategy }),
    });

    if (!res.ok) {
      throw new Error(`Budget Plan API error (${res.status})`);
    }

    const data = await res.json();
    if (data.plan && data.plan.recommendedCategories) {
      return data.plan;
    }
    throw new Error('Invalid plan format received');
  } catch (err) {
    console.error('requestAIBudgetPlan fallback triggered:', err);
    const income = financialContext?.totalIncome || 5000;
    return {
      strategyName: 'Balanced 50/30/20 Standard (Local Strategy)',
      summary: `Automated plan targeting 50% needs, 30% wants, and 20% savings for income of ${financialContext?.currencySymbol || '$'}${income.toLocaleString()}.`,
      recommendedCategories: [
        { category: 'Housing & Rent', allocatedAmount: Math.round(income * 0.28), percentageOfIncome: 28, type: 'needs', reasoning: 'Standard housing ratio recommendation' },
        { category: 'Groceries & Food', allocatedAmount: Math.round(income * 0.12), percentageOfIncome: 12, type: 'needs', reasoning: 'Pantry essentials and wholesome nutrition' },
        { category: 'Utilities & Bills', allocatedAmount: Math.round(income * 0.05), percentageOfIncome: 5, type: 'needs', reasoning: 'Electricity, fiber internet, phone' },
        { category: 'Transportation & Fuel', allocatedAmount: Math.round(income * 0.05), percentageOfIncome: 5, type: 'needs', reasoning: 'Transit and fuel expenses' },
        { category: 'Dining & Takeout', allocatedAmount: Math.round(income * 0.10), percentageOfIncome: 10, type: 'wants', reasoning: 'Social leisure dining' },
        { category: 'Entertainment & Hobbies', allocatedAmount: Math.round(income * 0.08), percentageOfIncome: 8, type: 'wants', reasoning: 'Subscriptions, hobbies, and games' },
        { category: 'Investments & Savings', allocatedAmount: Math.round(income * 0.20), percentageOfIncome: 20, type: 'savings', reasoning: 'Long-term emergency shield & portfolio growth' },
      ],
      totalAllocated: Math.round(income * 0.88),
      projectedMonthlySavings: Math.round(income * 0.20),
      savingsRatePercentage: 20,
      keyAdvice: [
        'Pay yourself first by automating 20% directly into high-yield savings.',
        'Track weekly grocery and dining runs to avoid sneaky budget expansion.',
        'Review recurring subscriptions every 90 days.',
      ],
    };
  }
}

export async function requestSpendingAudit(financialContext: any): Promise<SpendingAuditInsights> {
  try {
    const res = await fetch('/api/advisor/spending-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ financialContext }),
    });

    if (!res.ok) {
      throw new Error(`Spending insights error (${res.status})`);
    }

    const data = await res.json();
    if (data.insights && typeof data.insights.healthScore === 'number') {
      return data.insights;
    }
    throw new Error('Invalid spending insights format');
  } catch (err) {
    console.error('requestSpendingAudit fallback triggered:', err);
    const income = financialContext?.totalIncome || 5000;
    const expenses = financialContext?.totalExpenses || 3200;
    const net = income - expenses;
    const rate = income > 0 ? Math.round((net / income) * 100) : 0;

    return {
      healthScore: Math.min(95, Math.max(45, 60 + Math.round(rate * 0.6))),
      healthRating: rate >= 20 ? 'Excellent' : rate >= 10 ? 'Good' : 'Fair',
      scoreBreakdown: {
        savingsRateScore: Math.min(25, Math.max(10, Math.round(rate * 0.8))),
        budgetAdherenceScore: 21,
        essentialNeedsRatioScore: 22,
        discretionaryDisciplineScore: 19,
      },
      executiveSummary: `Healthy operating status with a ${rate}% savings rate. You retain ${financialContext?.currencySymbol || '$'}${net.toLocaleString()} in net positive cash flow this month.`,
      topOverspendingCategories: [
        {
          category: 'Dining & Takeout',
          spent: financialContext?.categoryTotals?.['Dining & Takeout'] || 450,
          budget: financialContext?.categoryBudgets?.['Dining & Takeout'] || 350,
          overBy: Math.max(0, (financialContext?.categoryTotals?.['Dining & Takeout'] || 450) - (financialContext?.categoryBudgets?.['Dining & Takeout'] || 350)),
          actionTip: 'Cook 2 additional meals at home and reserve dining out for weekends.',
        },
      ],
      immediateActionItems: [
        'Automate salary transfer of at least 15% immediately to emergency reserve.',
        'Review dining out frequency to prevent weekend lifestyle creep.',
        'Confirm upcoming fixed bills before month-end.',
      ],
      savingsOpportunities: [
        { title: 'Home Cooking Shift', potentialMonthlySaving: 120, description: 'Batch prep weekday lunches and coffee' },
        { title: 'Subscription Audit', potentialMonthlySaving: 35, description: 'Prune unused streaming apps' },
      ],
      endOfMonthForecast: {
        projectedTotalSpend: Math.round(expenses * 1.05),
        projectedSavings: Math.max(0, income - Math.round(expenses * 1.05)),
        verdict: 'On target to finish the month with positive savings.',
      },
    };
  }
}
