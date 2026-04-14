import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AREAS = ['All','Peelamedu','Hopes College','RS Puram','Gandhipuram','Ukkadam','Singanallur','Saravanampatti','Vadavalli','Kovaipudur'];

export default function VendorSearch() {
  const [vendors,    setVendors]    = useState([]);
  const [categories, setCategories] = useState([]);
  const [category,   setCategory]   = useState('');
  const [area,       setArea]       = useState('');
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/vendors/categories`).then(res => setCategories(res.data));
    fetchVendors();
  }, []);

  const fetchVendors = async (cat = '', ar = '') => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/vendors`, {
        params: { category: cat, area: ar }
      });
      setVendors(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleFilter = () => fetchVendors(category, area === 'All' ? '' : area);

  const filtered = vendors.filter(v =>
    v.full_name.toLowerCase().includes(search.toLowerCase()) ||
    v.category_name?.toLowerCase().includes(search.toLowerCase())
  );

  const S = {
    page:  { padding: '28px 20px', maxWidth: 1000, margin: '0 auto', fontFamily: 'sans-serif' },
    title: { color: '#1e64b4', marginBottom: 18, fontSize: 22, fontWeight: 700 },
    filters: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 },
    input: { flex: 1, minWidth: 180, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14 },
    select: { padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, background: '#fff' },
    btn:   { background: '#1e64b4', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' },
    grid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 },
    card:  { background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px #0001', padding: 18 },
    name:  { fontSize: 17, fontWeight: 700, color: '#1f2937' },
    cat:   { color: '#1e64b4', fontWeight: 600, fontSize: 13, margin: '4px 0' },
    gray:  { color: '#6b7280', fontSize: 13 },
    bookBtn: { background: '#1e64b4', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', marginTop: 12 }
  };

  const stars = r => '★'.repeat(Math.floor(r || 0)) + '☆'.repeat(5 - Math.floor(r || 0));

  return (
    <div style={S.page}>
      <h2 style={S.title}>🔍 Find Local Vendors — Coimbatore</h2>

      <div style={S.filters}>
        <input style={S.input} placeholder="Search by name or service..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <select style={S.select} value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Services</option>
          {categories.map(c => <option key={c[0]} value={c[1]}>{c[1]}</option>)}
        </select>
        <select style={S.select} value={area} onChange={e => setArea(e.target.value)}>
          {AREAS.map(a => <option key={a}>{a}</option>)}
        </select>
        <button style={S.btn} onClick={handleFilter}>Search</button>
      </div>

      {loading && <p style={{ color: '#6b7280' }}>Loading vendors...</p>}

      <div style={S.grid}>
        {filtered.map(v => (
          <div key={v.vendor_id} style={{
            ...S.card,
            borderLeft: `4px solid ${v.is_available !== 0 ? '#16a34a' : '#dc2626'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={S.name}>{v.full_name}</div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                background: v.is_available !== 0 ? '#dcfce7' : '#fee2e2',
                color: v.is_available !== 0 ? '#16a34a' : '#dc2626'
              }}>
                {v.is_available !== 0 ? 'Available' : 'Busy'}
              </span>
            </div>
            <div style={S.cat}>🔧 {v.category_name}</div>
            <div style={S.gray}>📍 {v.area}, {v.city}</div>
            <div style={{ color: '#f59e0b', fontSize: 14, margin: '6px 0' }}>
              {stars(v.rating)}
              <span style={{ color: '#6b7280', fontSize: 12, marginLeft: 4 }}>{v.rating || 0}</span>
            </div>
            <div style={S.gray}>📞 {v.phone}</div>
            <button style={S.bookBtn}
              onClick={() => navigate(`/book/${v.vendor_id}`, { state: v })}>
              Book Now
            </button>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <p style={{ color: '#6b7280' }}>No vendors found. Try different filters.</p>
        )}
      </div>
    </div>
  );
}