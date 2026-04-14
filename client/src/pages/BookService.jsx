import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function BookService() {
  const { vendor_id } = useParams();
  const { state: vendor } = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [services,  setServices]  = useState([]);
  const [form,      setForm]      = useState({ service_id:'', scheduled_at:'', address:'', notes:'' });
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState('');

  useEffect(() => {
    axios.get(`${API}/vendors/services/${vendor_id}`)
      .then(res => setServices(res.data))
      .catch(() => {});
  }, [vendor_id]);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const S = {
    page:  { padding: '28px 20px', maxWidth: 540, margin: '0 auto', fontFamily: 'sans-serif' },
    title: { color: '#1e64b4', marginBottom: 20, fontSize: 22, fontWeight: 700 },
    card:  { background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px #0001', padding: 28 },
    label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#1f2937', marginBottom: 4 },
    input: { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', marginBottom: 16 },
    btn:   { background: '#1e64b4', color: '#fff', border: 'none', padding: '9px 22px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' },
    err:   { color: '#dc2626', fontSize: 13, marginTop: 8 }
  };

  const handleBook = async () => {
    setError('');
    if (!form.service_id || !form.scheduled_at || !form.address)
      return setError('Please fill all required fields');
    try {
      await axios.post(`${API}/bookings`, {
        vendor_id:    parseInt(vendor_id),
        service_id:   parseInt(form.service_id),
        scheduled_at: form.scheduled_at.replace('T', ' ') + ':00',
        address:      form.address,
        notes:        form.notes
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    }
  };

  if (submitted) return (
    <div style={{ ...S.page, textAlign: 'center', paddingTop: 80 }}>
      <div style={{ fontSize: 56 }}>✅</div>
      <h2 style={{ color: '#16a34a' }}>Booking Confirmed!</h2>
      <p style={{ color: '#6b7280' }}>Your booking has been submitted.<br />The vendor will confirm shortly.</p>
      <button style={S.btn} onClick={() => navigate('/bookings')}>View My Bookings</button>
    </div>
  );

  return (
    <div style={S.page}>
      <h2 style={S.title}>📋 Book — {vendor?.full_name}</h2>
      <div style={S.card}>

        <label style={S.label}>Select Service</label>
        <select style={S.input} value={form.service_id} onChange={set('service_id')}>
          <option value="">-- Choose a service --</option>
          {services.map(s => (
            <option key={s.service_id} value={s.service_id}>
              {s.service_name} — ₹{s.final_price} ({s.duration_mins} mins)
            </option>
          ))}
        </select>

        <label style={S.label}>Date & Time</label>
        <input style={S.input} type="datetime-local"
          value={form.scheduled_at} onChange={set('scheduled_at')} />

        <label style={S.label}>Your Address</label>
        <input style={S.input} value={form.address} onChange={set('address')}
          placeholder="Flat no, Street, Area, Coimbatore" />

        <label style={S.label}>Notes (optional)</label>
        <textarea style={{ ...S.input, resize: 'vertical' }} rows={3}
          value={form.notes} onChange={set('notes')}
          placeholder="Describe the issue briefly..." />

        <button style={S.btn} onClick={handleBook}>Submit Booking →</button>
        {error && <div style={S.err}>{error}</div>}
      </div>
    </div>
  );
}