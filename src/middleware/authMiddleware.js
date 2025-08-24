// Middleware untuk memproteksi route dengan JWT: validasi token & inject req.user

const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Unauthorized: token tidak ditemukan' });
    }

    // Verifikasi token
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Pastikan user masih ada (opsional namun disarankan)
    const user = await User.findById(payload.sub).select('_id username email');
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized - user tidak ditemukan' });
    }

    // Simpan user ke request untuk dipakai di controller
    req.user = { id: user._id.toString(), username: user.username, email: user.email };
    next();
  } catch (err) {
    // Tangani token kadaluarsa/invalid
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token kadaluarsa' });
    }
    return next(err);
  }
};
