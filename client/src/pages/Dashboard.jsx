import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

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

  const pieData = categories.map(c => ({
    name: c.name,
    value: transactions.filter(t => t.category_id === c.id && t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
  })).filter(d => d.value > 0);

  const barData = [...new Set(transactions.map(t => t.date?.split('T')[0]))].slice(0, 7).map(date => ({
    date: date?.slice(5),
    amount: transactions.filter(t => t.date?.split('T')[0] === date && t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-600">💰 Finance Tracker</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Hi, {user?.name}</span>
          <button onClick={logout} className="text-sm text-red-500 hover:underline">Logout</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 shadow">
            <p className="text-gray-500 text-sm">Total Income</p>
            <p className="text-2xl font-bold text-green-600">₹{totalIncome.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow">
            <p className="text-gray-500 text-sm">Total Expenses</p>
            <p className="text-2xl font-bold text-red-500">₹{totalExpense.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow">
            <p className="text-gray-500 text-sm">Balance</p>
            <p className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>₹{(totalIncome - totalExpense).toFixed(2)}</p>
          </div>
        </div>

        {pieData.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5 shadow">
              <h3 className="font-semibold mb-4">Spending by Category</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name}) => name}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl p-5 shadow">
              <h3 className="font-semibold mb-4">Daily Expenses</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#6366f1" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {budgets.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow">
            <h3 className="font-semibold mb-4">Budget Tracker</h3>
            <div className="space-y-3">
              {budgets.map(b => {
                const pct = Math.min((parseFloat(b.spent) / parseFloat(b.monthly_limit)) * 100, 100);
                return (
                  <div key={b.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{b.category_name}</span>
                      <span>₹{parseFloat(b.spent).toFixed(0)} / ₹{parseFloat(b.monthly_limit).toFixed(0)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${pct > 80 ? 'bg-red-500' : 'bg-indigo-500'}`} style={{width: `${pct}%`}}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl p-5 shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Transactions</h3>
            <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">+ Add Transaction</button>
          </div>

          {showForm && (
            <div className="border rounded-lg p-4 mb-4 bg-gray-50 grid grid-cols-2 gap-3">
              <select className="border p-2 rounded-lg" value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input className="border p-2 rounded-lg" type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
              <select className="border p-2 rounded-lg" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input className="border p-2 rounded-lg" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              <input className="border p-2 rounded-lg col-span-2" type="text" placeholder="Note (optional)" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
              <button onClick={addTransaction} className="col-span-2 bg-green-600 text-white p-2 rounded-lg hover:bg-green-700">Save Transaction</button>
            </div>
          )}

          <div className="space-y-2">
            {transactions.length === 0 && <p className="text-gray-400 text-center py-4">No transactions yet</p>}
            {transactions.map(t => (
              <div key={t.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-medium">{t.note || t.category_name}</p>
                  <p className="text-xs text-gray-400">{t.category_name} · {t.date?.split('T')[0]}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {t.type === 'income' ? '+' : '-'}₹{parseFloat(t.amount).toFixed(2)}
                  </span>
                  <button onClick={() => deleteTransaction(t.id)} className="text-gray-300 hover:text-red-500 text-xs">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Chat Bubble */}
      <div className="fixed bottom-6 right-6 z-50">
        {showChat && (
          <div className="bg-white rounded-xl shadow-2xl w-80 h-96 flex flex-col mb-4">
            <div className="bg-indigo-600 text-white p-4 rounded-t-xl flex justify-between items-center">
              <h3 className="font-semibold">💬 AI Finance Assistant</h3>
              <button onClick={() => setShowChat(false)} className="text-white hover:text-gray-200">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-gray-400 text-sm text-center mt-8">Ask me anything about your spending!</p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs p-3 rounded-xl text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-xl text-sm text-gray-500">Thinking...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t flex gap-2">
              <input
                className="flex-1 border rounded-lg p-2 text-sm"
                placeholder="Ask about your spending..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700">Send</button>
            </div>
          </div>
        )}
        <button
          onClick={() => setShowChat(!showChat)}
          className="bg-indigo-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-indigo-700 ml-auto"
        >
          💬
        </button>
      </div>
    </div>
  );
}