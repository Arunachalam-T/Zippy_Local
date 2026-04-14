import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function VendorDashboard() {
  const [stats,     setStats]     = useState({});
  const [upcoming,  setUpcoming]  = useState([]);
  const [available, setAvailable] = useState(1);
  const [vendor,    setVendor]    = useState({});
  const [loading,   setLoading]   = useState(true);
  const navigate = useNavigate();
  const token   = localStorage.getItem('token');
  const user    = JSON.parse(localStorage.getItem('user') || 'null');
  const headers = { Authorization: `Bearer ${token}` };
  const vid     = user?.vendor_id || user?.id;

  useEffect(() => {
    const load = async () => {
      try {
        const [bRes, vRes] = await Promise.all([
          axios.get(`${API}/bookings/vendor`,  { headers }),
          axios.get(`${API}/vendors/${vid}`,   { headers }),
        ]);
        const bookings = bRes.data;
        setVendor(vRes.data);
        setAvailable(vRes.data.is_available);

        // Stats
        setStats({
          total:     bookings.length,
          pending:   bookings.filter(b => b.status === 'PENDING').length,
          confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
          done:      bookings.filter(b => b.status === 'DONE').length,
          cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
          earned:    bookings
            .filter(b => b.payment_status === 'PAID')
            .reduce((s, b) => s + (b.total_amount || 0), 0),
        });

        // Upcoming — confirmed bookings sorted by date
        const up = bookings
          .filter(b => b.status === 'CONFIRMED')
          .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
          .slice(0, 5);
        setUpcoming(up);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    load();
  }, []);

  const toggleAvailability = async () => {
    const newVal = available === 1 ? 0 : 1;
    await axios.put(`${API}/vendors/availability`,
      { is_available: newVal }, { headers });
    setAvailable(newVal);
  };

  const S = {
    page:    { padding: '28px 20px', maxWidth: 1000, margin: '0 auto', fontFamily: 'sans-serif' },
    header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
    title:   { fontSize: 24, fontWeight: 800, color: '#1e64b4', margin: 0 },
    sub:     { fontSize: 13, color: '#6b7280', marginTop: 4 },
    stats:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12, marginBottom: 28 },
    stat:    color => ({ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 2px 8px #0001', borderTop: `4px solid ${color}` }),
    statVal: color => ({ fontSize: 26, fontWeight: 800, color }),
    statLbl: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    section: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px #0001', marginBottom: 20 },
    secTitle:{ fontSize: 16, fontWeight: 700, color: '#1e64b4', marginBottom: 16 },
    availOn: { background: '#16a34a', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' },
    availOff:{ background: '#dc2626', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' },
    upCard:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f0f7ff', borderRadius: 10, marginBottom: 10, borderLeft: '4px solid #1e64b4' },
    navBtn:  { background: '#1e64b4', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#6b7280', fontFamily: 'sans-serif' }}>Loading...</div>;

  const statItems = [
    { label: 'Total Jobs',  value: stats.total,     color: '#1e64b4', icon: '📋' },
    { label: 'Pending',     value: stats.pending,   color: '#ca8a04', icon: '⏳' },
    { label: 'Confirmed',   value: stats.confirmed, color: '#7c3aed', icon: '✅' },
    { label: 'Completed',   value: stats.done,      color: '#16a34a', icon: '🎉' },
    { label: 'Cancelled',   value: stats.cancelled, color: '#dc2626', icon: '❌' },
    { label: 'Total Earned',value: `₹${stats.earned}`, color: '#f59e0b', icon: '💰' },
  ];

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={S.header}>
        <div>
          <h2 style={S.title}>📊 Dashboard</h2>
          <p style={S.sub}>Welcome back, {vendor.full_name}! — {vendor.category_name}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, background: '#16a34a', borderRadius: '50%', display: 'inline-block' }}></span>
            Live
          </span>
          <button
            style={available === 1 ? S.availOn : S.availOff}
            onClick={toggleAvailability}>
            {available === 1 ? '✅ Available' : '🔴 Busy'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={S.stats}>
        {statItems.map(s => (
          <div key={s.label} style={S.stat(s.color)}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div style={S.statVal(s.color)}>{s.value}</div>
            <div style={S.statLbl}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Availability */}
      <div style={S.section}>
        <div style={S.secTitle}>🟢 Availability Status</div>
        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 14 }}>
          {available === 1
            ? 'You are currently available. Customers can book you.'
            : 'You are currently busy. New bookings are blocked automatically.'}
        </p>
        <button style={available === 1 ? S.availOn : S.availOff} onClick={toggleAvailability}>
          {available === 1 ? '✅ Available — Click to go Busy' : '🔴 Busy — Click to go Available'}
        </button>
      </div>

      {/* Upcoming Services */}
      <div style={S.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={S.secTitle}>📅 Upcoming Services</div>
          <button style={S.navBtn} onClick={() => navigate('/vendor/bookings')}>
            View All →
          </button>
        </div>
        {upcoming.length === 0
          ? <p style={{ color: '#6b7280', fontSize: 13 }}>No upcoming services!</p>
          : upcoming.map(b => (
            <div key={b.booking_id} style={S.upCard}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1f2937' }}>
                  👤 {b.customer_name} — {b.service_name}
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>
                  🗓 {new Date(b.scheduled_at).toLocaleString()} | 📍 {b.address}
                </div>
              </div>
              <div style={{ fontWeight: 700, color: '#1e64b4' }}>₹{b.total_amount}</div>
            </div>
          ))
        }
      </div>

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
        {[
          { label: '📋 View Bookings',  path: '/vendor/bookings' },
          { label: '💰 View Earnings',  path: '/vendor/earnings' },
          { label: '⭐ View Reviews',   path: '/vendor/reviews'  },
          { label: '👤 Edit Profile',   path: '/vendor/profile'  },
        ].map(l => (
          <button key={l.path}
            style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '16px', fontWeight: 700, fontSize: 14, cursor: 'pointer', color: '#1e64b4', boxShadow: '0 2px 8px #0001' }}
            onClick={() => navigate(l.path)}>
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}