const express = require('express');
const { check, validationResult } = require('express-validator');
const axios = require('axios');
const router = express.Router();
const auth = require('../../middlewares/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const config = require('config');

// Get Current user's profile
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      'user',
      ['name', 'avatar']
    );

    if (!profile)
      return res
        .status(400)
        .json({ msg: 'There is no profile available for this user' });

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    return res.status(500).json({ msg: 'Server Error' });
  }
});

// Create or Update profile
router.post(
  '/',
  [
    auth,
    [
      check('status', 'please provide Status ').notEmpty(),
      check('skills', 'please provide Skills ').notEmpty(),
    ],
  ],
  async (req, res) => {
    try {
      // if any validation error
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ err: errors });
      }

      const profileFields = {};

      const {
        status,
        skills,
        website,
        location,
        company,
        bio,
        githubusername,
        youtube,
        twitter,
        facebook,
        linkedin,
        instagram,
      } = req.body;

      // Poppulating fields
      profileFields.status = status;
      profileFields.user = req.user.id;

      if (company) profileFields.company = company;
      if (website) profileFields.website = website;
      if (location) profileFields.location = location;
      if (bio) profileFields.bio = bio;
      if (githubusername) profileFields.githubusername = githubusername;

      profileFields.social = {};

      if (youtube) profileFields.social.youtube = youtube;
      if (twitter) profileFields.social.twitter = twitter;
      if (facebook) profileFields.social.facebook = facebook;
      if (linkedin) profileFields.social.linkedin = linkedin;
      if (instagram) profileFields.social.instagram = instagram;

      if (skills) {
        profileFields.skills = skills.split(',').map((skill) => skill.trim());
      }

      const profile = await Profile.findOne({ user: req.user.id });
      // check wheather profile is already exists
      // then update

      console.log(profileFields);
      if (profile) {
        const updatedProfile = await Profile.findByIdAndUpdate(
          profile.id,
          profileFields,
          { new: true }
        );
        res.status(200).json({ success: true, data: updatedProfile });
      } else {
        // create new
        const profile = await Profile.create(profileFields);
        res.status(200).json({ success: true, data: profile });
      }

      // send the profile in status
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ success: false, msg: 'Something went wrong' });
    }
  }
);

// Get all profiles
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res
      .status(200)
      .json({ success: true, count: profiles.length, data: profiles });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, err: 'Something went wrong' });
  }
});

// get profile by user id
router.get('/:id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.id }).populate(
      'user',
      ['name', 'avatar']
    );

    // if no profile
    if (!profile) {
      return res
        .status(400)
        .json({ success: false, err: 'No Profile for given user' });
    }

    // if profile
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.log(error);

    res.status(500).json({ success: false, err: 'Something went wrong' });
  }
});

// delete profile,user and posts
router.delete('/', auth, async (req, res) => {
  try {
    //find profile
    await Profile.findOneAndDelete({ user: req.user.id });
    await User.findByIdAndRemove(req.user.id);

    res.status(200).json({ msg: 'Profile deleted' });
    // find user
  } catch (error) {
    res.status(500).json({ msg: 'Something went wrong' });
  }
});

// adding experiance field
router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Please Provide title').exists(),
      check('company', 'Please Provide company').exists(),
      check('from', 'Please Provide valid from date').exists(),
    ],
  ],
  async (req, res) => {
    try {
      // Validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          msg: errors.array(),
        });
      }

      // find profile
      const profile = await Profile.findOne({ user: req.user.id });

      if (!profile) {
        return res.status(400).json({
          success: false,
          msg: 'profile does not exist for this user',
        });
      }

      // poppulating experiance field
      const { title, company, location, from, to, current, description } =
        req.body;
      const experience = { title, company, from };

      if (location) experience.location = location;
      if (description) experience.description = description;
      if (to) experience.to = to;
      if (current) experience.current = current;

      // adding experience to the experince array
      profile.experience.push(experience);
      await profile.save();

      res.status(200).json({ success: true, data: profile });

      // if not profile error res
    } catch (error) {
      res.status(500).json({
        success: false,
        msg: 'Something went wrong',
      });
    }
  }
);

// deleting experiance field
router.delete('/experience/:experienceId', auth, async (req, res) => {
  try {
    // find profile
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(400).json({
        success: false,
        msg: 'profile does not exist for this user',
      });
    }

    profile.experience = profile.experience.filter(
      (item) => item.id !== req.params.experienceId
    );

    await profile.save();

    res.status(200).json({ success: true, data: profile });
    // if not profile error res
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: 'Something went wrong',
    });
  }
});

// adding education field
router.put(
  '/education',
  [
    auth,
    [
      check('school', 'Please Provide school').exists(),
      check('degree', 'Please Provide degree').exists(),
      check('fieldofstudy', 'Please Provide fieldofstudy').exists(),
      check('from', 'Please Provide valid from date').exists(),
    ],
  ],
  async (req, res) => {
    try {
      // Validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          msg: errors.array(),
        });
      }

      // find profile
      const profile = await Profile.findOne({ user: req.user.id });

      if (!profile) {
        return res.status(400).json({
          success: false,
          msg: 'profile does not exist for this user',
        });
      }

      // poppulating experiance field
      const { school, degree, fieldofstudy, from, to, current, description } =
        req.body;
      const education = { school, degree, fieldofstudy, from };

      if (description) education.description = description;
      if (to) education.to = to;
      if (current) education.current = current;

      // if profile update
      profile.education.push(education);
      await profile.save();

      res.status(200).json({ success: true, data: profile });
      // if not profile error res
    } catch (error) {
      res.status(500).json({
        success: false,
        msg: 'Something went wrong',
      });
    }
  }
);

// deleting education field
router.delete('/education/:eduId', auth, async (req, res) => {
  try {
    // find profile
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(400).json({
        success: false,
        msg: 'profile does not exist for this user',
      });
    }

    profile.education = profile.education.filter(
      (item) => item.id !== req.params.eduId
    );

    await profile.save();

    res.status(200).json({ success: true, data: profile });
    // if not profile error res
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: 'Something went wrong',
    });
  }
});

// @route    GET api/profile/github/:username
// @desc     Get user repos from Github
// @access   Public
router.get('/github/:username', async (req, res) => {
  try {
    const uri = encodeURI(
      `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
    );
    const headers = {
      'user-agent': 'node.js',
      Authorization: `token ${config.get('githubToken')}`,
    };

    // to resolve this error:unable to get local issuer certificate
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

    const gitHubResponse = await axios.get(uri, { headers });
    return res.json(gitHubResponse.data);
  } catch (err) {
    console.error(err.message);
    return res.status(404).json({ msg: 'No Github profile found' });
  }
});

module.exports = router;
