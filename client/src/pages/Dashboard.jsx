import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Area, AreaChart, XAxis, YAxis } from 'recharts';

const COLORS = ['#f59e0b', '#fb923c', '#f97316', '#fbbf24', '#fcd34d', '#fde68a'];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category_id: '', amount: '', type: 'expense', note: '', date: new Date().toISOString().split('T')[0] });
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchAll = async () => {
    const [t, c, b] = await Promise.all([
      api.get('/transactions'),
      api.get('/categories'),
      api.get('/budgets'),
    ]);
    setTransactions(t.data);
    setCategories(c.data);
    setBudgets(b.data);
  };

  const addTransaction = async () => {
    await api.post('/transactions', form);
    setShowForm(false);
    setForm({ category_id: '', amount: '', type: 'expense', note: '', date: new Date().toISOString().split('T')[0] });
    fetchAll();
  };

  const deleteTransaction = async (id) => {
    await api.delete(`/transactions/${id}`);
    fetchAll();
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', content: chatInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setAiLoading(true);
    try {
      const res = await api.post('/chat', { message: chatInput });
      setMessages(prev => [...prev, { role: 'ai', content: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Something went wrong.' }]);
    }
    setAiLoading(false);
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;

  const pieData = categories.map(c => ({
    name: c.name,
    value: transactions.filter(t => t.category_id === c.id && t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
  })).filter(d => d.value > 0);

  const barData = [...new Set(transactions.map(t => t.date?.split('T')[0]))].slice(0, 7).reverse().map(date => ({
    date: date?.slice(5),
    amount: transactions.filter(t => t.date?.split('T')[0] === date && t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
  }));

  return (
    <div className="min-h-screen bg-[#0c0a05] text-white font-sans">
      <nav className="border-b border-white/5 px-8 py-4 flex justify-between items-center sticky top-0 z-40 bg-[#0c0a05]/90 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-bold shadow-lg shadow-amber-500/25 text-black">S</div>
          <span className="text-base font-semibold tracking-tight">Spendr</span>
          <span className="text-xs text-white/20 ml-1">/ Overview</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-xs text-white/40">{new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xs font-semibold text-amber-300">{user?.name?.[0]}</div>
            <span className="text-sm text-white/60">{user?.name}</span>
          </div>
          <button onClick={logout} className="text-xs text-white/30 hover:text-white/70 transition-colors">Sign out</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-8 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-1 bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent"></div>
            <p className="text-xs text-amber-300/70 uppercase tracking-widest mb-3">Balance</p>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-white' : 'text-rose-400'}`}>₹{balance.toLocaleString('en-IN')}</p>
            <p className="text-xs text-white/30 mt-2">{savingsRate}% savings rate</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.05] transition-colors">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Income</p>
            <p className="text-2xl font-bold text-emerald-400">₹{totalIncome.toLocaleString('en-IN')}</p>
            <p className="text-xs text-white/20 mt-2">{transactions.filter(t => t.type === 'income').length} transactions</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.05] transition-colors">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Expenses</p>
            <p className="text-2xl font-bold text-rose-400">₹{totalExpense.toLocaleString('en-IN')}</p>
            <p className="text-xs text-white/20 mt-2">{transactions.filter(t => t.type === 'expense').length} transactions</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.05] transition-colors">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Categories</p>
            <p className="text-2xl font-bold text-white">{categories.length}</p>
            <p className="text-xs text-white/20 mt-2">active categories</p>
          </div>
        </div>

        {/* Charts */}
        {pieData.length > 0 && (
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-2 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-1">By Category</p>
              <p className="text-white/20 text-xs mb-4">Expense breakdown</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} contentStyle={{ background: '#100d05', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }}></div>
                    <span className="text-xs text-white/40">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Daily Spend</p>
              <p className="text-white/20 text-xs mb-4">Last 7 days</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={barData}>
                  <defs>
                    <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="transparent" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 11 }} />
                  <YAxis stroke="transparent" tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 11 }} />
                  <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} contentStyle={{ background: '#100d05', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="amount" stroke="#f59e0b" strokeWidth={2} fill="url(#amberGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Budgets */}
        {budgets.length > 0 && (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-5">Budgets</p>
            <div className="grid grid-cols-2 gap-4">
              {budgets.map(b => {
                const pct = Math.min((parseFloat(b.spent) / parseFloat(b.monthly_limit)) * 100, 100);
                return (
                  <div key={b.id} className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-white/70">{b.category_name}</span>
                      <span className={`text-xs font-medium ${pct > 80 ? 'text-rose-400' : 'text-amber-400'}`}>{Math.round(pct)}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1">
                      <div className={`h-1 rounded-full transition-all ${pct > 80 ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }}></div>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-white/20">₹{parseFloat(b.spent).toLocaleString('en-IN')} spent</span>
                      <span className="text-xs text-white/20">of ₹{parseFloat(b.monthly_limit).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Transactions */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex justify-between items-center mb-5">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Transactions</p>
              <p className="text-white/20 text-xs">{transactions.length} total</p>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:shadow-lg hover:shadow-amber-500/20">
              + Add Transaction
            </button>
          </div>

          {showForm && (
            <div className="border border-white/10 rounded-xl p-4 mb-5 bg-white/[0.02] grid grid-cols-2 gap-3">
              <select className="border border-white/10 bg-white/5 text-white p-2.5 rounded-xl text-xs" value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input className="border border-white/10 bg-white/5 text-white p-2.5 rounded-xl text-xs placeholder-white/20" type="number" placeholder="Amount (₹)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
              <select className="border border-white/10 bg-white/5 text-white p-2.5 rounded-xl text-xs" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input className="border border-white/10 bg-white/5 text-white p-2.5 rounded-xl text-xs" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              <input className="border border-white/10 bg-white/5 text-white p-2.5 rounded-xl text-xs placeholder-white/20 col-span-2" type="text" placeholder="Note (optional)" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
              <button onClick={addTransaction} className="col-span-2 bg-amber-500 hover:bg-amber-400 text-black p-2.5 rounded-xl text-xs font-semibold transition-colors">Save Transaction</button>
            </div>
          )}

          <div className="space-y-1">
            {transactions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-white/20 text-sm">No transactions yet</p>
                <p className="text-white/10 text-xs mt-1">Add your first transaction to get started</p>
              </div>
            )}
            {transactions.map(t => (
              <div key={t.id} className="flex justify-between items-center px-4 py-3 rounded-xl hover:bg-white/[0.03] transition-colors group cursor-default">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {t.type === 'income' ? '↑' : '↓'}
                  </div>
                  <div>
                    <p className="text-sm text-white/80">{t.note || t.category_name}</p>
                    <p className="text-xs text-white/25">{t.category_name} · {t.date?.split('T')[0]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold tabular-nums ${t.type === 'income' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {t.type === 'income' ? '+' : '-'}₹{parseFloat(t.amount).toLocaleString('en-IN')}
                  </span>
                  <button onClick={() => deleteTransaction(t.id)} className="text-white/10 hover:text-rose-400 text-xs opacity-0 group-hover:opacity-100 transition-all">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Chat */}
      <div className="fixed bottom-6 right-6 z-50">
        {showChat && (
          <div className="bg-[#100d05] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 w-80 h-96 flex flex-col mb-4 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                <p className="text-xs font-medium">AI Assistant</p>
              </div>
              <button onClick={() => setShowChat(false)} className="text-white/20 hover:text-white/60 text-xs transition-colors">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center mt-6 space-y-2">
                  <p className="text-white/20 text-xs">Ask me about your finances</p>
                  <div className="space-y-1">
                    {["How much did I spend this month?", "What's my biggest expense?", "Am I over budget?"].map(q => (
                      <button key={q} onClick={() => setChatInput(q)} className="block w-full text-left text-xs text-white/30 hover:text-white/60 hover:bg-white/5 px-3 py-2 rounded-lg transition-colors">{q}</button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs p-3 rounded-xl text-xs leading-relaxed ${m.role === 'user' ? 'bg-amber-500 text-black font-medium' : 'bg-white/5 text-white/70'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 p-3 rounded-xl text-xs text-white/30">Thinking...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-white/5 flex gap-2">
              <input
                className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl p-2.5 text-xs placeholder-white/20 focus:outline-none focus:border-amber-500/50"
                placeholder="Ask anything..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage} className="bg-amber-500 hover:bg-amber-400 text-black px-3 rounded-xl text-xs font-semibold transition-colors">→</button>
            </div>
          </div>
        )}
        <button
          onClick={() => setShowChat(!showChat)}
          className="bg-amber-500 hover:bg-amber-400 text-black w-11 h-11 rounded-2xl shadow-lg shadow-amber-500/25 flex items-center justify-center text-sm font-bold transition-all hover:scale-105 ml-auto"
        >
          ✦
        </button>
      </div>
    </div>
  );
}