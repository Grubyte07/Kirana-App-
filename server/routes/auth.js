const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { queryOne, run } = require('../utils/db');
const auth = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

const formatUser = (u) => ({
  id: u.id, name: u.name, email: u.email, shopName: u.shop_name, language: u.language
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, shopName } = req.body;

    const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = run(
      'INSERT INTO users (name, email, password, shop_name) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, shopName || 'My Kirana Store']
    );

    const user = queryOne('SELECT id, name, email, shop_name, language FROM users WHERE id = ?', [result.lastInsertRowid]);
    const token = generateToken(user.id);

    res.status(201).json({ token, user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = queryOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

    res.json({ token, user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/me', auth, (req, res) => {
  res.json({ user: formatUser(req.user) });
});

router.put('/profile', auth, (req, res) => {
  try {
    const { name, shopName, language } = req.body;
    run('UPDATE users SET name = ?, shop_name = ?, language = ? WHERE id = ?',
      [name || req.user.name, shopName || req.user.shop_name, language || req.user.language, req.user.id]);

    const user = queryOne('SELECT id, name, email, shop_name, language FROM users WHERE id = ?', [req.user.id]);
    res.json({ user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = queryOne('SELECT password FROM users WHERE id = ?', [req.user.id]);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
