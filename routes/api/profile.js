const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const request = require('request');
const config = require('config');

// Import Models
const User = require('../../models/User');
const Profile = require('../../models/Profile');

// @route   GET api/profile
// @desc    Get all profiles
// @access  public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    return res.json(profiles);
  } catch (err) {
    console.error('Error in getting all profiles');
    console.error(err.message);
    return res.status(500).send('Internal Server Error');
  }
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user_id
// @access  public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar']);
    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }
    return res.json(profile);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Profile not found' });
    }
    console.error('Error in getting all profiles');
    console.error(err.message);
    return res.status(500).send('Internal Server Error');
  }
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
      if (await Profile.exists({ user: userId })) {
        profile = await Profile.findOneAndUpdate(
          { user: userId },
          { $set: profileFields },
          { new: true }
        );

        // CBM doesn't work - code below is written by me and it is incorrect. We need to update complete profile and not just some fields of the profile. So we use findOneAndUpdate instead of profile.save()
        // console.log('already exists');
        // console.log(profileFields);

        // profile.profileFields = profileFields;
        // console.log('changed is');
        // console.log(profileFields);
        // profile = await profile.save();
        // console.log(profile);
      } else {
        profile = await Profile.create(profileFields);
      }
      return res.json(profile);
    } catch (err) {
      console.error('error in creating profile');
      console.error(err.message);
      return res.status(500).json({ msg: 'Internal Server Error' });
    }
  }
);

// @route POST /api/profile/experience
// @desc Add experience
// @access Private
router.post(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('company', 'Company is required').not().isEmpty(),
      check('from', 'From Date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { title, company, location, from, to, current, description } =
      req.body;

    const newExperience = {
      title,
      company,
      from,
    };

    if (location) {
      newExperience.location = location;
    }

    if (to) {
      newExperience.to = to;
    }

    if (current) {
      newExperience.current = current;
    }

    if (description) {
      newExperience.description = description;
    }

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExperience);
      await profile.save();
      return res.json(profile);
    } catch (error) {
      console.error('error in adding new experience');
      console.error(error.message);
      return res.status(500).send('Internal Server Error');
    }
  }
);

// @route POST /api/profile/experience/:exp_id
// @desc Delete experience
// @access Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    const removeIndex = profile.experience
      .map((expItem) => expItem.id)
      .indexOf(req.params.exp_id);
    profile.experience.splice(removeIndex, 1);
    await profile.save();
    return res.json(profile);
  } catch (error) {
    console.error('error in deleting experience');
    console.error(error.message);
    return res.status(500).send('Internal Server Error');
  }
});

// @route POST /api/profile/education
// @desc Add education
// @access Private
router.post(
  '/education',
  [
    auth,
    [
      check('school', 'School is required').not().isEmpty(),
      check('degree', 'Degree is required').not().isEmpty(),
      check('from', 'From Date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { school, degree, fieldOfStudy, from, to, current, description } =
      req.body;

    const newEducation = {
      school,
      degree,
      from,
    };

    if (fieldOfStudy) {
      newEducation.fieldOfStudy = fieldOfStudy;
    }

    if (to) {
      newEducation.to = to;
    }

    if (current) {
      newEducation.current = current;
    }

    if (description) {
      newEducation.description = description;
    }

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEducation);
      await profile.save();
      return res.json(profile);
    } catch (error) {
      console.error('error in adding new education');
      console.error(error.message);
      return res.status(500).send('Internal Server Error');
    }
  }
);

// @route POST /api/profile/education/:edu_id
// @desc Delete education
// @access Private
router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    const removeIndex = profile.education
      .map((eduItem) => eduItem.id)
      .indexOf(req.params.edu_id);
    profile.education.splice(removeIndex, 1);
    await profile.save();
    return res.json(profile);
  } catch (error) {
    console.error('error in deleting education');
    console.error(error.message);
    return res.status(500).send('Internal Server Error');
  }
});

// @route GET /api/profile/github/:username
// @desc Get user repos from Github
// @access Public
router.get('/github/:username', async (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        'githubClientId'
      )}&client_secret=${config.get('githubSecret')}`,
      method: 'GET',
      headers: {
        'user-agent': 'node.js',
      },
    };
    request(options, (error, response, body) => {
      if (error) {
        console.error(error);
      }
      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: 'No github profile found' });
      }
      return res.json(JSON.parse(body));
    });
  } catch (error) {
    console.error('error in getting github repos');
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
