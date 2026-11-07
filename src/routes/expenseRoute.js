const express = require('express');
const router = express.Router();
const {getAllExpenses, createExpense, deleteExpense, updateExpense} = require('../controllers/expenseController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { createExpenseSchema, updateExpenseSchema, expenseIdParamSchema} = require('../validations/expenseValidation');

// Semua rute expense wajib login dan hanya ADMIN
router.use(protect, restrictTo('ADMIN'));

router.get('/', getAllExpenses); // GET /api/expenses
router.post('/', validate(createExpenseSchema), createExpense); // POST /api/expenses
router.put('/:id', validate(expenseIdParamSchema, 'params'), validate(updateExpenseSchema), updateExpense); // PUT /api/expenses/:id
router.delete( '/:id', validate(expenseIdParamSchema, 'params'), deleteExpense); // DELETE /api/expenses/:id

module.exports = router;