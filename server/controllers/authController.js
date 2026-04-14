const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { getConnection } = require('../config/db');
require('dotenv').config();

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ── Register User ────────────────────────────────────────────
exports.registerUser = async (req, res) => {
  const { full_name, email, password, phone, dob } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const hash = await bcrypt.hash(password, 10);
    await conn.execute(
      `INSERT INTO USERS (FULL_NAME, EMAIL, PASSWORD_HASH, PHONE, DOB)
       VALUES (:1, :2, :3, :4, TO_DATE(:5, 'YYYY-MM-DD'))`,
      [full_name, email, hash, phone, dob],
      { autoCommit: true }
    );
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

// ── Register Vendor ──────────────────────────────────────────
exports.registerVendor = async (req, res) => {
  const { full_name, email, password, phone, category_id } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const hash = await bcrypt.hash(password, 10);
    await conn.execute(
      `INSERT INTO VENDORS (FULL_NAME, EMAIL, PASSWORD_HASH, PHONE, CATEGORY_ID)
       VALUES (:1, :2, :3, :4, :5)`,
      [full_name, email, hash, phone, category_id],
      { autoCommit: true }
    );
    res.status(201).json({ message: 'Vendor registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

// ── Login User ───────────────────────────────────────────────
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT USER_ID, FULL_NAME, EMAIL, PASSWORD_HASH
       FROM USERS WHERE EMAIL = :1`,
      [email]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found' });

    const [user_id, full_name, user_email, hash] = result.rows[0];
    const match = await bcrypt.compare(password, hash);
    if (!match)
      return res.status(401).json({ message: 'Invalid password' });

    const token = generateToken(user_id, 'user');
    res.json({ token, user: { user_id, full_name, email: user_email, role: 'user' } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

// ── Login Vendor ─────────────────────────────────────────────
exports.loginVendor = async (req, res) => {
  const { email, password } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT VENDOR_ID, FULL_NAME, EMAIL, PASSWORD_HASH, IS_AVAILABLE, RATING
       FROM VENDORS WHERE EMAIL = :1`,
      [email]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Vendor not found' });

    const [vendor_id, full_name, vendor_email, hash, is_available, rating] = result.rows[0];
    const match = await bcrypt.compare(password, hash);
    if (!match)
      return res.status(401).json({ message: 'Invalid password' });
      
    const token = generateToken(vendor_id, 'vendor');
    console.log({ token, vendor: { vendor_id, full_name, email: vendor_email, is_available, rating, role: 'vendor' } })
    res.json({ token, vendor: { vendor_id, full_name, email: vendor_email, is_available, rating, role: 'vendor' } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

// ── Login Admin ──────────────────────────────────────────────
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT ADMIN_ID, FULL_NAME, EMAIL, PASSWORD_HASH
       FROM ADMINS WHERE EMAIL = :1`,
      [email]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Admin not found' });

    const [admin_id, full_name, admin_email, hash] = result.rows[0];
    const match = await bcrypt.compare(password, hash);
    if (!match)
      return res.status(401).json({ message: 'Invalid password' });

    const token = generateToken(admin_id, 'admin');
    res.json({ token, admin: { admin_id, full_name, email: admin_email, role: 'admin' } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};