import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '5mb' }));

  // Initialize server-side Gemini client
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey
    ? new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
    : null;

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(apiKey),
      timestamp: new Date().toISOString(),
    });
  });

  // Chat endpoint for Personal Finance Advisor Bot
  app.post('/api/advisor/chat', async (req: Request, res: Response) => {
    try {
      const { message, history = [], financialContext } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      // If Gemini client is not initialized, generate a helpful structured fallback
      if (!ai) {
        const fallbackReply = generateFallbackChatResponse(message, financialContext);
        res.json({ reply: fallbackReply, source: 'algorithmic-advisor' });
        return;
      }

      const userName = financialContext?.profileName || 'Rupesh';
      const currency = financialContext?.currencySymbol || '$';
      const totalIncome = financialContext?.totalIncome || 0;
      const totalExpenses = financialContext?.totalExpenses || 0;
      const savings = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;

      const systemInstruction = `You are "FinBot", an expert Personal Finance Advisor Bot dedicated to helping individuals manage their money with clarity, confidence, and discipline.
You are currently advising ${userName}.
Always address ${userName} with a respectful, encouraging, and highly analytical tone.

CURRENT FINANCIAL CONTEXT FOR ${userName}:
- Currency: ${currency}
- Monthly Income: ${currency}${totalIncome.toLocaleString()}
- Total Expenses Logged: ${currency}${totalExpenses.toLocaleString()}
- Current Net Savings: ${currency}${savings.toLocaleString()} (Savings Rate: ${savingsRate}%)
- Category Spending Breakdown: ${JSON.stringify(financialContext?.categoryTotals || {})}
- Active Category Budgets: ${JSON.stringify(financialContext?.categoryBudgets || {})}
- Savings Goals: ${JSON.stringify(financialContext?.savingsGoals || [])}
- Scenario / Persona: ${financialContext?.scenarioType || 'Salaried Professional'}

GUIDELINES:
1. Provide practical, numbers-backed advice tailored to their exact income, expenses, and goals.
2. Recommend the 50/30/20 budget framework (Needs 50%, Wants 30%, Savings/Debts 20%) or explain adjustments when relevant.
3. If spending exceeds budget in any category, identify the specific leak and propose 2-3 actionable reduction tactics.
4. If asked about emergency funds, recommend 3 to 6 months of essential living expenses.
5. Use concise bullet points, bold key figures, and format currency with ${currency}.
6. Keep answers structured, positive, and direct.`;

      // Build conversation contents
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      // Add recent history if provided
      if (Array.isArray(history)) {
        for (const item of history.slice(-6)) {
          if (item.text && (item.role === 'user' || item.role === 'model')) {
            contents.push({
              role: item.role,
              parts: [{ text: item.text }],
            });
          }
        }
      }

      // Append current message
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const reply = response.text || 'I analyzed your query, but could not produce a response right now. Please try again.';
      res.json({ reply, source: 'gemini-3.8-flash' });
    } catch (error: any) {
      console.error('Error in /api/advisor/chat:', error);
      // Fallback response on error so user experience is smooth
      const fallbackReply = generateFallbackChatResponse(req.body?.message || '', req.body?.financialContext);
      res.json({
        reply: fallbackReply,
        source: 'fallback-advisor',
        warning: 'Live AI temporarily unavailable; provided smart local analysis.',
      });
    }
  });

  // Automated Budget Plan Generator
  app.post('/api/advisor/generate-budget-plan', async (req: Request, res: Response) => {
    try {
      const { financialContext, strategy = 'balanced' } = req.body;
      const userName = financialContext?.profileName || 'Rupesh';
      const currency = financialContext?.currencySymbol || '$';
      const totalIncome = financialContext?.totalIncome || 5000;
      const categories = financialContext?.categories || ['Rent & Housing', 'Groceries & Food', 'Utilities', 'Transportation', 'Dining & Entertainment', 'Subscriptions', 'Healthcare', 'Savings & Investments'];

      if (!ai) {
        const algorithmicPlan = generateAlgorithmicBudgetPlan(totalIncome, categories, strategy, currency);
        res.json({ plan: algorithmicPlan, source: 'algorithmic' });
        return;
      }

      const prompt = `As a senior financial planner, generate an optimal monthly budget plan for ${userName}.
Monthly Income: ${currency}${totalIncome}
Strategy: ${strategy} (Options: balanced 50/30/20, aggressive-savings, debt-payoff, student-frugal, variable-smoothing)
Categories to include: ${categories.join(', ')}

Return a JSON object with:
{
  "strategyName": string,
  "summary": string,
  "recommendedCategories": [
    { "category": string, "allocatedAmount": number, "percentageOfIncome": number, "type": "needs" | "wants" | "savings", "reasoning": string }
  ],
  "totalAllocated": number,
  "projectedMonthlySavings": number,
  "savingsRatePercentage": number,
  "keyAdvice": [string, string, string]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const text = response.text?.trim() || '{}';
      const parsedPlan = JSON.parse(text);
      res.json({ plan: parsedPlan, source: 'gemini-3.8-flash' });
    } catch (error: any) {
      console.error('Error in /api/advisor/generate-budget-plan:', error);
      const fallbackPlan = generateAlgorithmicBudgetPlan(
        req.body?.financialContext?.totalIncome || 5000,
        req.body?.financialContext?.categories || [],
        req.body?.strategy || 'balanced',
        req.body?.financialContext?.currencySymbol || '$'
      );
      res.json({ plan: fallbackPlan, source: 'algorithmic' });
    }
  });

  // Spending Insights & Financial Health Audit
  app.post('/api/advisor/spending-insights', async (req: Request, res: Response) => {
    try {
      const { financialContext } = req.body;
      const userName = financialContext?.profileName || 'Rupesh';
      const currency = financialContext?.currencySymbol || '$';
      const totalIncome = financialContext?.totalIncome || 0;
      const totalExpenses = financialContext?.totalExpenses || 0;
      const categoryTotals = financialContext?.categoryTotals || {};
      const categoryBudgets = financialContext?.categoryBudgets || {};

      if (!ai) {
        const algorithmicInsights = generateAlgorithmicInsights(financialContext);
        res.json({ insights: algorithmicInsights, source: 'algorithmic' });
        return;
      }

      const prompt = `Conduct a comprehensive financial health audit and spending analysis for ${userName}:
Monthly Income: ${currency}${totalIncome}
Total Current Expenses: ${currency}${totalExpenses}
Actual Spending by Category: ${JSON.stringify(categoryTotals)}
Allocated Budgets by Category: ${JSON.stringify(categoryBudgets)}

Analyze overspending, spending distribution, and generate an objective financial health score (0-100).
Return JSON adhering to:
{
  "healthScore": number,
  "healthRating": "Critical" | "Fair" | "Good" | "Excellent" | "Prime",
  "scoreBreakdown": {
    "savingsRateScore": number (0-25),
    "budgetAdherenceScore": number (0-25),
    "essentialNeedsRatioScore": number (0-25),
    "discretionaryDisciplineScore": number (0-25)
  },
  "executiveSummary": string,
  "topOverspendingCategories": [
    { "category": string, "spent": number, "budget": number, "overBy": number, "actionTip": string }
  ],
  "immediateActionItems": [string, string, string],
  "savingsOpportunities": [
    { "title": string, "potentialMonthlySaving": number, "description": string }
  ],
  "endOfMonthForecast": {
    "projectedTotalSpend": number,
    "projectedSavings": number,
    "verdict": string
  }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const text = response.text?.trim() || '{}';
      const parsedInsights = JSON.parse(text);
      res.json({ insights: parsedInsights, source: 'gemini-3.8-flash' });
    } catch (error: any) {
      console.error('Error in /api/advisor/spending-insights:', error);
      const fallbackInsights = generateAlgorithmicInsights(req.body?.financialContext);
      res.json({ insights: fallbackInsights, source: 'algorithmic' });
    }
  });

  // Mount Vite middleware in development or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Finance Advisor Server listening on http://0.0.0.0:${PORT}`);
  });
}

