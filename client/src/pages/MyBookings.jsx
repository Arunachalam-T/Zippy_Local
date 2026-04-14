import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const statusColor = s => ({
  CONFIRMED: { bg: '#dcfce7', text: '#16a34a' },
  PENDING:   { bg: '#fef9c3', text: '#ca8a04' },
  DONE:      { bg: '#dbeafe', text: '#1d4ed8' },
  CANCELLED: { bg: '#fee2e2', text: '#dc2626' },
}[s] || { bg: '#e5e7eb', text: '#374151' });

export default function MyBookings() {
  const [bookings,    setBookings]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [payModal,    setPayModal]    = useState(null);
  const [payMethod,   setPayMethod]   = useState('CASH');
  const [paySuccess,  setPaySuccess]  = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [rating,      setRating]      = useState(5);
  const [comment,     setComment]     = useState('');
  const [reviewDone,  setReviewDone]  = useState([]);
  const [prevStatuses,setPrevStatuses]= useState({});

  const token   = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchBookings = async () => {
  try {
    const [bRes, rRes] = await Promise.all([
      axios.get(`${API}/bookings/history`, { headers }),
      axios.get(`${API}/reviews/user`,     { headers })
    ]);
    const data = bRes.data;
    const reviewed = rRes.data.map(r => r.booking_id);
    setReviewDone(reviewed);

    const currentStatuses = {};
    data.forEach(b => { currentStatuses[b.booking_id] = b.status; });
    Object.keys(prevStatuses).forEach(id => {
      if (prevStatuses[id] !== 'DONE' && currentStatuses[id] === 'DONE') {
        const booking = data.find(b => b.booking_id === parseInt(id));
        if (booking && booking.payment_status === 'PENDING') {
          setPayModal(booking);
          setPayMethod('CASH');
        }
      }
    });
    setPrevStatuses(currentStatuses);
    setBookings(data);
  } catch (err) {
    console.error(err);
  }
  setLoading(false);
};

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchBookings();
    }, 5000);
    return () => clearInterval(interval);
  }, [prevStatuses]);

  const cancel = async (booking_id) => {
    try {
      await axios.put(`${API}/bookings/cancel`, { booking_id }, { headers });
      setBookings(prev => prev.map(b =>
        b.booking_id === booking_id ? { ...b, status: 'CANCELLED' } : b
      ));
    } catch (err) {
      alert(err.response?.data?.message || 'Cancel failed');
    }
  };

  const handlePayment = async () => {
    try {
      await axios.put(`${API}/bookings/payment`,
        { booking_id: payModal.booking_id, method: payMethod },
        { headers }
      );
      setBookings(prev => prev.map(b =>
        b.booking_id === payModal.booking_id
          ? { ...b, payment_status: 'PAID', payment_method: payMethod }
          : b
      ));
      setPaySuccess(payModal);
      setPayModal(null);
    } catch (err) {
      alert('Payment failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReview = async () => {
    try {
      await axios.post(`${API}/reviews`, {
        vendor_id:      reviewModal.vendor_id,
        booking_id:     reviewModal.booking_id,
        rating,
        review_comment: comment
      }, { headers });
      setReviewDone(prev => [...prev, reviewModal.booking_id]);
      setReviewModal(null);
      setRating(5);
      setComment('');
      alert('Review submitted successfully!');
    } catch (err) {
      alert('Review failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const S = {
    page:      { padding: '28px 20px', maxWidth: 900, margin: '0 auto', fontFamily: 'sans-serif' },
    title:     { fontSize: 22, fontWeight: 800, color: '#1e64b4', margin: '0 0 20px' },
    card:      color => ({ background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px #0001', padding: 20, marginBottom: 14, borderLeft: `4px solid ${color}` }),
    row:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 },
    name:      { fontSize: 15, fontWeight: 700, color: '#1f2937' },
    gray:      { color: '#6b7280', fontSize: 13, marginTop: 3 },
    badge:     s => ({ background: statusColor(s).bg, color: statusColor(s).text, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }),
    cancelBtn: { background: 'transparent', color: '#dc2626', border: '1.5px solid #dc2626', padding: '6px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' },
    payBtn:    { background: '#f59e0b', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' },
    reviewBtn: { background: '#7c3aed', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' },
    overlay:   { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal:     { background: '#fff', borderRadius: 20, padding: 32, width: 380, boxShadow: '0 8px 40px #0004' },
    methodBtn: active => ({ flex: 1, padding: '12px 0', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', border: `2px solid ${active ? '#1e64b4' : '#e5e7eb'}`, background: active ? '#eff6ff' : '#fff', color: active ? '#1e64b4' : '#6b7280' }),
    payNowBtn: { background: '#1e64b4', color: '#fff', border: 'none', padding: '13px 0', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', width: '100%', marginTop: 16 },
    closeBtn:  { background: 'transparent', color: '#6b7280', border: '1.5px solid #e5e7eb', padding: '10px 0', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer', width: '100%', marginTop: 8 },
    starBtn:   active => ({ fontSize: 28, cursor: 'pointer', color: active ? '#f59e0b' : '#d1d5db', background: 'none', border: 'none', padding: '0 4px' }),
    textarea:  { width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', resize: 'vertical', marginBottom: 12 },
    submitBtn: { background: '#7c3aed', color: '#fff', border: 'none', padding: '13px 0', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer', width: '100%' },
  };

  const cardColor = b => {
    if (b.status === 'DONE' && b.payment_status === 'PENDING') return '#f59e0b';
    if (b.status === 'DONE')      return '#3b82f6';
    if (b.status === 'CONFIRMED') return '#16a34a';
    if (b.status === 'CANCELLED') return '#dc2626';
    return '#e5e7eb';
  };

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#6b7280', fontFamily: 'sans-serif' }}>
      Loading bookings...
    </div>
  );

  return (
    <div style={S.page}>
      <h2 style={S.title}>📋 My Bookings</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <span style={{ width: 8, height: 8, background: '#16a34a', borderRadius: '50%', display: 'inline-block' }}></span>
        <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>Live — checking every 5 seconds</span>
      </div>

      {bookings.filter(b => b.status === 'DONE' && b.payment_status === 'PENDING').length > 0 && (
        <div style={{ background: '#fef9c3', border: '1.5px solid #f59e0b', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14, fontWeight: 600, color: '#92400e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>💳 Service completed — payment pending!</span>
          <button style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
            onClick={() => {
              const b = bookings.find(b => b.status === 'DONE' && b.payment_status === 'PENDING');
              if (b) { setPayModal(b); setPayMethod('CASH'); }
            }}>
            Pay Now
          </button>
        </div>
      )}

      {paySuccess && (
        <div style={{ background: '#dcfce7', border: '1.5px solid #16a34a', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14, fontWeight: 600, color: '#166534', display: 'flex', justifyContent: 'space-between' }}>
          ✅ Payment successful — {paySuccess.vendor_name}!
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534', fontWeight: 700 }}
            onClick={() => setPaySuccess(null)}>✕</button>
        </div>
      )}

      {bookings.length === 0 && <p style={{ color: '#6b7280' }}>No bookings yet!</p>}

      {bookings.map(b => (
        <div key={b.booking_id} style={S.card(cardColor(b))}>
          <div style={S.row}>
            <div style={{ flex: 1 }}>
              <div style={S.name}>
                {b.vendor_name} — {b.service_name}
                {b.status === 'DONE' && b.payment_status === 'PENDING' && (
                  <span style={{ marginLeft: 8, background: '#fef9c3', color: '#92400e', fontSize: 11, padding: '2px 8px', borderRadius: 8, fontWeight: 700 }}>
                    PAYMENT NEEDED
                  </span>
                )}
                {b.status === 'DONE' && b.payment_status === 'PAID' && !reviewDone.includes(b.booking_id) && (
                  <span style={{ marginLeft: 8, background: '#ede9fe', color: '#7c3aed', fontSize: 11, padding: '2px 8px', borderRadius: 8, fontWeight: 700 }}>
                    REVIEW PENDING
                  </span>
                )}
              </div>
              <div style={S.gray}>📍 {b.address}</div>
              <div style={S.gray}>🗓 {new Date(b.scheduled_at).toLocaleString()}</div>
              <div style={S.gray}>
                💰 ₹{b.total_amount} |
                <span style={{ marginLeft: 4, fontWeight: 700, color: b.payment_status === 'PAID' ? '#16a34a' : '#ca8a04' }}>
                  {b.payment_method} — {b.payment_status}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <span style={S.badge(b.status)}>{b.status}</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {b.status === 'DONE' && b.payment_status === 'PENDING' && (
                  <button style={S.payBtn} onClick={() => { setPayModal(b); setPayMethod('CASH'); }}>
                    💳 Pay Now
                  </button>
                )}
                {b.status === 'DONE' && b.payment_status === 'PAID' && !reviewDone.includes(b.booking_id) && (
                  <button style={S.reviewBtn} onClick={() => { setReviewModal(b); setRating(5); setComment(''); }}>
                    ⭐ Review
                  </button>
                )}
                {['PENDING','CONFIRMED'].includes(b.status) && (
                  <button style={S.cancelBtn} onClick={() => cancel(b.booking_id)}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {payModal && (
        <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) setPayModal(null); }}>
          <div style={S.modal}>
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>💳</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#1f2937', textAlign: 'center', marginBottom: 4 }}>Make Payment</div>
            <div style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 20 }}>
              {payModal.vendor_name} completed your {payModal.service_name}!
            </div>
            <div style={{ background: '#f0f7ff', borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Total Amount</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#1e64b4', margin: '4px 0' }}>₹{payModal.total_amount}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', marginBottom: 10 }}>Choose Payment Method:</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {[{ key:'CASH',icon:'💵',label:'Cash'},{ key:'UPI',icon:'📱',label:'UPI'},{ key:'CARD',icon:'💳',label:'Card'}].map(m => (
                <button key={m.key} style={S.methodBtn(payMethod === m.key)} onClick={() => setPayMethod(m.key)}>
                  <div style={{ fontSize: 20 }}>{m.icon}</div>
                  <div style={{ fontSize: 12, marginTop: 2 }}>{m.label}</div>
                </button>
              ))}
            </div>
            {payMethod === 'UPI' && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#166534', marginBottom: 8 }}>
                📱 Pay via Google Pay / PhonePe / Paytm
              </div>
            )}
            {payMethod === 'CARD' && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#1e40af', marginBottom: 8 }}>
                💳 Debit or Credit card accepted
              </div>
            )}
            <button style={S.payNowBtn} onClick={handlePayment}>✅ Confirm Payment — ₹{payModal.total_amount}</button>
            <button style={S.closeBtn} onClick={() => setPayModal(null)}>Cancel</button>
          </div>
        </div>
      )}

      {reviewModal && (
        <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) setReviewModal(null); }}>
          <div style={S.modal}>
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>⭐</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#1f2937', textAlign: 'center', marginBottom: 4 }}>Rate Your Experience</div>
            <div style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 20 }}>How was {reviewModal.vendor_name}?</div>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} style={S.starBtn(n <= rating)} onClick={() => setRating(n)}>★</button>
              ))}
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
                {['','Terrible','Bad','Okay','Good','Excellent!'][rating]}
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>Write a comment (optional):</div>
            <textarea style={S.textarea} rows={3} value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share your experience..." />
            <button style={S.submitBtn} onClick={handleReview}>Submit Review</button>
            <button style={S.closeBtn} onClick={() => setReviewModal(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}