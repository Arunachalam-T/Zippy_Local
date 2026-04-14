const { getConnection } = require('../config/db');

exports.saveAddress = async (req, res) => {
  const { street, area, city, pincode, latitude, longitude } = req.body;
  const user_id = req.user.id;
  let conn;
  try {
    conn = await getConnection();
    const check = await conn.execute(
      `SELECT ADDRESS_ID FROM ADDRESSES WHERE OWNER_ID = :1 AND OWNER_TYPE = 'USER'`,
      [user_id]
    );
    if (check.rows.length > 0) {
      await conn.execute(
        `UPDATE ADDRESSES SET STREET = :1, AREA = :2, CITY = :3,
         PINCODE = :4, LATITUDE = :5, LONGITUDE = :6
         WHERE OWNER_ID = :7 AND OWNER_TYPE = 'USER'`,
        [street, area, city, pincode, latitude, longitude, user_id],
        { autoCommit: true }
      );
      res.json({ message: 'Address updated successfully' });
    } else {
      await conn.execute(
        `INSERT INTO ADDRESSES (OWNER_ID, OWNER_TYPE, STREET, AREA, CITY, PINCODE, LATITUDE, LONGITUDE)
         VALUES (:1, 'USER', :2, :3, :4, :5, :6, :7)`,
        [user_id, street, area, city, pincode, latitude, longitude],
        { autoCommit: true }
      );
      res.json({ message: 'Address saved successfully' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

exports.getAddress = async (req, res) => {
  const user_id = req.user.id;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT STREET, AREA, CITY, PINCODE, LATITUDE, LONGITUDE
       FROM ADDRESSES WHERE OWNER_ID = :1 AND OWNER_TYPE = 'USER'`,
      [user_id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'No address found' });
    const row = result.rows[0];
    res.json({ street: row[0], area: row[1], city: row[2], pincode: row[3], latitude: row[4], longitude: row[5] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

exports.createBooking = async (req, res) => {
  const { vendor_id, service_id, scheduled_at, address, notes } = req.body;
  const user_id = req.user.id;
  let conn;
  try {
    conn = await getConnection();
    const priceResult = await conn.execute(
      `SELECT COALESCE(VS.CUSTOM_PRICE, S.BASE_PRICE)
       FROM VENDOR_SERVICE VS
       JOIN SERVICES S ON VS.SERVICE_ID = S.SERVICE_ID
       WHERE VS.VENDOR_ID = :1 AND VS.SERVICE_ID = :2`,
      [vendor_id, service_id]
    );
    if (priceResult.rows.length === 0)
      return res.status(404).json({ message: 'Service not found for this vendor' });
    const total_amount = priceResult.rows[0][0];
    await conn.execute(
      `INSERT INTO BOOKINGS (USER_ID, VENDOR_ID, SERVICE_ID, ADMIN_ID, STATUS,
       SCHEDULED_AT, ADDRESS, NOTES, TOTAL_AMOUNT)
       VALUES (:1, :2, :3, 1, 'PENDING',
       TO_TIMESTAMP(:4, 'YYYY-MM-DD HH24:MI:SS'), :5, :6, :7)`,
      [user_id, vendor_id, service_id, scheduled_at, address, notes, total_amount],
      { autoCommit: true }
    );
    const bookingResult = await conn.execute(
      `SELECT MAX(BOOKING_ID) FROM BOOKINGS WHERE USER_ID = :1`,
      [user_id]
    );
    const booking_id = bookingResult.rows[0][0];
    await conn.execute(
      `INSERT INTO PAYMENTS (BOOKING_ID, AMOUNT, METHOD, STATUS)
       VALUES (:1, :2, 'CASH', 'PENDING')`,
      [booking_id, total_amount],
      { autoCommit: true }
    );
    res.status(201).json({ message: 'Booking created successfully', booking_id, total_amount });
  } catch (err) {
    if (err.message.includes('20001'))
      return res.status(400).json({ message: 'Vendor is currently unavailable' });
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

exports.bookingHistory = async (req, res) => {
  const user_id = req.user.id;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT B.BOOKING_ID, B.STATUS, B.SCHEDULED_AT,
              B.ADDRESS, B.TOTAL_AMOUNT,
              V.FULL_NAME, V.VENDOR_ID,
              S.SERVICE_NAME,
              SC.CATEGORY_NAME,
              P.METHOD, P.STATUS
       FROM   BOOKINGS B
       JOIN   VENDORS V ON B.VENDOR_ID = V.VENDOR_ID
       JOIN   SERVICES S ON B.SERVICE_ID = S.SERVICE_ID
       JOIN   SERVICE_CATEGORIES SC ON S.CATEGORY_ID = SC.CATEGORY_ID
       LEFT JOIN PAYMENTS P ON P.BOOKING_ID = B.BOOKING_ID
       WHERE  B.USER_ID = :1
       ORDER BY B.CREATED_AT DESC`,
      [user_id]
    );
    const bookings = result.rows.map(row => ({
      booking_id:     row[0],
      status:         row[1],
      scheduled_at:   row[2],
      address:        row[3],
      total_amount:   row[4],
      vendor_name:    row[5],
      vendor_id:      row[6],
      service_name:   row[7],
      category_name:  row[8],
      payment_method: row[9],
      payment_status: row[10]
    }));
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

exports.vendorBookings = async (req, res) => {
  const vendor_id = req.user.id;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT B.BOOKING_ID, B.STATUS, B.SCHEDULED_AT,
              B.ADDRESS, B.TOTAL_AMOUNT, B.NOTES,
              U.FULL_NAME, U.PHONE,
              S.SERVICE_NAME,
              P.METHOD, P.STATUS
       FROM   BOOKINGS B
       JOIN   USERS U ON B.USER_ID = U.USER_ID
       JOIN   SERVICES S ON B.SERVICE_ID = S.SERVICE_ID
       LEFT JOIN PAYMENTS P ON P.BOOKING_ID = B.BOOKING_ID
       WHERE  B.VENDOR_ID = :1
       ORDER BY B.SCHEDULED_AT DESC`,
      [vendor_id]
    );
    const bookings = result.rows.map(row => ({
      booking_id:     row[0],
      status:         row[1],
      scheduled_at:   row[2],
      address:        row[3],
      total_amount:   row[4],
      notes:          row[5],
      customer_name:  row[6],
      customer_phone: row[7],
      service_name:   row[8],
      payment_method: row[9],
      payment_status: row[10]
    }));
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

exports.updateStatus = async (req, res) => {
  const { booking_id, status } = req.body;
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `UPDATE BOOKINGS SET STATUS = :1 WHERE BOOKING_ID = :2`,
      [status, booking_id],
      { autoCommit: true }
    );
    res.json({ message: `Booking status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

exports.cancelBooking = async (req, res) => {
  const { booking_id } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const check = await conn.execute(
      `SELECT STATUS, VENDOR_ID FROM BOOKINGS WHERE BOOKING_ID = :1`,
      [booking_id]
    );
    if (check.rows.length === 0)
      return res.status(404).json({ message: 'Booking not found' });
    const [status, vendor_id] = check.rows[0];
    if (['DONE', 'CANCELLED'].includes(status))
      return res.status(400).json({ message: `Cannot cancel: booking is already ${status}` });
    await conn.execute(
      `UPDATE BOOKINGS SET STATUS = 'CANCELLED' WHERE BOOKING_ID = :1`,
      [booking_id], { autoCommit: true }
    );
    await conn.execute(
      `UPDATE PAYMENTS SET STATUS = 'FAILED' WHERE BOOKING_ID = :1 AND STATUS = 'PENDING'`,
      [booking_id], { autoCommit: true }
    );
    await conn.execute(
      `UPDATE VENDORS SET IS_AVAILABLE = 1 WHERE VENDOR_ID = :1`,
      [vendor_id], { autoCommit: true }
    );
    res.json({ message: `Booking #${booking_id} cancelled successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

exports.updatePayment = async (req, res) => {
  const { booking_id, method } = req.body;
  let conn;
  try {
    conn = await getConnection();
    const check = await conn.execute(
      `SELECT PAYMENT_ID FROM PAYMENTS WHERE BOOKING_ID = :1`,
      [booking_id]
    );
    if (check.rows.length === 0) {
      await conn.execute(
        `INSERT INTO PAYMENTS (BOOKING_ID, AMOUNT, METHOD, STATUS, PAID_AT)
         SELECT :1, TOTAL_AMOUNT, :2, 'PAID', CURRENT_TIMESTAMP
         FROM BOOKINGS WHERE BOOKING_ID = :3`,
        [booking_id, method, booking_id],
        { autoCommit: true }
      );
    } else {
      await conn.execute(
        `UPDATE PAYMENTS
         SET METHOD = :1, STATUS = 'PAID', PAID_AT = CURRENT_TIMESTAMP
         WHERE BOOKING_ID = :2`,
        [method, booking_id],
        { autoCommit: true }
      );
    }
    res.json({ message: 'Payment updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};