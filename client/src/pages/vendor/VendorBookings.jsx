import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const statusColor = s => ({
  CONFIRMED: { bg: '#dcfce7', text: '#16a34a' },
  PENDING:   { bg: '#fef9c3', text: '#ca8a04' },
  DONE:      { bg: '#dbeafe', text: '#1d4ed8' },
  CANCELLED: { bg: '#fee2e2', text: '#dc2626' },
}[s] || { bg: '#e5e7eb', text: '#374151' });

export default function VendorBookings() {
  const [bookings,      setBookings]      = useState([]);
  const [filter,        setFilter]        = useState('ALL');
  const [notifications, setNotifications] = useState([]);
  const [showNotif,     setShowNotif]     = useState(false);
  const [loading,       setLoading]       = useState(true);
  const prevRef = useRef([]);
  const token   = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API}/bookings/vendor`, { headers });
      const newB = res.data;
      if (prevRef.current.length > 0) {
        const prevIds = prevRef.current.map(b => b.booking_id);
        const newOnes = newB.filter(b => !prevIds.includes(b.booking_id) && b.status === 'PENDING');
        if (newOnes.length > 0) {
          setNotifications(prev => [
            ...newOnes.map(b => ({
              id: b.booking_id,
              message: `New booking from ${b.customer_name} for ${b.service_name}!`,
              time: new Date().toLocaleTimeString()
            })),
            ...prev
          ]);
          setShowNotif(true);
        }
      }
      prevRef.current = newB;
      setBookings(newB);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission();
    fetchBookings();
    const interval = setInterval(fetchBookings, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (booking_id, status) => {
    await axios.put(`${API}/bookings/status`, { booking_id, status }, { headers });
    setBookings(prev => prev.map(b =>
      b.booking_id === booking_id ? { ...b, status } : b
    ));
  };

  const cancelBooking = async (booking_id) => {
    await axios.put(`${API}/bookings/cancel`, { booking_id }, { headers });
    setBookings(prev => prev.map(b =>
      b.booking_id === booking_id ? { ...b, status: 'CANCELLED' } : b
    ));
  };

  const filtered = filter === 'ALL'
    ? bookings
    : bookings.filter(b => b.status === filter);

  const S = {
    page:       { padding: '28px 20px', maxWidth: 900, margin: '0 auto', fontFamily: 'sans-serif' },
    header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 },
    title:      { fontSize: 22, fontWeight: 800, color: '#1e64b4', margin: 0 },
    filters:    { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
    filterBtn:  active => ({ padding: '6px 16px', borderRadius: 20, fontWeight: 700, fontSize: 12, cursor: 'pointer', border: 'none', background: active ? '#1e64b4' : '#e5e7eb', color: active ? '#fff' : '#6b7280' }),
    card:       pending => ({ background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px #0001', padding: 20, marginBottom: 12, borderLeft: `4px solid ${pending ? '#f59e0b' : '#e5e7eb'}` }),
    row:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 },
    name:       { fontSize: 15, fontWeight: 700, color: '#1f2937' },
    gray:       { color: '#6b7280', fontSize: 13, marginTop: 3 },
    badge:      s => ({ background: statusColor(s).bg, color: statusColor(s).text, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }),
    confirmBtn: { background: '#16a34a', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', marginRight: 4 },
    doneBtn:    { background: '#1d4ed8', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', marginRight: 4 },
    cancelBtn:  { background: 'transparent', color: '#dc2626', border: '1.5px solid #dc2626', padding: '6px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' },
    bellWrap:   { position: 'relative', display: 'inline-block' },
    bell:       { background: '#1e64b4', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' },
    bellBadge:  { position: 'absolute', top: -6, right: -6, background: '#dc2626', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    notifPanel: { background: '#fff', borderRadius: 12, boxShadow: '0 4px 24px #0003', padding: 20, marginBottom: 16, border: '2px solid #1e64b4' },
    notifItem:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f0f7ff', borderRadius: 8, marginBottom: 8, borderLeft: '4px solid #1e64b4' },
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#6b7280', fontFamily: 'sans-serif' }}>Loading...</div>;

  const pendingCount = bookings.filter(b => b.status === 'PENDING').length;

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={S.header}>
        <div>
          <h2 style={S.title}>📋 My Bookings</h2>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>
            {bookings.length} total — {pendingCount} pending
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, background: '#16a34a', borderRadius: '50%', display: 'inline-block' }}></span>
            Live
          </span>
          <div style={S.bellWrap}>
            <button style={S.bell} onClick={() => setShowNotif(!showNotif)}>🔔</button>
            {notifications.length > 0 && (
              <span style={S.bellBadge}>{notifications.length}</span>
            )}
          </div>
        </div>
      </div>

      {/* Notification Panel */}
      {showNotif && (
        <div style={S.notifPanel}>
          <div style={{ fontWeight: 700, color: '#1e64b4', fontSize: 15, marginBottom: 12 }}>🔔 Notifications</div>
          {notifications.length === 0
            ? <p style={{ color: '#6b7280', fontSize: 13 }}>No new notifications</p>
            : notifications.map(n => (
              <div key={n.id} style={S.notifItem}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>🆕 {n.message}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>⏰ {n.time}</div>
                </div>
                <button style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 18, cursor: 'pointer' }}
                  onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))}>✕</button>
              </div>
            ))
          }
        </div>
      )}

      {/* Pending warning */}
      {pendingCount > 0 && (
        <div style={{ background: '#fef9c3', border: '1.5px solid #f59e0b', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 14, fontWeight: 600, color: '#92400e' }}>
          ⚠️ {pendingCount} booking{pendingCount > 1 ? 's' : ''} waiting for your confirmation!
        </div>
      )}

      {/* Filter tabs */}
      <div style={S.filters}>
        {['ALL','PENDING','CONFIRMED','DONE','CANCELLED'].map(f => (
          <button key={f} style={S.filterBtn(filter === f)} onClick={() => setFilter(f)}>
            {f === 'ALL' ? '📋 All' : f === 'PENDING' ? `⏳ Pending (${bookings.filter(b=>b.status==='PENDING').length})` : f === 'CONFIRMED' ? '✅ Confirmed' : f === 'DONE' ? '🎉 Done' : '❌ Cancelled'}
          </button>
        ))}
      </div>

      {/* Booking Cards */}
      {filtered.length === 0 && <p style={{ color: '#6b7280' }}>No bookings found!</p>}
      {filtered.map(b => (
        <div key={b.booking_id} style={S.card(b.status === 'PENDING')}>
          <div style={S.row}>
            <div style={{ flex: 1 }}>
              <div style={S.name}>
                👤 {b.customer_name} — {b.service_name}
                {b.status === 'PENDING' && (
                  <span style={{ marginLeft: 8, background: '#fef9c3', color: '#92400e', fontSize: 11, padding: '2px 8px', borderRadius: 8, fontWeight: 700 }}>NEW</span>
                )}
              </div>
              <div style={S.gray}>📞 {b.customer_phone}</div>
              <div style={S.gray}>📍 {b.address}</div>
              <div style={S.gray}>🗓 {new Date(b.scheduled_at).toLocaleString()}</div>
              <div style={S.gray}>📝 {b.notes || 'No notes'}</div>
              <div style={S.gray}>
                💰 ₹{b.total_amount} | {b.payment_method} —
                <span style={{ fontWeight: 700, color: b.payment_status === 'PAID' ? '#16a34a' : '#ca8a04', marginLeft: 4 }}>
                  {b.payment_status}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <span style={S.badge(b.status)}>{b.status}</span>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {b.status === 'PENDING' && (
                  <button style={S.confirmBtn} onClick={() => updateStatus(b.booking_id, 'CONFIRMED')}>✓ Confirm</button>
                )}
                {b.status === 'CONFIRMED' && (
                  <button style={S.doneBtn} onClick={() => updateStatus(b.booking_id, 'DONE')}>✓ Mark Done</button>
                )}
                {!['DONE','CANCELLED'].includes(b.status) && (
                  <button style={S.cancelBtn} onClick={() => cancelBooking(b.booking_id)}>Cancel</button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}