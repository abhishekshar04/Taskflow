const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const { error } = require('../utils/apiResponse');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return error(res, 'Not authorized. No token.', 401);

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return error(res, 'User no longer exists.', 401);

    req.user = user;
    next();
  } catch (err) {
    return error(res, 'Not authorized. Token invalid.', 401);
  }
};

module.exports = { protect };
