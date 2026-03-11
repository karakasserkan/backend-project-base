const paginate = async (model, query = {}, options = {}) => {
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.min(500, Math.max(1, parseInt(options.limit) || 20));
  const skip = (page - 1) * limit;
  const sort = options.sort || { created_at: -1 };

  // veri çekme ve count
  const [data, total] = await Promise.all([
    model.find(query).sort(sort).skip(skip).limit(limit).lean(),
    model.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

module.exports = paginate;
