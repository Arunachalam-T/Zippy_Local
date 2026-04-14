import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const S = {
  nav:  { background: '#1e64b4', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px #0002' },
  logo: { fontSize: 20, fontWeight: 800, color: '#fff', padding: '14px 0', textDecoration: 'none' },
  links:{ display: 'flex', gap: 4 },
  link: (active) => ({ color: '#fff', textDecoration: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: active ? 700 : 500, fontSize: 14, background: active ? 'rgba(255,255,255,0.2)' : 'transparent' }),
  btn:  { background: 'transparent', color: '#fff', border: '2px solid #fff', padding: '6px 14px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  role: { color: '#c7dcf7', fontSize: 13 }
};

export default function Navbar() {
  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem('user') || 'null');
  const path     = window.location.pathname;

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <nav style={S.nav}>
      <Link to={user?.role === 'vendor' ? '/vendor/dashboard' : '/vendors'} style={S.logo}>
        ⚡ ZippyLocal
      </Link>

      <div style={S.links}>
        {/* Customer links */}
        {user?.role === 'user' && (
          <>
            <Link to="/vendors"   style={S.link(path === '/vendors')}>🔍 Find Vendors</Link>
            <Link to="/bookings"  style={S.link(path === '/bookings')}>📋 My Bookings</Link>
          </>
        )}

        {/* Vendor links */}
        {user?.role === 'vendor' && (
          <>
            <Link to="/vendor/dashboard" style={S.link(path === '/vendor/dashboard')}>📊 Dashboard</Link>
            <Link to="/vendor/bookings"  style={S.link(path === '/vendor/bookings')}>📋 Bookings</Link>
            <Link to="/vendor/earnings"  style={S.link(path === '/vendor/earnings')}>💰 Earnings</Link>
            <Link to="/vendor/reviews"   style={S.link(path === '/vendor/reviews')}>⭐ Reviews</Link>
            <Link to="/vendor/profile"   style={S.link(path === '/vendor/profile')}>👤 Profile</Link>
          </>
        )}

        {/* Admin links */}
        {user?.role === 'admin' && (
          <Link to="/admin" style={S.link(path === '/admin')}>🛡 Admin Panel</Link>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={S.role}>
          {user?.role === 'admin' ? '🛡 Admin' : user?.role === 'vendor' ? '🔧 Vendor' : '👤 User'}
        </span>
        <button style={S.btn} onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}