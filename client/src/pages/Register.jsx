import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const S = {
  page:  { minHeight: '100vh', background: '#f5f8fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' },
  card:  { background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px #0001', width: 420, overflow: 'hidden' },
  head:  { background: '#1e64b4', padding: '22px 32px' },
  title: { fontSize: 22, fontWeight: 800, color: '#fff' },
  body:  { padding: '24px 32px 28px' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#1f2937', marginBottom: 4 },
  input: { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 14 },
  btn:   { background: '#1e64b4', color: '#fff', border: 'none', padding: '9px 22px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', width: '100%' },
  err:   { color: '#dc2626', fontSize: 13, marginTop: 8 },
  ok:    { color: '#16a34a', fontSize: 13, marginTop: 8 },
  link:  { color: '#1e64b4', fontSize: 13, marginTop: 12, display: 'block', textAlign: 'center' }
};

export default function Register() {
  const [role,       setRole]       = useState('user');
  const [form,       setForm]       = useState({ full_name:'', email:'', password:'', phone:'', dob:'', category_id:'' });
  const [categories, setCategories] = useState([]);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/vendors/categories`)
      .then(res => setCategories(res.data))
      .catch(() => {});
  }, []);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const roleBtn = r => ({
    flex: 1, padding: '7px 0', borderRadius: 8, fontWeight: 700,
    fontSize: 13, cursor: 'pointer',
    background: role === r ? '#f59e0b' : '#f5f8fc',
    color: role === r ? '#fff' : '#6b7280',
    border: `1.5px solid ${role === r ? '#f59e0b' : '#e5e7eb'}`
  });

  const handleRegister = async () => {
    setError(''); setSuccess('');
    try {
      const endpoint = role === 'user'
        ? `${API}/auth/register/user`
        : `${API}/auth/register/vendor`;
      await axios.post(endpoint, form);
      setSuccess('Registered successfully! Redirecting to login...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.head}>
          <div style={S.title}>⚡ ZippyLocal — Register</div>
        </div>
        <div style={S.body}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {['user','vendor'].map(r => (
              <button key={r} style={roleBtn(r)} onClick={() => setRole(r)}>
                {r === 'user' ? '👤 Customer' : '🔧 Vendor'}
              </button>
            ))}
          </div>

          <label style={S.label}>Full Name</label>
          <input style={S.input} value={form.full_name} onChange={set('full_name')} placeholder="Your full name" />

          <label style={S.label}>Email</label>
          <input style={S.input} type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />

          <label style={S.label}>Password</label>
          <input style={S.input} type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />

          <label style={S.label}>Phone</label>
          <input style={S.input} value={form.phone} onChange={set('phone')} placeholder="98XXXXXXXX" />

          {role === 'user' && (
            <>
              <label style={S.label}>Date of Birth</label>
              <input style={S.input} type="date" value={form.dob} onChange={set('dob')} />
            </>
          )}

          {role === 'vendor' && (
            <>
              <label style={S.label}>Service Category</label>
              <select style={S.input} value={form.category_id} onChange={set('category_id')}>
                <option value="">-- Select category --</option>
                {categories.map(c => (
                  <option key={c[0]} value={c[0]}>{c[1]}</option>
                ))}
              </select>
            </>
          )}

          <button style={S.btn} onClick={handleRegister}>Create Account →</button>
          {error   && <div style={S.err}>{error}</div>}
          {success && <div style={S.ok}>{success}</div>}
          <Link to="/" style={S.link}>Already have an account? Login</Link>
        </div>
      </div>
    </div>
  );
}