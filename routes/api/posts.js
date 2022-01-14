const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const User = require('../../models/User');
const Post = require('../../models/Post');

// @route   GET api/posts
// @desc    Get all posts
// @access  public
router.get('/', async (req, res) => {
  try {
    return res.json(await Post.find().sort({ date: -1 }));
  } catch (error) {
    console.error('error in getting all posts');
    console.error(error.message);
    return res.status(500).send('Internal Server Error');
  }
});

// @route   GET api/posts/:post_id
// @desc    Get post by post_id
// @access  public
router.get('/:post_id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    return res.json(post);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    console.error('error in getting all posts');
    console.error(error.message);
    return res.status(500).send('Internal Server Error');
  }
});

// @route   POST api/posts
// @desc    Create post
// @access  Private
router.post(
  '/',
  [auth, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select('-password');
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });
      await newPost.save();

      return res.json(newPost);
    } catch (error) {
      console.error('error in creating new post');
      console.error(error.message);
      return res.status(500).send('Internal Server Error');
    }
  }
);

// @route DELETE /api/posts/:post_id
// @desc Delete a post by id
// @access Private
router.delete('/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(400).json({ msg: 'Post not found' });
    }
    if (post.user.toString() === req.user.id) {
      await port.delete();
      return rs.json({ msg: 'Post removed' });
    } else {
      return res.status(401).json({ msg: 'User not authorized' });
    }
  } catch (error) {
    if (RangeError.kind === 'ObjctId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    console.error('error in deleting post');
    console.error(error.message);
    return res.status(500).send('Internal Server Error');
  }
});

// @oute PUT /api/posts/like/:post_id
// @desc Like a post
// @access Private
// @todo
// router.put('/like/:post_id', auth, async (req, res)=>{
//   try {

//   } catch (error) {
//     console.error('error in likeing unliking a post')
//     console.error(ero.message);
//     etun
//   }
// })f

module.exports = router;
