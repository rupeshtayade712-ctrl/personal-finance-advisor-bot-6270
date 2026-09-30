import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  RotateCcw, 
  User, 
  TrendingUp, 
  ShieldAlert, 
  Lightbulb,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { ScenarioProfile, Transaction } from '../types/finance';
import { sendChatMessage } from '../services/api';

interface AdvisorBotProps {
  profile: ScenarioProfile;
  transactions: Transaction[];
  categoryBudgets: Record<string, number>;
  currencySymbol: string;
  initialPrompt?: string;
  onNavigateToTab: (tab: 'overview' | 'advisor' | 'transactions' | 'budget' | 'goals') => void;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  source?: string;
}

export const AdvisorBot: React.FC<AdvisorBotProps> = ({
  profile,
  transactions,
  categoryBudgets,
  currencySymbol,
  initialPrompt,
  onNavigateToTab,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      sender: 'bot',
      text: `Hello ${profile.name}! 👋 I am your **Personal Finance Advisor Bot**.\n\nI have full visibility into your monthly income of **${currencySymbol}${(
        transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0)
      ).toLocaleString()}**, your logged expenses, and category budgets.\n\nHow can I help you today? You can choose a quick prompt below or type any financial question!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'advisor',
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle initialPrompt if provided from other tabs
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim().length > 0) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  // Context gathering
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  
  const categoryTotals: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

  const quickPrompts = [
    { label: '💡 Audit my spending & find leaks', prompt: 'Please audit my current month expenses by category, identify overspending leaks, and recommend 3 immediate ways to save money.' },
    { label: '📊 Generate 50/30/20 budget plan', prompt: 'Based on my current income, generate an exact 50/30/20 budget plan with recommended dollar allocations for each of my categories.' },
    { label: '🛡️ Emergency fund calculation', prompt: 'Based on my monthly expenses, how much should I have in my 3-month and 6-month emergency funds, and what is the best strategy to build it?' },
    { label: '🎯 How can I save $400 more this month?', prompt: 'I want to increase my monthly savings by $400. Review my specific category expenses and suggest which discretionary areas I can trim with minimal pain.' },
    { label: '🍽️ Audit Dining & Takeout expenses', prompt: 'Analyze my Dining and Food expenses this month. Am I spending too much relative to healthy financial benchmarks?' },
    { label: '📉 What if my income drops by 20%?', prompt: 'Simulate a scenario where my monthly income decreases by 20%. Which expenses should I immediately cut to maintain positive cash flow?' },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputValue;
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build history
      const history = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        text: m.text,
      }));

      const financialContext = {
        profileName: profile.name,
        currencySymbol,
        scenarioType: profile.scenarioTag,
        totalIncome,
        totalExpenses,
        categoryTotals,
        categoryBudgets,
        savingsGoals: profile.goals.map((g) => ({
          title: g.title,
          target: g.targetAmount,
          current: g.currentAmount,
        })),
      };

      const result = await sendChatMessage({
        message: query.trim(),
        history,
        financialContext,
      });

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: result.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: result.source,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: `I encountered an unexpected glitch connecting to the financial intelligence engine. However, your cash flow is ${currencySymbol}${totalIncome - totalExpenses >= 0 ? 'positive' : 'negative'} (${currencySymbol}${Math.abs(totalIncome - totalExpenses).toLocaleString()}). Try asking another question!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeech = (id: string, text: string) => {
    if ('speechSynthesis' in window) {
      if (speakingId === id) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
      }

      window.speechSynthesis.cancel();
      // Clean markdown tags for audio reading
      const cleanText = text.replace(/[*#_`]/g, '').replace(/\[.*?\]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      
      setSpeakingId(id);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleClearChat = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: `Chat restarted. Ready to provide actionable financial advice for **${profile.name}**!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Helper to render markdown text with styling
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split('\n');
    return (
      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-sm sm:text-base text-emerald-400 mt-2 mb-1">
                {trimmed.replace('### ', '')}
              </h4>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={idx} className="font-extrabold text-base text-white mt-2 mb-1">
                {trimmed.replace('## ', '')}
              </h3>
            );
          }
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-2 ml-1 text-slate-200">
                <span className="text-emerald-400 font-bold">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed.substring(2)) }} />
              </div>
            );
          }
          if (/^\d+\.\s/.test(trimmed)) {
            const num = trimmed.match(/^\d+\./)?.[0] || '1.';
            const content = trimmed.replace(/^\d+\.\s/, '');
            return (
              <div key={idx} className="flex items-start gap-2 ml-1 text-slate-200">
                <span className="text-emerald-400 font-bold font-mono">{num}</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(content) }} />
              </div>
            );
          }
          if (!trimmed) {
            return <div key={idx} className="h-1" />;
          }
          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }} />
          );
        })}
      </div>
    );
  };

  const formatInlineMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-300">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-slate-800 font-mono text-emerald-300 text-xs">$1</code>');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[550px] max-w-5xl mx-auto rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden">
      {/* Bot Header with Context */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white">FinBot AI Financial Advisor</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                gemini-3.8-flash
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Active Context: <strong className="text-slate-200">{profile.name}</strong> • Monthly Income:{' '}
              <span className="text-emerald-400 font-mono font-medium">{currencySymbol}{totalIncome.toLocaleString()}</span> • Saved:{' '}
              <span className="text-sky-400 font-mono font-medium">{currencySymbol}{(totalIncome - totalExpenses).toLocaleString()}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition"
            title="Restart conversation"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
            >
              {isBot && (
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-500/30">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-md ${
                  isBot
                    ? 'bg-slate-800/90 text-slate-200 border border-slate-700/80'
                    : 'bg-emerald-600 text-white rounded-br-none'
                }`}
              >
                {/* Message Content */}
                {isBot ? (
                  renderFormattedText(msg.text)
                ) : (
                  <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                )}

                {/* Footer Toolbar for Bot Responses */}
                {isBot && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span>{msg.timestamp}</span>
                      {msg.source && (
                        <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                          {msg.source}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="p-1 hover:text-slate-200 transition"
                        title="Copy advice"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {'speechSynthesis' in window && (
                        <button
                          onClick={() => handleSpeech(msg.id, msg.text)}
                          className={`p-1 hover:text-slate-200 transition ${speakingId === msg.id ? 'text-emerald-400' : ''}`}
                          title="Read out loud"
                        >
                          {speakingId === msg.id ? (
                            <VolumeX className="w-3.5 h-3.5" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {!isBot && (
                <div className="w-8 h-8 rounded-lg bg-slate-700 text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                  {profile.name[0]}
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 text-xs text-slate-400 flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span>FinBot is analyzing your financial data...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 bg-slate-900/95 border-t border-slate-800/90 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 min-w-max">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Quick Prompts:
          </span>
          {quickPrompts.map((item, index) => (
            <button
              key={index}
              onClick={() => handleSendMessage(item.prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700/80 transition whitespace-nowrap disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Ask FinBot for personalized advice on budgeting, saving, or investments...`}
            disabled={isLoading}
            className="flex-1 bg-slate-800/90 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-slate-400 text-center mt-2">
          FinBot provides AI-generated financial insights for informational planning. Always verify with certified financial advisors.
        </p>
      </div>
    </div>
  );
};
