import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Register({ onSwitch }) {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/register', { name, email, password });
      login(res.data.token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="w-full border p-3 rounded-lg" type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
          <input className="w-full border p-3 rounded-lg" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="w-full border p-3 rounded-lg" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700" type="submit">Register</button>
        </form>
        <p className="text-center mt-4 text-sm">Already have an account? <span className="text-blue-600 cursor-pointer" onClick={onSwitch}>Login</span></p>
      </div>
    </div>
  );
}
