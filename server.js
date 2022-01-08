console.clear();

const express = require('express');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('API Running');
});

// Route for users
app.use('/api/users', require('./routes/api/users'));

// Route for auth
app.use('/api/auth', require('./routes/api/auth'));

// Route for profile
app.use('/api/profile', require('./routes/api/profile'));

// Route for posts
app.use('/api/posts', require('./routes/api/posts'));

app.listen(PORT, () => {
  console.log(`Server has started on Port no: ${PORT}`);
});
