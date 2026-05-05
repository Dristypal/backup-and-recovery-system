const User = require('../models/User');
const Log = require('../models/Log');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ================= REGISTER =================
const register = async (req, res) => {
  try {
    let { name, email, password, role, adminCode } = req.body;

    // Normalize email
    email = email.toLowerCase().trim();

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    // Check existing user
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const requestedRole = role === 'admin' ? 'admin' : 'user';
    if (requestedRole === 'admin') {
      if (!process.env.ADMIN_REGISTRATION_CODE) {
        return res.status(500).json({ message: 'Admin registration is not configured on the server' });
      }

      if (!adminCode || adminCode !== process.env.ADMIN_REGISTRATION_CODE) {
        return res.status(403).json({ message: 'Invalid admin registration code' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: requestedRole
    });

    // Log
    await Log.create({
      userId: user._id,
      action: 'register',
      description: `User ${user.email} registered`,
      ipAddress: req.ip
    });

    // Token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// ================= LOGIN =================
const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    // Normalize email
    email = email.toLowerCase().trim();

    if (!email || !password) {
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Log
    await Log.create({
      userId: user._id,
      action: 'login',
      description: `User ${user.email} logged in`,
      ipAddress: req.ip
    });

    // Token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { register, login };
