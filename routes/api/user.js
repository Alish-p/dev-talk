const express = require('express');
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const jwtSecret = require('config').get('jwtSecret');

const router = express.Router();

/*
    @route    POST api/v1/users
    @desc     to register a new user
    @access   public
*/
router.post(
  '/',
  [
    check('name', 'Name is required').notEmpty(),
    check('email', 'Please provide a valid email').isEmail(),
    check('password', 'Password length should be minimum 6').isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      let { name, password, email } = req.body;

      // see if user exists
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }

      // get avatar
      const avatar = gravatar.url(email, { s: '200', d: 'mm', r: 'pg' });

      // password hashing using bcrypt
      const salt = await bcrypt.genSalt(10);
      password = await bcrypt.hash(password, salt);

      user = await User.create({ name, email, password, avatar });

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
