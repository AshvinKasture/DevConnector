const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const config = require('config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../../models/User');
const { JsonWebTokenError } = require('jsonwebtoken');

// @route   GET api/auth
// @desc    Get user profile
// @access  private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.err('Error in getting users data in auth');
    console.err(err);
    res.status(500).json({ msg: 'Internal Server Error' });
  }
});

// @route   POST api/auth
// @desc    Authenticate user and get token for user
// @access  public
router.post(
  '/',
  [
    check('email', 'Email is required').isEmail(),
    check('password', 'Please is required').exists(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ rrors: errors.array() });
      }
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({
          errors: [
            {
              msg: 'Invalid credentials',
            },
          ],
        });
      }

      // Check password

      if (!bcrypt.compareSync(password, user.password)) {
        return res.status(400).json({ msg: 'Invalid user credentials' });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        {
          expiresIn: 36000000,
        },
        (err, token) => {
          if (err) {
            throw err;
          }
          return res.json({ token });
        }
      );
    } catch (err) {
      console.error('Error in authenticating user');
      console.error(err.message);
      return res.status(500).json({ msg: 'Internal Server Error' });
    }
  }
);

module.exports = router;
