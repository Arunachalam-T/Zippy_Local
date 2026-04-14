const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/vendors',  require('./routes/vendors'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/reviews',  require('./routes/reviews'));
app.use('/api/admin',    require('./routes/admin'));

app.get('/', (req, res) => {
  res.json({ message: 'ZippyLocal API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`ZippyLocal server running on port ${PORT}`);
});