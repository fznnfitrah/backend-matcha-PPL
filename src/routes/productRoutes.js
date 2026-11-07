const express = require('express');

const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const validate = require('../middlewares/validate');
const {
  createProductSchema,
  updateProductSchema,
  idParamSchema,
} = require('../validations/productValidation');

const router = express.Router();

// Daftar Endpoint Produk
router.get('/', getAllProducts); // GET /api/products
router.get('/:id', validate(idParamSchema, 'params'), getProductById); // GET /api/products/:id
router.post('/', validate(createProductSchema), createProduct); // POST /api/products
router.put('/:id', validate(idParamSchema, 'params'), validate(updateProductSchema), updateProduct,); // PUT /api/products/:id
router.delete('/:id', validate(idParamSchema, 'params'), deleteProduct); // DELETE /api/products/:id

module.exports = router;
