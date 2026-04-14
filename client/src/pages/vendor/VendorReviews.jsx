import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function VendorReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const token   = localStorage.getItem('token');
  const user    = JSON.parse(localStorage.getItem('user') || 'null');
  const vid     = user?.vendor_id || user?.id;
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    console.log('User object:', user);
    console.log('Vendor ID:', vid);
    axios.get(`${API}/reviews/${vid}`, { headers })
      .then(res => {
        console.log('Reviews response:', res.data);
        setReviews(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.log('Error:', err.response?.data);
        setLoading(false);
      });
  }, []);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const ratingCount = [5,4,3,2,1].map(n => ({
    star:  n,
    count: reviews.filter(r => r.rating === n).length,
    pct:   reviews.length
      ? Math.round((reviews.filter(r => r.rating === n).length / reviews.length) * 100)
      : 0
  }));

  const stars = (r, size = 16) => (
    <span style={{ fontSize: size }}>
      <span style={{ color: '#f59e0b' }}>{'★'.repeat(Math.floor(r))}</span>
      <span style={{ color: '#d1d5db' }}>{'★'.repeat(5 - Math.floor(r))}</span>
    </span>
  );

  const S = {
    page:     { padding: '28px 20px', maxWidth: 800, margin: '0 auto', fontFamily: 'sans-serif' },
    title:    { fontSize: 22, fontWeight: 800, color: '#1e64b4', marginBottom: 24 },
    summary:  { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px #0001', marginBottom: 20, display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' },
    bigRating:{ fontSize: 64, fontWeight: 800, color: '#f59e0b', lineHeight: 1 },
    section:  { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px #0001', marginBottom: 20 },
    secTitle: { fontSize: 16, fontWeight: 700, color: '#1e64b4', marginBottom: 16 },
    card:     { padding: '16px 0', borderBottom: '1px solid #f3f4f6' },
    name:     { fontSize: 14, fontWeight: 700, color: '#1f2937' },
    gray:     { fontSize: 12, color: '#6b7280', marginTop: 2 },
    comment:  { fontSize: 14, color: '#374151', marginTop: 8, fontStyle: 'italic', background: '#f9fafb', padding: '10px 14px', borderRadius: 8, borderLeft: '3px solid #e5e7eb' },
    bar:      pct => ({ height: 8, background: '#f59e0b', borderRadius: 4, width: `${pct}%`, minWidth: 4 }),
  };

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#6b7280', fontFamily: 'sans-serif' }}>
      Loading...
    </div>
  );

  return (
    <div style={S.page}>
      <h2 style={S.title}>⭐ My Reviews & Rating</h2>

      <div style={S.summary}>
        <div style={{ textAlign: 'center' }}>
          <div style={S.bigRating}>{avgRating}</div>
          <div style={{ marginTop: 8 }}>{stars(parseFloat(avgRating), 20)}</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          {ratingCount.map(r => (
            <div key={r.star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#6b7280', width: 16 }}>{r.star}★</span>
              <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 4, height: 8 }}>
                <div style={S.bar(r.pct)}></div>
              </div>
              <span style={{ fontSize: 12, color: '#6b7280', width: 24 }}>{r.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={S.section}>
        <div style={S.secTitle}>📝 All Reviews</div>
        {reviews.length === 0
          ? <p style={{ color: '#6b7280' }}>No reviews yet! Complete jobs to get reviews.</p>
          : reviews.map((r, i) => (
            <div key={i} style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={S.name}>👤 {r.customer_name}</div>
                  <div style={{ marginTop: 4 }}>{stars(r.rating)}</div>
                </div>
                <div style={S.gray}>{new Date(r.created_at).toLocaleDateString()}</div>
              </div>
              {r.review_comment && (
                <div style={S.comment}>"{r.review_comment}"</div>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}