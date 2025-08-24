// Controller untuk registrasi & login user + pembuatan JWT

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Util buat bikin JWT
function signToken(userId) {
  return jwt.sign(
    { sub: userId }, // subject = user id
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email, dan password wajib diisi' });
    }

    // Cek duplikasi
    const existed = await User.findOne({ $or: [{ email }, { username }] });
    if (existed) {
      return res.status(409).json({ message: 'Username atau email sudah terdaftar' });
    }

    const user = await User.create({ username, email, password });
    const token = signToken(user._id.toString());

    return res.status(201).json({
      message: 'Registrasi berhasil',
      token,
      user: user.toJSON(), // sudah hilangkan password via toJSON
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, username, password } = req.body || {};
    const identifier = email || username;
    if (!identifier || !password) {
      return res.status(400).json({ message: 'email/username dan password wajib diisi' });
    }

    // Bisa login pakai email ATAU username
    const user = await User.findOne(
      email ? { email } : { username }
    ).select('+password'); // ambil password untuk compare

    if (!user) {
      return res.status(401).json({ message: 'Kredensial tidak valid' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ message: 'Kredensial tidak valid' });
    }

    const token = signToken(user._id.toString());

    // Kembalikan user tanpa password
    const safeUser = user.toJSON();
    return res.json({
      message: 'Login berhasil',
      token,
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
};
