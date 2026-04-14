const { getConnection } = require('../config/db');

// Get all categories
exports.getCategories = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT CATEGORY_ID, CATEGORY_NAME, DESCRIPTION
       FROM SERVICE_CATEGORIES ORDER BY CATEGORY_NAME`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

// Search vendors by category and area (calls SP1)
exports.searchVendors = async (req, res) => {
  const { category, area } = req.query;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT V.VENDOR_ID, V.FULL_NAME, V.PHONE, V.RATING,
              SC.CATEGORY_NAME, A.AREA, A.CITY
       FROM   VENDORS V
       JOIN   SERVICE_CATEGORIES SC ON V.CATEGORY_ID  = SC.CATEGORY_ID
       LEFT JOIN ADDRESSES        A  ON A.OWNER_ID    = V.VENDOR_ID
                                    AND A.OWNER_TYPE  = 'VENDOR'
       WHERE  V.IS_AVAILABLE = 1
         AND  UPPER(SC.CATEGORY_NAME) LIKE UPPER('%' || :1 || '%')
         AND  UPPER(A.AREA)           LIKE UPPER('%' || :2 || '%')
       ORDER BY V.RATING DESC`,
      [category || '', area || '']
    );
    const vendors = result.rows.map(row => ({
      vendor_id:     row[0],
      full_name:     row[1],
      phone:         row[2],
      rating:        row[3],
      category_name: row[4],
      area:          row[5],
      city:          row[6]
    }));
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

// Get vendor profile
exports.getVendorProfile = async (req, res) => {
  const { vendor_id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT V.VENDOR_ID, V.FULL_NAME, V.PHONE, V.RATING,
              V.IS_AVAILABLE, SC.CATEGORY_NAME,
              A.AREA, A.CITY, A.PINCODE
       FROM   VENDORS V
       JOIN   SERVICE_CATEGORIES SC ON V.CATEGORY_ID = SC.CATEGORY_ID
       LEFT JOIN ADDRESSES        A  ON A.OWNER_ID   = V.VENDOR_ID
                                    AND A.OWNER_TYPE = 'VENDOR'
       WHERE  V.VENDOR_ID = :1`,
      [vendor_id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Vendor not found' });

    const row = result.rows[0];
    res.json({
      vendor_id:     row[0],
      full_name:     row[1],
      phone:         row[2],
      rating:        row[3],
      is_available:  row[4],
      category_name: row[5],
      area:          row[6],
      city:          row[7],
      pincode:       row[8]
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

// Get services offered by a vendor
exports.getVendorServices = async (req, res) => {
  const { vendor_id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT S.SERVICE_ID, S.SERVICE_NAME,
              S.BASE_PRICE, VS.CUSTOM_PRICE,
              COALESCE(VS.CUSTOM_PRICE, S.BASE_PRICE) AS FINAL_PRICE,
              S.DURATION_MINS
       FROM   VENDOR_SERVICE VS
       JOIN   SERVICES       S ON VS.SERVICE_ID = S.SERVICE_ID
       WHERE  VS.VENDOR_ID = :1`,
      [vendor_id]
    );
    const services = result.rows.map(row => ({
      service_id:    row[0],
      service_name:  row[1],
      base_price:    row[2],
      custom_price:  row[3],
      final_price:   row[4],
      duration_mins: row[5]
    }));
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

// Get top vendors per category (calls SP3)
exports.topVendors = async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT SC.CATEGORY_NAME, V.VENDOR_ID,
              V.FULL_NAME, V.RATING, V.PHONE,
              RANK() OVER (
                PARTITION BY SC.CATEGORY_ID
                ORDER BY V.RATING DESC
              ) AS RANK_IN_CATEGORY
       FROM   VENDORS            V
       JOIN   SERVICE_CATEGORIES SC ON V.CATEGORY_ID = SC.CATEGORY_ID
       WHERE  V.IS_AVAILABLE = 1
       ORDER BY SC.CATEGORY_NAME, RANK_IN_CATEGORY`
    );
    const vendors = result.rows.map(row => ({
      category_name:     row[0],
      vendor_id:         row[1],
      full_name:         row[2],
      rating:            row[3],
      phone:             row[4],
      rank_in_category:  row[5]
    }));
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

// Toggle vendor availability
exports.toggleAvailability = async (req, res) => {
  const { is_available } = req.body;
  const vendor_id = req.user.id;
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `UPDATE VENDORS SET IS_AVAILABLE = :1 WHERE VENDOR_ID = :2`,
      [is_available, vendor_id],
      { autoCommit: true }
    );
    res.json({ message: 'Availability updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

// Update vendor profile
exports.updateProfile = async (req, res) => {
  const { full_name, phone } = req.body;
  const vendor_id = req.user.id;
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `UPDATE VENDORS SET FULL_NAME = :1, PHONE = :2
       WHERE VENDOR_ID = :3`,
      [full_name, phone, vendor_id],
      { autoCommit: true }
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};
exports.updateVendorAddress = async (req, res) => {
  const { street, area, city, pincode } = req.body;
  const vendor_id = req.user.id;
  let conn;
  try {
    conn = await getConnection();
    const check = await conn.execute(
      `SELECT ADDRESS_ID FROM ADDRESSES
       WHERE OWNER_ID = :1 AND OWNER_TYPE = 'VENDOR'`,
      [vendor_id]
    );
    if (check.rows.length > 0) {
      await conn.execute(
        `UPDATE ADDRESSES
         SET STREET = :1, AREA = :2, CITY = :3, PINCODE = :4
         WHERE OWNER_ID = :5 AND OWNER_TYPE = 'VENDOR'`,
        [street, area, city, pincode, vendor_id],
        { autoCommit: true }
      );
    } else {
      await conn.execute(
        `INSERT INTO ADDRESSES
         (OWNER_ID, OWNER_TYPE, STREET, AREA, CITY, PINCODE)
         VALUES (:1, 'VENDOR', :2, :3, :4, :5)`,
        [vendor_id, street, area, city, pincode],
        { autoCommit: true }
      );
    }
    res.json({ message: 'Address updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};
exports.getServicesByCategory = async (req, res) => {
  const { category_id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT SERVICE_ID, SERVICE_NAME, BASE_PRICE, DURATION_MINS
       FROM SERVICES WHERE CATEGORY_ID = :1 ORDER BY SERVICE_NAME`,
      [category_id]
    );
    const services = result.rows.map(row => ({
      service_id:    row[0],
      service_name:  row[1],
      base_price:    row[2],
      duration_mins: row[3]
    }));
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

