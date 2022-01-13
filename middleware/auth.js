const jwt = require('jsonwebtoken');
const config = require('config');

const User = require('../models/User');

module.exports = async (req, res, next) => {
  // Get toke from header
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({
      msg: 'No token, autherisation denied',
    });
  }

  try {
    const decoded = jwt.verify(token, config.get('jwtSecret'));
    req.user = decoded.user;
    if (await User.exists({ _id: decoded.user.id })) {
      next();
    } else {
      return res.status(401).json({ msg: 'Token is not valid' });
    }
  } catch (err) {
    console.error('Error in verifying token');
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};
