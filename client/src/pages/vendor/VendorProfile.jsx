import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function VendorProfile() {
  const [profile,      setProfile]      = useState({ full_name: '', phone: '' });
  const [address,      setAddress]      = useState({ street: '', area: '', city: 'Coimbatore', pincode: '' });
  const [available,    setAvailable]    = useState(1);
  const [myServices,   setMyServices]   = useState([]);
  const [allServices,  setAllServices]  = useState([]);
  const [vendor,       setVendor]       = useState({});
  const [selectedSvc,  setSelectedSvc]  = useState('');
  const [customPrice,  setCustomPrice]  = useState('');
  const [profileMsg,   setProfileMsg]   = useState('');
  const [addressMsg,   setAddressMsg]   = useState('');
  const [serviceMsg,   setServiceMsg]   = useState('');
  const [loading,      setLoading]      = useState(true);

  const token   = localStorage.getItem('token');
  const user    = JSON.parse(localStorage.getItem('user') || 'null');
  const vid     = user?.vendor_id || user?.id;
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const load = async () => {
      try {
        const [vRes, sRes] = await Promise.all([
          axios.get(`${API}/vendors/${vid}`,          { headers }),
          axios.get(`${API}/vendors/services/${vid}`, { headers }),
        ]);
        const v = vRes.data;
        setVendor(v);
        setProfile({ full_name: v.full_name, phone: v.phone || '' });
        setAvailable(v.is_available);
        setAddress({ street: '', area: v.area || '', city: v.city || 'Coimbatore', pincode: v.pincode || '' });
        setMyServices(sRes.data);

        // Load all services for this vendor's category
        if (v.category_id) {
          const asRes = await axios.get(`${API}/vendors/allservices/${v.category_id}`, { headers });
          setAllServices(asRes.data);
        }
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    load();
  }, []);

  const saveProfile = async () => {
    try {
      await axios.put(`${API}/vendors/profile`, profile, { headers });
      setProfileMsg('✅ Profile updated successfully!');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err) {
      setProfileMsg('❌ Update failed: ' + err.response?.data?.message);
    }
  };

  const saveAddress = async () => {
    try {
      await axios.put(`${API}/vendors/address`, address, { headers });
      setAddressMsg('✅ Address updated successfully!');
      setTimeout(() => setAddressMsg(''), 3000);
    } catch (err) {
      setAddressMsg('❌ Update failed: ' + err.response?.data?.message);
    }
  };

  const toggleAvailability = async () => {
    const newVal = available === 1 ? 0 : 1;
    await axios.put(`${API}/vendors/availability`, { is_available: newVal }, { headers });
    setAvailable(newVal);
  };

  const addService = async () => {
    if (!selectedSvc) return setServiceMsg('❌ Please select a service!');
    try {
      await axios.post(`${API}/vendors/service`,
        { service_id: parseInt(selectedSvc), custom_price: customPrice || null },
        { headers }
      );
      const added = allServices.find(s => s.service_id === parseInt(selectedSvc));
      setMyServices(prev => [...prev, { ...added, custom_price: customPrice, final_price: customPrice || added.base_price }]);
      setSelectedSvc('');
      setCustomPrice('');
      setServiceMsg('✅ Service added successfully!');
      setTimeout(() => setServiceMsg(''), 3000);
    } catch (err) {
      setServiceMsg('❌ ' + (err.response?.data?.message || 'Failed to add service'));
      setTimeout(() => setServiceMsg(''), 3000);
    }
  };

  const removeService = async (service_id) => {
    if (!window.confirm('Remove this service?')) return;
    try {
      await axios.delete(`${API}/vendors/service/${service_id}`, { headers });
      setMyServices(prev => prev.filter(s => s.service_id !== service_id));
      setServiceMsg('✅ Service removed!');
      setTimeout(() => setServiceMsg(''), 3000);
    } catch (err) {
      setServiceMsg('❌ Failed to remove service');
    }
  };

  const availableToAdd = allServices.filter(
    s => !myServices.find(ms => ms.service_id === s.service_id)
  );

  const S = {
    page:     { padding: '28px 20px', maxWidth: 700, margin: '0 auto', fontFamily: 'sans-serif' },
    title:    { fontSize: 22, fontWeight: 800, color: '#1e64b4', marginBottom: 24 },
    section:  { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px #0001', marginBottom: 20 },
    secTitle: { fontSize: 16, fontWeight: 700, color: '#1e64b4', marginBottom: 16 },
    label:    { display: 'block', fontSize: 13, fontWeight: 600, color: '#1f2937', marginBottom: 4 },
    input:    { width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', marginBottom: 14 },
    saveBtn:  { background: '#1e64b4', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' },
    success:  { color: '#16a34a', fontSize: 13, marginTop: 8 },
    error:    { color: '#dc2626', fontSize: 13, marginTop: 8 },
    availOn:  { background: '#16a34a', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' },
    availOff: { background: '#dc2626', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' },
    svcCard:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f9fafb', borderRadius: 10, marginBottom: 8, border: '1.5px solid #e5e7eb' },
    removeBtn:{ background: 'transparent', color: '#dc2626', border: '1.5px solid #dc2626', padding: '4px 12px', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' },
    addRow:   { display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 12 },
    select:   { flex: 2, padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, background: '#fff' },
    priceInput:{ flex: 1, padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, minWidth: 100 },
    addBtn:   { background: '#16a34a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  };

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#6b7280', fontFamily: 'sans-serif' }}>
      Loading...
    </div>
  );

  return (
    <div style={S.page}>
      <h2 style={S.title}>👤 My Profile</h2>

      {/* Profile */}
      <div style={S.section}>
        <div style={S.secTitle}>✏️ Personal Details</div>
        <label style={S.label}>Full Name</label>
        <input style={S.input} value={profile.full_name}
          onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
          placeholder="Your full name" />
        <label style={S.label}>Phone</label>
        <input style={S.input} value={profile.phone}
          onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
          placeholder="98XXXXXXXX" />
        <button style={S.saveBtn} onClick={saveProfile}>Save Profile</button>
        {profileMsg && <div style={profileMsg.includes('❌') ? S.error : S.success}>{profileMsg}</div>}
      </div>

      {/* Address */}
      <div style={S.section}>
        <div style={S.secTitle}>📍 Service Area</div>
        <label style={S.label}>Street</label>
        <input style={S.input} value={address.street}
          onChange={e => setAddress(p => ({ ...p, street: e.target.value }))}
          placeholder="Street name" />
        <label style={S.label}>Area</label>
        <input style={S.input} value={address.area}
          onChange={e => setAddress(p => ({ ...p, area: e.target.value }))}
          placeholder="e.g. Peelamedu" />
        <label style={S.label}>City</label>
        <input style={S.input} value={address.city}
          onChange={e => setAddress(p => ({ ...p, city: e.target.value }))} />
        <label style={S.label}>Pincode</label>
        <input style={S.input} value={address.pincode}
          onChange={e => setAddress(p => ({ ...p, pincode: e.target.value }))}
          placeholder="641XXX" />
        <button style={S.saveBtn} onClick={saveAddress}>Save Address</button>
        {addressMsg && <div style={addressMsg.includes('❌') ? S.error : S.success}>{addressMsg}</div>}
      </div>

      {/* Availability */}
      <div style={S.section}>
        <div style={S.secTitle}>🟢 Availability</div>
        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 14 }}>
          {available === 1
            ? '✅ You are available. Customers can book you.'
            : '🔴 You are busy. New bookings are blocked.'}
        </p>
        <button style={available === 1 ? S.availOn : S.availOff} onClick={toggleAvailability}>
          {available === 1 ? '✅ Available — Click to go Busy' : '🔴 Busy — Click to go Available'}
        </button>
      </div>

      {/* My Services */}
      <div style={S.section}>
        <div style={S.secTitle}>🔧 My Services</div>

        {/* Add service */}
        {availableToAdd.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Add a new service:</label>
            <div style={S.addRow}>
              <select style={S.select} value={selectedSvc}
                onChange={e => setSelectedSvc(e.target.value)}>
                <option value="">-- Select service --</option>
                {availableToAdd.map(s => (
                  <option key={s.service_id} value={s.service_id}>
                    {s.service_name} (Base: ₹{s.base_price})
                  </option>
                ))}
              </select>
              <input style={S.priceInput} type="number" value={customPrice}
                onChange={e => setCustomPrice(e.target.value)}
                placeholder="Custom price (optional)" />
              <button style={S.addBtn} onClick={addService}>+ Add</button>
            </div>
            {serviceMsg && (
              <div style={serviceMsg.includes('❌') ? S.error : S.success}>{serviceMsg}</div>
            )}
          </div>
        )}

        {/* Services list */}
        {myServices.length === 0
          ? <p style={{ color: '#6b7280', fontSize: 13 }}>No services listed yet. Add one above!</p>
          : myServices.map(s => (
            <div key={s.service_id} style={S.svcCard}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1f2937' }}>
                  {s.service_name}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  ⏱ {s.duration_mins} mins
                  {s.custom_price && ` | Base: ₹${s.base_price}`}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontWeight: 700, color: '#16a34a', fontSize: 15 }}>
                  ₹{s.final_price || s.custom_price || s.base_price}
                </div>
                <button style={S.removeBtn}
                  onClick={() => removeService(s.service_id)}>
                  Remove
                </button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}