const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const User = require('../../models/User');
const Post = require('../../models/Post');

// @route   GET api/posts
// @desc    Test route
// @access  public
router.get('/', (req, res) => {
  res.send('Posts Route');
});

// @route   POST api/posts
// @desc    Create post
// @access  Private
router.post(
  '/',
  [auth, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpry()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
    } catch (error) {
      console.error('error in creating new post');
      console.error(error.message);
      return res.status(500).send('Internal Server Error');
    }
    const user = await User.FindById(req.user.id).select('-password');
    const newPost = {
      text: req.body.text,
      name: user.name,
      avatar: user.avatar,
      user: req.user.id,
    };
    await newPost.save();

    return res.json(newPost);

    res.send('Posts Route');
  }
);

module.exports = router;
