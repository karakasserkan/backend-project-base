const Joi = require("joi");
module.exports = {
  list: Joi.object({
    begin_date: Joi.date().optional(),
    end_date: Joi.date().optional(),
    page: Joi.number().optional(),
    limit: Joi.number().max(500).optional(),
  }),
};