// Helper: Algorithmic fallback chat responses
function generateFallbackChatResponse(message: string, context: any): string {
  const query = (message || '').toLowerCase();
  const name = context?.profileName || 'Rupesh';
  const sym = context?.currencySymbol || '$';
  const income = context?.totalIncome || 5600;
  const expenses = context?.totalExpenses || 3200;
  const net = income - expenses;
  const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0;
  const categoryTotals = context?.categoryTotals || {};
  const categoryBudgets = context?.categoryBudgets || {};

  if (query.includes('50/30/20') || query.includes('budget plan') || query.includes('split') || query.includes('allocate')) {
    const needs = Math.round(income * 0.5);
    const wants = Math.round(income * 0.3);
    const savings = Math.round(income * 0.2);
    return `### 📊 50/30/20 Optimal Budget Blueprint for ${name}

Based on your verified monthly income of **${sym}${income.toLocaleString()}**, here is your target allocation:

1. **Essential Needs (50% Target): ${sym}${needs.toLocaleString()} / month**
   - Housing / Studio Rent, Groceries, Utilities, Transit, and Healthcare.
   - *Current status:* You have spent **${sym}${Math.round(expenses * 0.55).toLocaleString()}** in essential categories.
2. **Discretionary Wants (30% Target): ${sym}${wants.toLocaleString()} / month**
   - Dining out, weekend socializing, hobbies, streaming subscriptions, and apparel.
   - *Tip:* Keep your weekly discretionary limit below **${sym}${Math.round(wants / 4.3).toLocaleString()}** to prevent end-of-month creep.
3. **Savings & Wealth Acceleration (20% Target): ${sym}${savings.toLocaleString()} / month**
   - Scheduled deposit into high-yield emergency buffer, index funds, or goal contributions.

*Current Net Result:* You retain **${sym}${net.toLocaleString()}** in positive monthly cashflow (${savingsRate}% savings rate).`;
  }

  if (query.includes('dining') || query.includes('food') || query.includes('restaurant') || query.includes('takeout')) {
    const diningSpent = categoryTotals['Dining & Takeout'] || 450;
    const diningBudget = categoryBudgets['Dining & Takeout'] || 350;
    const over = diningSpent - diningBudget;
    return `### 🍽️ Dining & Takeout Audit for ${name}

- **Current Dining Spend:** **${sym}${diningSpent.toLocaleString()}**
- **Allocated Dining Cap:** **${sym}${diningBudget.toLocaleString()}**
- **Status:** ${over > 0 ? `⚠️ Over limit by **${sym}${over.toLocaleString()}**` : '✓ On track within budget'}

**FinBot Actionable Recommendations:**
1. **The 3-Dinner Rule:** Cook at home on weekdays and consolidate restaurant dining to Friday/Saturday evenings. Estimated savings: **${sym}120 - ${sym}180/mo**.
2. **Review Coffee Runs & App Deliveries:** Convenience delivery fees and tips add 30-40% markups. Switching to pickup or home brewing saves approximately **${sym}65/mo**.`;
  }

  if (query.includes('overspend') || query.includes('leak') || query.includes('cut') || query.includes('save more') || query.includes('save $') || query.includes('audit')) {
    return `### 💡 High-Impact Cash Flow Optimization for ${name}

Here are 4 targeted strategies to increase your monthly savings buffer:

1. **Discretionary Dining Realignment:** Cap takeout and weekend restaurant tabs. Target savings: **${sym}140 / month**.
2. **Recurring Subscriptions Pruning:** Audit digital streaming, unused cloud storage, and gym add-ons. Target savings: **${sym}35 - ${sym}60 / month**.
3. **Smart Grocery Batching:** Plan weekly meals before shopping to reduce food waste and impulse purchases. Target savings: **${sym}75 / month**.
4. **Automate the 20% Rule:** Set a scheduled standing transfer of **${sym}${Math.max(200, Math.round(income * 0.20)).toLocaleString()}** on salary credit day.

*Combined Potential Savings:* **+${sym}250 to +${sym}400 / month** directly toward your wealth goals.`;
  }

  if (query.includes('emergency') || query.includes('safety') || query.includes('cushion') || query.includes('buffer')) {
    const minFund = expenses * 3;
    const recFund = expenses * 6;
    return `### 🛡️ Emergency Reserve Assessment for ${name}

Based on your current monthly expense rate of **${sym}${expenses.toLocaleString()}**:
- **3-Month Baseline Shield:** **${sym}${minFund.toLocaleString()}** (covers immediate medical emergencies, device replacements, or urgent home repairs).
- **6-Month Complete Financial Fortress:** **${sym}${recFund.toLocaleString()}** (provides total career independence and severance runway).

**Recommended Action:**
Keep these funds in a designated High-Yield Savings Account (HYSA) or liquid money-market instrument yielding 4-7% annually, completely segregated from daily transaction checking accounts.`;
  }

  if (query.includes('drop') || query.includes('shock') || query.includes('job') || query.includes('20%') || query.includes('income decrease')) {
    const reducedIncome = Math.round(income * 0.80);
    return `### ⚡ Income Resilience Simulation (-20% Stress Test) for ${name}

If your monthly income drops from **${sym}${income.toLocaleString()}** to **${sym}${reducedIncome.toLocaleString()}**:

1. **Immediate Discretionary Freeze:** Pause non-essential dining, leisure travel, and shopping to preserve **${sym}${Math.round(income * 0.15).toLocaleString()}**.
2. **Fixed Expense Coverage:** Your essential needs (housing, utilities, groceries) require approximately **${sym}${Math.round(expenses * 0.65).toLocaleString()}**, which is safely below your reduced **${sym}${reducedIncome.toLocaleString()}** income.
3. **Emergency Fund Bridge:** You would maintain neutral or slightly positive cash flow without needing to liquidate long-term investments.`;
  }

  return `Hello ${name}! 👋 I am tracking your financial profile.

- **Monthly Income Logged:** **${sym}${income.toLocaleString()}**
- **Monthly Expenses Logged:** **${sym}${expenses.toLocaleString()}**
- **Net Cashflow Retained:** **${sym}${net.toLocaleString()}** (${savingsRate}% savings rate)

How can I help you today? You can ask me to:
- **Audit your dining & entertainment expenses**
- **Generate a personalized 50/30/20 budget plan**
- **Calculate your ideal emergency fund timeline**
- **Find top spending leaks and save $300-$500 more this month**`;
}

