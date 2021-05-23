const express = require('express');
const connectDB = require('./config/db');

const app = express();

// Loading Route files
const user = require('./routes/api/user');
const auth = require('./routes/api/auth');
const profile = require('./routes/api/profile');
const post = require('./routes/api/post');

// Connecting to database
connectDB();

app.use(express.json());

// routes
app.use('/api/v1/users', user);
app.use('/api/v1/auth', auth);
app.use('/api/v1/profile', profile);
app.use('/api/v1/posts', post);

// Running app on port
const port = process.env.PORT || 5000;
app.listen(port, console.log(`Application running on port ${port}`));
