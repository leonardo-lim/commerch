const { User } = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Show All Users
router.get('/', async (req, res) => {
  const userList = await User.find().select('-passwordHash');

  if (!userList) {
    res.status(500).json({ success: false });
  } else {
    res.send(userList);
  }
});

// Show a User
router.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id).select('-passwordHash');

  if (!user) {
    res.status(500).json({ message: 'The user with the given ID was not found' });
  } else {
    res.status(200).send(user);
  }
});

// Add User
router.post('/', async (req, res) => {
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    passwordHash: bcrypt.hashSync(req.body.password, 10),
    phone: req.body.phone,
    street: req.body.street,
    apartment: req.body.apartment,
    city: req.body.city,
    zip: req.body.zip,
    country: req.body.country,
    isAdmin: req.body.isAdmin
  });

  user = await user.save();

  if (!user) {
    res.status(404).send('User can\'t be created');
  } else {
    res.send(user);
  }
});

// User Login
router.post('/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    res.status(400).send('User not found');
  } else {
    if (bcrypt.compareSync(req.body.password, user.passwordHash)) {
      const token = jwt.sign(
        {
          userId: user.id,
          isAdmin: user.isAdmin
        },
        'secret',
        {
          expiresIn: '1d'
        }
      );

      res.status(200).send({ user: user.email, token: token });
    } else {
      res.status(400).send('Wrong password');
    }
  }
});

// User Register
router.post('/register', async (req, res) => {
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    passwordHash: bcrypt.hashSync(req.body.password, 10),
    phone: req.body.phone,
    street: req.body.street,
    apartment: req.body.apartment,
    city: req.body.city,
    zip: req.body.zip,
    country: req.body.country,
    isAdmin: req.body.isAdmin
  });

  user = await user.save();

  if (!user) {
    res.status(404).send('User can\'t be created');
  } else {
    res.send(user);
  }
});

// Delete User
router.delete('/:id', (req, res) => {
  User.findByIdAndRemove(req.params.id)
    .then(user => {
      if (user) {
        return res.status(200).json({ success: true, message: 'User deleted' });
      } else {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
    })
    .catch(error => {
      return res.status(400).json({ success: false, error: error });
    });
});

// Count All Users
router.get('/get/count', async (req, res) => {
  const userCount = await User.countDocuments();

  if (!userCount) {
    res.status(500).json({ success: false });
  } else {
    res.send({
      userCount: userCount
    });
  }
});

module.exports = router;