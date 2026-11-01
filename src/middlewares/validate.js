const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors,
    });
  }

  // req.params tidak ditimpa (kompatibel dengan Express 5)
  if (source === 'body' || source === 'query') {
    req[source] = result.data;
  } else {
    req.validated = { ...(req.validated || {}), [source]: result.data };
  }

  return next();
};

module.exports = validate;
