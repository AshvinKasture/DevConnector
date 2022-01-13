const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const auth = require('../../middleware/auth');

// Bring in models
const User = require('../../models/User');
const Profile = require('../../models/Profile');

// @route   GET api/users
// @desc    Test route
// @access  public
router.get('/', (req, res) => {
  res.send('User Route');
});

// @route   POST api/users
// @desc    Register a user
// @access  public
router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please enter a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Check if user exists
      // CBM
      // let user = await User.findOne({ email });
      if (await User.exists({ email })) {
        return res.status(400).json({
          errors: [
            {
              msg: 'User already exists',
            },
          ],
        });
      }

      // Get user gravatar
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm',
      });

      // Encrypt password
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      // Generate user object from model and save

      // CBM
      // let user = new User({
      //   name,
      //   email,
      //   password: hashedPassword,
      //   avatar,
      // });
      // await user.save();

      let user = await User.create({
        name,
        email,
        password: hashedPassword,
        avatar,
      });

      // Return jsonwebtoken
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        {
          expiresIn: config.get('jwtExpire'),
        },
        (err, token) => {
          if (err) {
            throw err;
          }
          return res.json({ token });
        }
      );
    } catch (err) {
      console.error('Error in registering user');
      console.error(err.message);
      return res.status(500).send('Server error');
    }
  }
);

// @route   DELETE api/users
// @desc    Delete a user, profile and posts
// @access  Private
router.delete('/', auth, async (req, res) => {
  const user = req.user.id;
  try {
    await Profile.findOneAndDelete({ user });
    await User.findByIdAndDelete(user);
    // @todo Delete user posts
    return res.json({ msg: 'User and profile deleted' });
  } catch (error) {
    console.error('error in deleting user and profile');
    console.error(error.message);
    return res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
