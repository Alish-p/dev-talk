const jwt = require('jsonwebtoken');
const jwtSecret = require('config').get('jwtSecret');

const auth = (req, res, next) => {
  // Getting token from header
  const token = req.header('x-auth-token');

  //checking if token exist
  if (!token)
    return res
      .status(401)
      .json({ msg: 'Authentication failed, Token required' });

  // varifying the token
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ msg: 'Token Invalid' });
  }
};

module.exports = auth;
