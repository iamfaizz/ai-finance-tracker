import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

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
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, something went wrong.' }]);
    }
    setAiLoading(false);
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const pieData = categories.map(c => ({
    name: c.name,
    value: transactions.filter(t => t.category_id === c.id && t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
  })).filter(d => d.value > 0);

  const barData = [...new Set(transactions.map(t => t.date?.split('T')[0]))].slice(0, 7).map(date => ({
    date: date?.slice(5),
    amount: transactions.filter(t => t.date?.split('T')[0] === date && t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-slate-800 px-8 py-4 flex justify-between items-center bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-sm font-bold">S</div>
          <span className="text-lg font-semibold tracking-tight">Spendr</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">{user?.name}</span>
          <button onClick={logout} className="text-sm text-slate-400 hover:text-white transition-colors">Sign out</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Total Income</p>
            <p className="text-3xl font-bold text-emerald-400">₹{totalIncome.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Total Expenses</p>
            <p className="text-3xl font-bold text-rose-400">₹{totalExpense.toLocaleString('en-IN')}</p>
          </div>
          <div className={`rounded-2xl p-6 border ${balance >= 0 ? 'bg-indigo-950 border-indigo-800' : 'bg-rose-950 border-rose-800'}`}>
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Balance</p>
            <p className={`text-3xl font-bold ${balance >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}>₹{balance.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Charts */}
        {pieData.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-4">Spending by Category</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name}) => name}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-4">Daily Expenses</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData}>
                  <XAxis dataKey="date" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                  <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Budget Tracker */}
        {budgets.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-4">Budget Tracker</p>
            <div className="space-y-4">
              {budgets.map(b => {
                const pct = Math.min((parseFloat(b.spent) / parseFloat(b.monthly_limit)) * 100, 100);
                return (
                  <div key={b.id}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-300">{b.category_name}</span>
                      <span className="text-slate-400">₹{parseFloat(b.spent).toLocaleString('en-IN')} <span className="text-slate-600">/</span> ₹{parseFloat(b.monthly_limit).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all ${pct > 80 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Transactions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <p className="text-slate-400 text-xs uppercase tracking-widest">Transactions</p>
            <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              + Add
            </button>
          </div>

          {showForm && (
            <div className="border border-slate-700 rounded-xl p-4 mb-6 bg-slate-800 grid grid-cols-2 gap-3">
              <select className="border border-slate-600 bg-slate-700 text-white p-2.5 rounded-lg text-sm" value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input className="border border-slate-600 bg-slate-700 text-white p-2.5 rounded-lg text-sm" type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
              <select className="border border-slate-600 bg-slate-700 text-white p-2.5 rounded-lg text-sm" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input className="border border-slate-600 bg-slate-700 text-white p-2.5 rounded-lg text-sm" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              <input className="border border-slate-600 bg-slate-700 text-white p-2.5 rounded-lg text-sm col-span-2" type="text" placeholder="Note (optional)" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
              <button onClick={addTransaction} className="col-span-2 bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-lg text-sm font-medium transition-colors">Save Transaction</button>
            </div>
          )}

          <div className="space-y-2">
            {transactions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500 text-sm">No transactions yet. Add one to get started.</p>
              </div>
            )}
            {transactions.map(t => (
              <div key={t.id} className="flex justify-between items-center p-4 rounded-xl hover:bg-slate-800 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${t.type === 'income' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{t.note || t.category_name}</p>
                    <p className="text-xs text-slate-500">{t.category_name} · {t.date?.split('T')[0]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.type === 'income' ? '+' : '-'}₹{parseFloat(t.amount).toLocaleString('en-IN')}
                  </span>
                  <button onClick={() => deleteTransaction(t.id)} className="text-slate-700 hover:text-rose-400 text-xs opacity-0 group-hover:opacity-100 transition-all">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Chat */}
      <div className="fixed bottom-6 right-6 z-50">
        {showChat && (
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-80 h-96 flex flex-col mb-4">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold">AI Assistant</p>
                <p className="text-xs text-slate-400">Powered by Groq</p>
              </div>
              <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-white text-sm transition-colors">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-slate-500 text-xs text-center mt-8">Ask about your spending habits, budgets, or get financial insights.</p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs p-3 rounded-xl text-xs leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 p-3 rounded-xl text-xs text-slate-400">Thinking...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-slate-700 flex gap-2">
              <input
                className="flex-1 bg-slate-800 border border-slate-600 text-white rounded-lg p-2 text-xs placeholder-slate-500"
                placeholder="Ask anything..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-xs transition-colors">Send</button>
            </div>
          </div>
        )}
        <button
          onClick={() => setShowChat(!showChat)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-lg transition-colors ml-auto"
        >
          ✦
        </button>
      </div>
    </div>
  );
}