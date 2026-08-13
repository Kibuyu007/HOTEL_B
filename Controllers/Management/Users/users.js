import User from '../../../Models/Management/Users/user.js';
import AppError from '../../../Utils/AppError.js';
import catchAsync from '../../../Utils/catchAsync.js';




// ============ GET ALL USERS ============
export const getAllUsers = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { username: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const users = await User.find(filter)
    .skip(skip)
    .limit(limit)
    .select('-__v');

  const total = await User.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: { 
      users,
      pagination: { 
        page, 
        limit, 
        total, 
        pages: Math.ceil(total / limit) 
      }
    }
  });
});



// ============ GET SINGLE USER ============
export const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-__v');
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { user }
  });
});



// ============ UPDATE USER  ============
export const updateUser = catchAsync(async (req, res, next) => {
  // Prevent password update through this route
  if (req.body.password) {
    return next(new AppError('Use update-password route for password updates', 400));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: false }
  );

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { user }
  });
});



// ============ GET USER STATISTICS ============
export const getUserStats = catchAsync(async (req, res, next) => {
  const stats = await User.aggregate([
    {
      $facet: {
        total: [{ $count: 'count' }],
        active: [
          { $match: { isActive: true } },
          { $count: 'count' }
        ],
        byRole: [
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ],
        recent: [
          { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
          { $count: 'count' }
        ]
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      total: stats[0].total[0]?.count || 0,
      active: stats[0].active[0]?.count || 0,
      byRole: stats[0].byRole || [],
      recentRegistrations: stats[0].recent[0]?.count || 0
    }
  });
});