exports.addVendorService = async (req, res) => {
  const { service_id, custom_price } = req.body;
  const vendor_id = req.user.id;
  let conn;
  try {
    conn = await getConnection();
    const check = await conn.execute(
      `SELECT VENDOR_ID FROM VENDOR_SERVICE
       WHERE VENDOR_ID = :1 AND SERVICE_ID = :2`,
      [vendor_id, service_id]
    );
    if (check.rows.length > 0)
      return res.status(400).json({ message: 'Service already added!' });
    await conn.execute(
      `INSERT INTO VENDOR_SERVICE (VENDOR_ID, SERVICE_ID, CUSTOM_PRICE)
       VALUES (:1, :2, :3)`,
      [vendor_id, service_id, custom_price || null],
      { autoCommit: true }
    );
    res.json({ message: 'Service added successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

exports.removeVendorService = async (req, res) => {
  const { service_id } = req.params;
  const vendor_id = req.user.id;
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `DELETE FROM VENDOR_SERVICE
       WHERE VENDOR_ID = :1 AND SERVICE_ID = :2`,
      [vendor_id, service_id],
      { autoCommit: true }
    );
    res.json({ message: 'Service removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};
exports.getVendorProfile = async (req, res) => {
  const { vendor_id } = req.params;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT V.VENDOR_ID, V.FULL_NAME, V.PHONE, V.RATING,
              V.IS_AVAILABLE, V.CATEGORY_ID,
              SC.CATEGORY_NAME,
              A.AREA, A.CITY, A.PINCODE
       FROM   VENDORS V
       JOIN   SERVICE_CATEGORIES SC ON V.CATEGORY_ID = SC.CATEGORY_ID
       LEFT JOIN ADDRESSES A ON A.OWNER_ID = V.VENDOR_ID
                             AND A.OWNER_TYPE = 'VENDOR'
       WHERE  V.VENDOR_ID = :1`,
      [vendor_id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Vendor not found' });
    const row = result.rows[0];
    res.json({
      vendor_id:     row[0],
      full_name:     row[1],
      phone:         row[2],
      rating:        row[3],
      is_available:  row[4],
      category_id:   row[5],
      category_name: row[6],
      area:          row[7],
      city:          row[8],
      pincode:       row[9]
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};