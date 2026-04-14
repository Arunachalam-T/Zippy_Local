const { getConnection } = require('../config/db');

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT
        (SELECT COUNT(*) FROM USERS)                               AS TOTAL_USERS,
        (SELECT COUNT(*) FROM VENDORS)                            AS TOTAL_VENDORS,
        (SELECT COUNT(*) FROM BOOKINGS)                           AS TOTAL_BOOKINGS,
        (SELECT COUNT(*) FROM BOOKINGS WHERE STATUS = 'PENDING')  AS PENDING,
        (SELECT COUNT(*) FROM BOOKINGS WHERE STATUS = 'DONE')     AS COMPLETED,
        (SELECT SUM(AMOUNT) FROM PAYMENTS WHERE STATUS = 'PAID')  AS TOTAL_REVENUE
       FROM DUAL`
    );
    const row = result.rows[0];
    res.json({
      total_users:     row[0],
      total_vendors:   row[1],
      total_bookings:  row[2],
      pending:         row[3],
      completed:       row[4],
      total_revenue:   row[5]
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

// Get all bookings
exports.getAllBookings = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT B.BOOKING_ID, B.STATUS, B.SCHEDULED_AT,
              B.TOTAL_AMOUNT, U.FULL_NAME AS CUSTOMER,
              V.FULL_NAME AS VENDOR, S.SERVICE_NAME,
              P.METHOD, P.STATUS AS PAYMENT_STATUS
       FROM   BOOKINGS           B
       JOIN   USERS              U  ON B.USER_ID    = U.USER_ID
       JOIN   VENDORS            V  ON B.VENDOR_ID  = V.VENDOR_ID
       JOIN   SERVICES           S  ON B.SERVICE_ID = S.SERVICE_ID
       LEFT JOIN PAYMENTS        P  ON P.BOOKING_ID = B.BOOKING_ID
       ORDER BY B.CREATED_AT DESC`
    );
    const bookings = result.rows.map(row => ({
      booking_id:      row[0],
      status:          row[1],
      scheduled_at:    row[2],
      total_amount:    row[3],
      customer:        row[4],
      vendor:          row[5],
      service_name:    row[6],
      payment_method:  row[7],
      payment_status:  row[8]
    }));
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT USER_ID, FULL_NAME, EMAIL, PHONE,
              fn_get_user_age(USER_ID) AS AGE, CREATED_AT
       FROM   USERS ORDER BY CREATED_AT DESC`
    );
    const users = result.rows.map(row => ({
      user_id:    row[0],
      full_name:  row[1],
      email:      row[2],
      phone:      row[3],
      age:        row[4],
      created_at: row[5]
    }));
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

// Get all vendors
exports.getAllVendors = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT V.VENDOR_ID, V.FULL_NAME, V.EMAIL,
              V.PHONE, V.RATING, V.IS_AVAILABLE,
              SC.CATEGORY_NAME, A.AREA
       FROM   VENDORS            V
       JOIN   SERVICE_CATEGORIES SC ON V.CATEGORY_ID = SC.CATEGORY_ID
       LEFT JOIN ADDRESSES       A  ON A.OWNER_ID    = V.VENDOR_ID
                                   AND A.OWNER_TYPE  = 'VENDOR'
       ORDER BY V.RATING DESC`
    );
    const vendors = result.rows.map(row => ({
      vendor_id:     row[0],
      full_name:     row[1],
      email:         row[2],
      phone:         row[3],
      rating:        row[4],
      is_available:  row[5],
      category_name: row[6],
      area:          row[7]
    }));
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

// Monthly revenue report (calls SP4)
exports.revenueReport = async (req, res) => {
  const { year } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT TO_CHAR(B.SCHEDULED_AT, 'Month') AS MONTH_NAME,
              EXTRACT(MONTH FROM B.SCHEDULED_AT) AS MONTH_NUM,
              COUNT(B.BOOKING_ID)               AS TOTAL_BOOKINGS,
              SUM(P.AMOUNT)                     AS TOTAL_REVENUE,
              COUNT(CASE WHEN B.STATUS='DONE'      THEN 1 END) AS COMPLETED,
              COUNT(CASE WHEN B.STATUS='CANCELLED' THEN 1 END) AS CANCELLED
       FROM   BOOKINGS B
       JOIN   PAYMENTS P ON P.BOOKING_ID = B.BOOKING_ID
       WHERE  EXTRACT(YEAR FROM B.SCHEDULED_AT) = :1
         AND  P.STATUS = 'PAID'
       GROUP BY TO_CHAR(B.SCHEDULED_AT,'Month'),
                EXTRACT(MONTH FROM B.SCHEDULED_AT)
       ORDER BY MONTH_NUM`,
      [year]
    );
    const report = result.rows.map(row => ({
      month_name:     row[0],
      month_num:      row[1],
      total_bookings: row[2],
      total_revenue:  row[3],
      completed:      row[4],
      cancelled:      row[5]
    }));
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  const { booking_id, status } = req.body;
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `UPDATE BOOKINGS SET STATUS = :1 WHERE BOOKING_ID = :2`,
      [status, booking_id],
      { autoCommit: true }
    );
    res.json({ message: `Booking updated to ${status}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `DELETE FROM USERS WHERE USER_ID = :1`,
      [id], { autoCommit: true }
    );
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

// Delete vendor
exports.deleteVendor = async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `DELETE FROM VENDORS WHERE VENDOR_ID = :1`,
      [id], { autoCommit: true }
    );
    res.json({ message: 'Vendor deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};