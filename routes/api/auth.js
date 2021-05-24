const express = require('express');
const auth = require('../../middlewares/auth');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtSecret = require('config').get('jwtSecret');
const router = express.Router();

// Get Auth User
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.send(user);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Server Error');
  }
});

/*
    @route    POST api/v1/auth
    @desc     to login a user
    @access   public
*/
router.post(
  '/',
  [
    check('email', 'Please provide a valid email').isEmail(),
    check('password', 'Password length should be minimum 6').exists(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let { password, email } = req.body;

      // see if user exists
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ errors: [{ msg: 'Wrong Credentials' }] });
      }

      // Checking password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ errors: [{ msg: 'Wrong Credentials' }] });
      }

      // return jwt
      const payload = {
        id: user.id,
      };

      const token = jwt.sign(payload, jwtSecret, { expiresIn: 360000 });
      res.status(200).json({
        success: true,
        token,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ errors: [{ msg: 'Something went wrong' }] });
    }
  }
);
module.exports = router;
