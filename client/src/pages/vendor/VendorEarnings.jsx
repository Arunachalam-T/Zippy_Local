import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function VendorEarnings() {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const token   = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(`${API}/bookings/vendor`, { headers })
      .then(res => { setBookings(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const paid      = bookings.filter(b => b.payment_status === 'PAID');
  const pending   = bookings.filter(b => b.status === 'DONE' && b.payment_status === 'PENDING');
  const totalEarned  = paid.reduce((s, b) => s + (b.total_amount || 0), 0);
  const totalPending = pending.reduce((s, b) => s + (b.total_amount || 0), 0);

  // Group by payment method
  const byMethod = paid.reduce((acc, b) => {
    const m = b.payment_method || 'CASH';
    acc[m] = (acc[m] || 0) + (b.total_amount || 0);
    return acc;
  }, {});

  const S = {
    page:    { padding: '28px 20px', maxWidth: 900, margin: '0 auto', fontFamily: 'sans-serif' },
    title:   { fontSize: 22, fontWeight: 800, color: '#1e64b4', marginBottom: 24 },
    stats:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12, marginBottom: 28 },
    stat:    color => ({ background: '#fff', borderRadius: 12, padding: '20px', boxShadow: '0 2px 8px #0001', borderTop: `4px solid ${color}`, textAlign: 'center' }),
    statVal: color => ({ fontSize: 28, fontWeight: 800, color, margin: '8px 0 4px' }),
    statLbl: { fontSize: 13, color: '#6b7280' },
    section: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px #0001', marginBottom: 20 },
    secTitle:{ fontSize: 16, fontWeight: 700, color: '#1e64b4', marginBottom: 16 },
    row:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' },
    label:   { fontSize: 14, color: '#1f2937' },
    amount:  { fontSize: 15, fontWeight: 700, color: '#16a34a' },
    pending2:{ fontSize: 15, fontWeight: 700, color: '#ca8a04' },
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#6b7280', fontFamily: 'sans-serif' }}>Loading...</div>;

  return (
    <div style={S.page}>
      <h2 style={S.title}>💰 Earnings Summary</h2>

      {/* Stats */}
      <div style={S.stats}>
        <div style={S.stat('#16a34a')}>
          <div style={{ fontSize: 28 }}>💰</div>
          <div style={S.statVal('#16a34a')}>₹{totalEarned}</div>
          <div style={S.statLbl}>Total Earned</div>
        </div>
        <div style={S.stat('#ca8a04')}>
          <div style={{ fontSize: 28 }}>⏳</div>
          <div style={S.statVal('#ca8a04')}>₹{totalPending}</div>
          <div style={S.statLbl}>Pending Payment</div>
        </div>
        <div style={S.stat('#1e64b4')}>
          <div style={{ fontSize: 28 }}>✅</div>
          <div style={S.statVal('#1e64b4')}>{paid.length}</div>
          <div style={S.statLbl}>Paid Jobs</div>
        </div>
        <div style={S.stat('#7c3aed')}>
          <div style={{ fontSize: 28 }}>📋</div>
          <div style={S.statVal('#7c3aed')}>{bookings.filter(b => b.status === 'DONE').length}</div>
          <div style={S.statLbl}>Jobs Done</div>
        </div>
      </div>

      {/* Payment by method */}
      <div style={S.section}>
        <div style={S.secTitle}>💳 Earnings by Payment Method</div>
        {Object.keys(byMethod).length === 0
          ? <p style={{ color: '#6b7280', fontSize: 13 }}>No paid transactions yet</p>
          : Object.entries(byMethod).map(([method, amount]) => (
            <div key={method} style={S.row}>
              <span style={S.label}>
                {method === 'CASH' ? '💵' : method === 'UPI' ? '📱' : '💳'} {method}
              </span>
              <span style={S.amount}>₹{amount}</span>
            </div>
          ))
        }
      </div>

      {/* Paid transactions */}
      <div style={S.section}>
        <div style={S.secTitle}>✅ Paid Transactions</div>
        {paid.length === 0
          ? <p style={{ color: '#6b7280', fontSize: 13 }}>No paid transactions yet</p>
          : paid.map(b => (
            <div key={b.booking_id} style={S.row}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
                  {b.customer_name} — {b.service_name}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  {new Date(b.scheduled_at).toLocaleDateString()} | {b.payment_method}
                </div>
              </div>
              <span style={S.amount}>₹{b.total_amount}</span>
            </div>
          ))
        }
      </div>

      {/* Pending payments */}
      {pending.length > 0 && (
        <div style={S.section}>
          <div style={S.secTitle}>⏳ Awaiting Payment</div>
          {pending.map(b => (
            <div key={b.booking_id} style={S.row}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
                  {b.customer_name} — {b.service_name}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  {new Date(b.scheduled_at).toLocaleDateString()} | Service completed
                </div>
              </div>
              <span style={S.pending2}>₹{b.total_amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}