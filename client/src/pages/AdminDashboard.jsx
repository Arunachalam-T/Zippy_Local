import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function AdminDashboard() {
  const [stats,    setStats]    = useState({});
  const [bookings, setBookings] = useState([]);
  const [vendors,  setVendors]  = useState([]);
  const [users,    setUsers]    = useState([]);
  const [revenue,  setRevenue]  = useState([]);
  const [tab,      setTab]      = useState('bookings');
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(`${API}/admin/stats`,    { headers }).then(r => setStats(r.data));
    axios.get(`${API}/admin/bookings`, { headers }).then(r => setBookings(r.data));
    axios.get(`${API}/admin/vendors`,  { headers }).then(r => setVendors(r.data));
    axios.get(`${API}/admin/users`,    { headers }).then(r => setUsers(r.data));
    axios.get(`${API}/admin/revenue/2025`, { headers }).then(r => setRevenue(r.data));
  }, []);

  const updateStatus = async (booking_id, status) => {
    await axios.put(`${API}/admin/booking/status`, { booking_id, status }, { headers });
    setBookings(prev => prev.map(b => b.booking_id === booking_id ? { ...b, status } : b));
  };

  const deleteUser = async id => {
    if (!window.confirm('Delete this user?')) return;
    await axios.delete(`${API}/admin/user/${id}`, { headers });
    setUsers(prev => prev.filter(u => u.user_id !== id));
  };

  const deleteVendor = async id => {
    if (!window.confirm('Delete this vendor?')) return;
    await axios.delete(`${API}/admin/vendor/${id}`, { headers });
    setVendors(prev => prev.filter(v => v.vendor_id !== id));
  };

  const statusColor = s => ({
    CONFIRMED: { bg: '#dcfce7', text: '#16a34a' },
    PENDING:   { bg: '#fef9c3', text: '#ca8a04' },
    DONE:      { bg: '#dbeafe', text: '#1d4ed8' },
    CANCELLED: { bg: '#fee2e2', text: '#dc2626' },
  }[s] || { bg: '#e5e7eb', text: '#374151' });

  const S = {
    page:   { padding: '28px 20px', maxWidth: 1100, margin: '0 auto', fontFamily: 'sans-serif' },
    title:  { color: '#1e64b4', marginBottom: 18, fontSize: 22, fontWeight: 700 },
    stats:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12, marginBottom: 24 },
    stat:   { background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 2px 8px #0001' },
    tabs:   { display: 'flex', gap: 8, marginBottom: 16 },
    tabBtn: active => ({ padding: '8px 20px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', border: 'none', background: active ? '#1e64b4' : '#e5e7eb', color: active ? '#fff' : '#6b7280' }),
    table:  { width: '100%', borderCollapse: 'collapse', fontSize: 13, background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px #0001' },
    th:     { padding: '11px 14px', textAlign: 'left', fontWeight: 700, background: '#1e64b4', color: '#fff' },
    td:     { padding: '10px 14px', borderBottom: '1px solid #f3f4f6' },
    delBtn: { background: 'transparent', color: '#dc2626', border: '1.5px solid #dc2626', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' },
    confirmBtn: { background: '#16a34a', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', marginRight: 4 }
  };

  const statItems = [
    { label: 'Total Users',    value: stats.total_users,    icon: '👤', color: '#1e64b4' },
    { label: 'Total Vendors',  value: stats.total_vendors,  icon: '🔧', color: '#16a34a' },
    { label: 'Total Bookings', value: stats.total_bookings, icon: '📋', color: '#7c3aed' },
    { label: 'Pending',        value: stats.pending,        icon: '⏳', color: '#ca8a04' },
    { label: 'Completed',      value: stats.completed,      icon: '✅', color: '#16a34a' },
    { label: 'Revenue',        value: `₹${stats.total_revenue || 0}`, icon: '💰', color: '#dc2626' },
  ];

  return (
    <div style={S.page}>
      <h2 style={S.title}>🛡 Admin Dashboard</h2>

      {/* Stats */}
      <div style={S.stats}>
        {statItems.map(s => (
          <div key={s.label} style={{ ...S.stat, borderTop: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 24 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {['bookings','vendors','users','revenue'].map(t => (
          <button key={t} style={S.tabBtn(tab === t)} onClick={() => setTab(t)}>
            {t === 'bookings' ? '📋 Bookings' : t === 'vendors' ? '🔧 Vendors' : t === 'users' ? '👤 Users' : '💰 Revenue'}
          </button>
        ))}
      </div>

      {/* Bookings Table */}
      {tab === 'bookings' && (
        <table style={S.table}>
          <thead>
            <tr>{['ID','Customer','Vendor','Service','Amount','Status','Action'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {bookings.map((b, i) => {
              const sc = statusColor(b.status);
              return (
                <tr key={b.booking_id} style={{ background: i % 2 === 0 ? '#f9fafb' : '#fff' }}>
                  <td style={S.td}>#{b.booking_id}</td>
                  <td style={S.td}>{b.customer}</td>
                  <td style={S.td}>{b.vendor}</td>
                  <td style={S.td}>{b.service_name}</td>
                  <td style={S.td}>₹{b.total_amount}</td>
                  <td style={S.td}><span style={{ background: sc.bg, color: sc.text, padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{b.status}</span></td>
                  <td style={S.td}>
                    {b.status === 'PENDING' && <button style={S.confirmBtn} onClick={() => updateStatus(b.booking_id, 'CONFIRMED')}>Confirm</button>}
                    {!['DONE','CANCELLED'].includes(b.status) && <button style={S.delBtn} onClick={() => updateStatus(b.booking_id, 'CANCELLED')}>Cancel</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Vendors Table */}
      {tab === 'vendors' && (
        <table style={S.table}>
          <thead>
            <tr>{['ID','Name','Category','Area','Rating','Available','Action'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {vendors.map((v, i) => (
              <tr key={v.vendor_id} style={{ background: i % 2 === 0 ? '#f9fafb' : '#fff' }}>
                <td style={S.td}>#{v.vendor_id}</td>
                <td style={S.td}>{v.full_name}</td>
                <td style={S.td}>{v.category_name}</td>
                <td style={S.td}>{v.area}</td>
                <td style={S.td}>⭐ {v.rating}</td>
                <td style={S.td}>
                  <span style={{ background: v.is_available ? '#dcfce7' : '#fee2e2', color: v.is_available ? '#16a34a' : '#dc2626', padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>
                    {v.is_available ? 'Available' : 'Busy'}
                  </span>
                </td>
                <td style={S.td}><button style={S.delBtn} onClick={() => deleteVendor(v.vendor_id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Users Table */}
      {tab === 'users' && (
        <table style={S.table}>
          <thead>
            <tr>{['ID','Name','Email','Phone','Age','Action'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.user_id} style={{ background: i % 2 === 0 ? '#f9fafb' : '#fff' }}>
                <td style={S.td}>#{u.user_id}</td>
                <td style={S.td}>{u.full_name}</td>
                <td style={S.td}>{u.email}</td>
                <td style={S.td}>{u.phone}</td>
                <td style={S.td}>{u.age} yrs</td>
                <td style={S.td}><button style={S.delBtn} onClick={() => deleteUser(u.user_id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Revenue Table */}
      {tab === 'revenue' && (
        <table style={S.table}>
          <thead>
            <tr>{['Month','Total Bookings','Revenue','Completed','Cancelled'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {revenue.length === 0 && (
              <tr><td colSpan={5} style={{ ...S.td, textAlign: 'center', color: '#6b7280' }}>No revenue data for 2025 yet</td></tr>
            )}
            {revenue.map((r, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#f9fafb' : '#fff' }}>
                <td style={S.td}>{r.month_name}</td>
                <td style={S.td}>{r.total_bookings}</td>
                <td style={S.td}>₹{r.total_revenue}</td>
                <td style={S.td}>{r.completed}</td>
                <td style={S.td}>{r.cancelled}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}