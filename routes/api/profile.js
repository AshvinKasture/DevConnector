const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

// Import Models
const User = require('../../models/User');
const Profile = require('../../models/Profile');

// @route   GET api/profile
// @desc    Get all profiles
// @access  public
router.get('/', async (req, res) => {
  const user = await Profile.find();
  return res.json(user);
});

// @route   GET api/profile/me
// @desc    Get current user's profile
// @access  private
router.get('/me', auth, async (req, res) => {
  try {
    // const profile2 = await Profile.findOne({ user: req.user.id });
    // return res.json(profile2);
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      'user',
      ['name', 'avatar']
    );
    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }
    return res.json(profile);
  } catch (err) {
    console.error('Error in getiing current user');
    console.error(err);
    return res.status(500).json({ msg: 'Internal Server Error' });
  }
});

// @route   POST api/profile
// @desc    Create or update user profile
// @access  private
router.post(
  '/',
  [auth, [check('status', 'Status is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      company,
      website,
      location,
      bio,
      status,
      githubUsername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    const profileFields = {
      user: req.user.id,
      status: status,
    };

    if (company) {
      profileFields.company = company;
    }

    if (website) {
      profileFields.website = website;
    }
    if (location) {
      profileFields.location = location;
    }
    if (bio) {
      profileFields.bio = bio;
    }
    if (githubUsername) {
      profileFields.githubUsername = githubUsername;
    }

    if (skills) {
      profileFields.skills = skills.split(',').map((skillItem) => {
        return skillItem.trim();
      });
    }

    const socialFields = {};

    if (youtube) {
      socialFields.youtube = youtube;
    }
    if (facebook) {
      socialFields.facebook = facebook;
    }
    if (twitter) {
      socialFields.twitter = twitter;
    }
    if (instagram) {
      socialFields.instagram = instagram;
    }
    if (linkedin) {
      socialFields.linkedin = linkedin;
    }

    if (Object.keys(socialFields).length !== 0) {
      profileFields.social = socialFields;
    }

    const userId = req.user.id;

    try {
      let profile = await Profile.findOne({ user: userId });
      if (!profile) {
        profile = new Profile(profileFields);
        await profile.save();
      } else {
        profile = await Profile.findOneAndUpdate(
          { user: userId },
          { $set: profileFields },
          { new: true }
        );
      }
      return res.json(profile);
    } catch (err) {
      console.error('error in creating profile');
      console.error(err.message);
      return res.status(500).json({ msg: 'Internal Server Error' });
    }

    res.send('Testing this endpoint');
  }
);

module.exports = router;