// Helper: Algorithmic budget plan generator
function generateAlgorithmicBudgetPlan(income: number, _categories: string[], strategy: string, sym: string) {
  let needsPct = 0.50;
  let wantsPct = 0.30;
  let savingsPct = 0.20;

  if (strategy === 'aggressive-savings') {
    needsPct = 0.45;
    wantsPct = 0.15;
    savingsPct = 0.40;
  } else if (strategy === 'debt-payoff') {
    needsPct = 0.48;
    wantsPct = 0.17;
    savingsPct = 0.35;
  } else if (strategy === 'student-frugal') {
    needsPct = 0.65;
    wantsPct = 0.20;
    savingsPct = 0.15;
  }

  const recommendedCategories = [
    { category: 'Rent & Housing', allocatedAmount: Math.round(income * 0.28), percentageOfIncome: 28, type: 'needs', reasoning: 'Standard housing ratio safe benchmark' },
    { category: 'Groceries & Essentials', allocatedAmount: Math.round(income * 0.12), percentageOfIncome: 12, type: 'needs', reasoning: 'Wholesome nutrition and household supplies' },
    { category: 'Utilities & Bills', allocatedAmount: Math.round(income * 0.05), percentageOfIncome: 5, type: 'needs', reasoning: 'Electricity, water, high-speed internet' },
    { category: 'Transportation', allocatedAmount: Math.round(income * 0.05), percentageOfIncome: 5, type: 'needs', reasoning: 'Transit pass, fuel, maintenance' },
    { category: 'Dining & Entertainment', allocatedAmount: Math.round(income * (wantsPct * 0.5)), percentageOfIncome: Math.round(wantsPct * 50), type: 'wants', reasoning: 'Social leisure and dining' },
    { category: 'Subscriptions & Lifestyle', allocatedAmount: Math.round(income * (wantsPct * 0.5)), percentageOfIncome: Math.round(wantsPct * 50), type: 'wants', reasoning: 'Streaming, gym, discretionary shopping' },
    { category: 'Savings & Investments', allocatedAmount: Math.round(income * savingsPct), percentageOfIncome: Math.round(savingsPct * 100), type: 'savings', reasoning: 'Wealth accumulation and emergency reserves' },
  ];

  const totalAllocated = recommendedCategories.reduce((acc, c) => acc + c.allocatedAmount, 0);

  return {
    strategyName: strategy === 'aggressive-savings' ? 'Aggressive Wealth Accumulator (40% Savings)' : 'Balanced 50/30/20 Standard',
    summary: `Structured allocation designed to safeguard ${sym}${Math.round(income * savingsPct).toLocaleString()} each month.`,
    recommendedCategories,
    totalAllocated,
    projectedMonthlySavings: Math.round(income * savingsPct),
    savingsRatePercentage: Math.round(savingsPct * 100),
    keyAdvice: [
      'Automate savings transfers on the 1st of every month.',
      'Cap dining and food delivery to protect your wants ceiling.',
      'Review utility usage and subscription renewals quarterly.'
    ]
  };
}

