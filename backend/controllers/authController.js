const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { hashPassword, verifyPassword } = require('../utils/passwordUtils');

const normalizePhoneNumber = (phone) => {
  const trimmedPhone = phone.trim();
  const prefix = trimmedPhone.startsWith('+') ? '+' : '';
  return `${prefix}${trimmedPhone.replace(/\D/g, '')}`;
};

const defaultUsers = [
  {
    name: 'Ovindi Vimasha',
    email: 'ovindivimasha1015@gmail.com',
    phone: '0752076063',
    type: 'customer',
    password: 'Ovindi123#',
  },
  {
    name: 'Barista Admin',
    email: 'barista@admin.com',
    phone: '5552345678',
    type: 'admin',
    restaurantId: '1',
    password: 'Barista@123',
  },
  {
    name: 'Pizza Hut Admin',
    email: 'pizzahut@admin.com',
    phone: '5553456789',
    type: 'admin',
    restaurantId: '2',
    password: 'Pizzahut@123',
  },
  {
    name: 'Burger King Admin',
    email: 'bk@admin.com',
    phone: '5554567890',
    type: 'admin',
    restaurantId: '3',
    password: 'Burgerking@123',
  },
  {
    name: 'Coffee Bean Admin',
    email: 'coffeebean@admin.com',
    phone: '5555678901',
    type: 'admin',
    restaurantId: '4',
    password: 'Coffeebean@123',
  },
  {
    name: 'Ex Tea Admin',
    email: 'extea@admin.com',
    phone: '5556789012',
    type: 'admin',
    restaurantId: '5',
    password: 'Extea@123',
  },
  {
    name: 'Palm Strip Admin',
    email: 'palmstrip@admin.com',
    phone: '5557890123',
    type: 'admin',
    restaurantId: '6',
    password: 'Palmstrip@123',
  },
  {
    name: 'Main Administrator',
    email: 'admin@aerox.com',
    phone: '5558901234',
    type: 'mainAdmin',
    password: 'Admin@123',
  },
];

const validateSignupInput = ({ name, email, phone, password }) => {
  if (!name || !email || !phone || !password) {
    return 'Name, email, phone, and password are required';
  }

  if (!/^[a-zA-Z\s]+$/.test(name) || name.includes('  ') || name.trim().length < 2 || name.trim().length > 50) {
    return 'Name must be 2-50 characters and contain only letters and spaces';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length < 5 || email.length > 255) {
    return 'Please enter a valid email address';
  }

  if (!/^\+?[\d\s()-]+$/.test(phone) || !/^\+?\d{7,15}$/.test(normalizePhoneNumber(phone))) {
    return "Phone number must contain 7 to 15 digits and can include spaces, parentheses, hyphens, and an optional '+' prefix";
  }

  if (
    password.length < 8 ||
    password.length > 100 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[!@#$%^&*(),.?":{}|<>]/.test(password)
  ) {
    return 'Password must be 8-100 characters and include uppercase, lowercase, number, and special character';
  }

  return null;
};

const createToken = (user) => {
  const secret = process.env.JWT_SECRET || 'development_jwt_secret_change_me';

  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      type: user.type,
    },
    secret,
    { expiresIn: '7d' }
  );
};

exports.signup = async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const formattedPhone = (req.body.phone || '').trim();
    const phone = normalizePhoneNumber(formattedPhone);
    const password = req.body.password || '';
    const validationError = validateSignupInput({ name, email, phone: formattedPhone, password });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name,
      email,
      phone,
      passwordHash,
      type: 'customer',
    });

    res.status(201).json({
      message: 'Account created successfully',
      user: user.toClient(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    console.error('Signup error:', error);
    res.status(500).json({ message: 'An error occurred while creating your account' });
  }
};

exports.login = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      user: user.toClient(),
      token: createToken(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login' });
  }
};

exports.seedDefaultUsers = async () => {
  if (process.env.SEED_DEMO_USERS === 'false') {
    return;
  }

  for (const defaultUser of defaultUsers) {
    const email = defaultUser.email.toLowerCase();
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      const passwordHash = await hashPassword(defaultUser.password);
      await User.create({
        name: defaultUser.name,
        email,
        phone: defaultUser.phone,
        passwordHash,
        type: defaultUser.type,
        restaurantId: defaultUser.restaurantId,
      });
    }
  }
};
