const { getConnection } = require('../config/db');

// Submit a review
exports.submitReview = async (req, res) => {
  const { vendor_id, booking_id, rating, review_comment } = req.body;
  const user_id = req.user.id;
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `INSERT INTO REVIEWS
       (USER_ID, VENDOR_ID, BOOKING_ID, RATING, REVIEW_COMMENT)
       VALUES (:1, :2, :3, :4, :5)`,
      [user_id, vendor_id, booking_id, rating, review_comment],
      { autoCommit: true }
    );
    // trg_update_vendor_rating fires automatically here!
    res.status(201).json({ message: 'Review submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

// Get reviews for a vendor
exports.getVendorReviews = async (req, res) => {
  const { vendor_id } = req.params;
  console.log("entered");
  
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT U.FULL_NAME, R.RATING,
              R.REVIEW_COMMENT, R.CREATED_AT
       FROM   REVIEWS R
       JOIN   USERS   U ON R.USER_ID = U.USER_ID
       WHERE  R.VENDOR_ID = :1
       ORDER BY R.CREATED_AT DESC`,
      [vendor_id]
    );
    const reviews = result.rows.map(row => ({
      customer_name:   row[0],
      rating:          row[1],
      review_comment:  row[2],
      created_at:      row[3]
    }));
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};

exports.getUserReviews = async (req, res) => {
  const user_id = req.user.id;
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT BOOKING_ID FROM REVIEWS WHERE USER_ID = :1`,
      [user_id]
    );
    const reviews = result.rows.map(row => ({ booking_id: row[0] }));
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    if (conn) await conn.close();
  }
};