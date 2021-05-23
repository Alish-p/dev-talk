const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.json({ success: true });
});

// Running app on port
const port = process.env.PORT || 5000;
app.listen(port, console.log(`Application running on port ${port}`));
