const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  registerUser,
  loginUser,
  deleteUser,
} = require('../controllers/userController');
const validate = require('../middlewares/validate');
const { registerSchema, loginSchema } = require('../validations/userValidation');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// Middleware untuk melindungi rute dan membatasi akses hanya untuk ADMIN
router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);

router.get('/', protect, restrictTo('ADMIN'), getAllUsers); // Hanya Admin yang bisa lihat semua user
router.get('/:id', protect, getUserById);
router.delete('/:id', protect, restrictTo('ADMIN'), deleteUser); // Hanya Admin yang bisa hapus user

module.exports = router;