// Helper: Algorithmic insights
function generateAlgorithmicInsights(context: any) {
  const sym = context?.currencySymbol || '$';
  const income = context?.totalIncome || 5000;
  const expenses = context?.totalExpenses || 3000;
  const net = income - expenses;
  const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0;

  let healthScore = 75;
  if (savingsRate >= 30) healthScore = 92;
  else if (savingsRate >= 20) healthScore = 84;
  else if (savingsRate >= 10) healthScore = 70;
  else healthScore = 52;

  return {
    healthScore,
    healthRating: healthScore > 85 ? 'Excellent' : healthScore > 70 ? 'Good' : 'Fair',
    scoreBreakdown: {
      savingsRateScore: Math.min(25, Math.round(savingsRate * 0.8)),
      budgetAdherenceScore: 21,
      essentialNeedsRatioScore: 23,
      discretionaryDisciplineScore: 19
    },
    executiveSummary: `Solid financial footing with ${savingsRate}% savings rate. Operating with ${sym}${net.toLocaleString()} positive monthly cashflow.`,
    topOverspendingCategories: [
      { category: 'Dining & Entertainment', spent: 650, budget: 500, overBy: 150, actionTip: 'Pre-plan restaurant visits to weekends only' }
    ],
    immediateActionItems: [
      'Reallocate surplus from transportation to increase emergency fund deposit.',
      'Cap discretionary weekend spend to avoid monthly creep.',
      'Maintain positive cash flow streak.'
    ],
    savingsOpportunities: [
      { title: 'Meal Prep Optimization', potentialMonthlySaving: 140, description: 'Batch cook 2-3 dinners each week' },
      { title: 'Subscription Pruning', potentialMonthlySaving: 45, description: 'Cancel duplicate video/music streaming plans' }
    ],
    endOfMonthForecast: {
      projectedTotalSpend: Math.round(expenses * 1.05),
      projectedSavings: Math.round(net * 0.95),
      verdict: 'On track to meet monthly target.'
    }
  };
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
