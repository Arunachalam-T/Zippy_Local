import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Login              from './pages/Login';
import Register           from './pages/Register';
import VendorSearch       from './pages/VendorSearch';
import BookService        from './pages/BookService';
import MyBookings         from './pages/MyBookings';
import AdminDashboard     from './pages/AdminDashboard';
import VendorDashboard    from './pages/vendor/VendorDashboard';
import VendorBookings     from './pages/vendor/VendorBookings';
import VendorEarnings     from './pages/vendor/VendorEarnings';
import VendorReviews      from './pages/vendor/VendorReviews';
import VendorProfile      from './pages/vendor/VendorProfile';
import Navbar             from './components/Navbar';

function Layout() {
  const location = useLocation();
  const token    = localStorage.getItem('token');
  const hideNav  = ['/', '/register'].includes(location.pathname);

  return (
    <>
      {token && !hideNav && <Navbar />}
      <Routes>
        <Route path="/"                   element={<Login />} />
        <Route path="/register"           element={<Register />} />
        <Route path="/vendors"            element={<VendorSearch />} />
        <Route path="/book/:vendor_id"    element={<BookService />} />
        <Route path="/bookings"           element={<MyBookings />} />
        <Route path="/admin"              element={<AdminDashboard />} />
        <Route path="/vendor/dashboard"   element={<VendorDashboard />} />
        <Route path="/vendor/bookings"    element={<VendorBookings />} />
        <Route path="/vendor/earnings"    element={<VendorEarnings />} />
        <Route path="/vendor/reviews"     element={<VendorReviews />} />
        <Route path="/vendor/profile"     element={<VendorProfile />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}