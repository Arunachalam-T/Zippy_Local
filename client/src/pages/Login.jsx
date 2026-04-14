import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const S = {
  page:  { minHeight: '100vh', background: '#f5f8fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' },
  card:  { background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px #0001', width: 400, overflow: 'hidden' },
  head:  { background: '#1e64b4', padding: '28px 32px 18px' },
  title: { fontSize: 26, fontWeight: 800, color: '#fff' },
  sub:   { color: '#c7dcf7', fontSize: 13, marginTop: 4 },
  tabs:  { display: 'flex' },
  body:  { padding: '24px 32px 28px' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#1f2937', marginBottom: 4 },
  input: { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  btn:   { background: '#1e64b4', color: '#fff', border: 'none', padding: '9px 22px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', width: '100%' },
  err:   { color: '#dc2626', fontSize: 13, marginTop: 8 },
  link:  { color: '#1e64b4', fontSize: 13, marginTop: 12, display: 'block', textAlign: 'center' }
};

export default function Login() {
  const [role,     setRole]     = useState('user');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const navigate = useNavigate();

  const roleBtn = r => ({
    flex: 1, padding: '7px 0', borderRadius: 8, fontWeight: 700,
    fontSize: 13, cursor: 'pointer', textTransform: 'capitalize',
    background: role === r ? '#f59e0b' : '#f5f8fc',
    color: role === r ? '#fff' : '#6b7280',
    border: `1.5px solid ${role === r ? '#f59e0b' : '#e5e7eb'}`
  });

 const handleLogin = async () => {
  setError('');
  try {
    const res = await axios.post(`${API}/auth/login/${role}`, { email, password });
    console.log('Login response:', res.data);
    
    localStorage.setItem('token', res.data.token);
    const userData = res.data.user || res.data.vendor || res.data.admin;
    console.log('User data to save:', userData);
    localStorage.setItem('user', JSON.stringify(userData));

    if (role === 'admin')       navigate('/admin');
    else if (role === 'vendor') navigate('/vendor/dashboard');
    else                        navigate('/vendors');
  } catch (err) {
    setError(err.response?.data?.message || 'Login failed');
  }
};
  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.head}>
          <div style={S.title}>⚡ ZippyLocal</div>
          <div style={S.sub}>Your local service partner in Coimbatore</div>
        </div>
        <div style={S.body}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {['user','vendor','admin'].map(r => (
              <button key={r} style={roleBtn(r)} onClick={() => setRole(r)}>
                {r === 'user' ? '👤 User' : r === 'vendor' ? '🔧 Vendor' : '🛡 Admin'}
              </button>
            ))}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Email</label>
            <input style={S.input} type="email" value={email}
              placeholder="you@example.com"
              onChange={e => setEmail(e.target.value)} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>Password</label>
            <input style={S.input} type="password" value={password}
              placeholder="••••••••"
              onChange={e => setPassword(e.target.value)} />
          </div>
          <button style={S.btn} onClick={handleLogin}>Login →</button>
          {error && <div style={S.err}>{error}</div>}
          <Link to="/register" style={S.link}>Don't have an account? Register</Link>
        </div>
      </div>
    </div>
  );
}