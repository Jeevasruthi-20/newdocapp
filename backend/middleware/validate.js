const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      res.status(400);
      throw new Error(`Validation Error: ${errors.join(', ')}`);
    }
    
    next();
  };
};

module.exports = validate;
