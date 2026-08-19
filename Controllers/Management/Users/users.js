// Controllers/Management/Users/users.js
import User from "../../../Models/Management/Users/user.js";
import AppError from "../../../Utils/AppError.js";
import catchAsync from "../../../Utils/catchAsync.js";
import bcrypt from "bcryptjs"; // ✅ Add this

// Add hashPassword function
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

// ============ GET ALL USERS ============
export const getAllUsers = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.isActive !== undefined)
    filter.isActive = req.query.isActive === "true";
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { email: { $regex: req.query.search, $options: "i" } },
      { username: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const users = await User.find(filter).skip(skip).limit(limit).select("-__v");

  const total = await User.countDocuments(filter);

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// ============ GET SINGLE USER ============
export const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select("-__v");
  if (!user) {
    return next(new AppError("User not found", 404));
  }
  res.status(200).json({
    status: "success",
    data: { user },
  });
});

// ============ UPDATE USER ============
export const updateUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { password, ...updateData } = req.body;

  // Check if user is authenticated
  if (!req.user) {
    return next(new AppError("You must be logged in to update a user", 401));
  }

  // PROTECTED USERS - These IDs cannot be updated by anyone
  const protectedUserIds = ["6a7df802c1d46e750328fe56"];

  // Check if the user is protected
  if (protectedUserIds.includes(id)) {
    return next(
      new AppError(
        "This user account is protected and cannot be modified",
        403,
      ),
    );
  }

  // Check if user exists
  const user = await User.findById(id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Check authorization - user can only update themselves unless admin/superadmin
  if (
    req.user.id !== id &&
    req.user.role !== "admin" &&
    req.user.role !== "superadmin"
  ) {
    return next(
      new AppError("You are not authorized to update this user", 403),
    );
  }

  // Handle password update if provided
  if (password) {
    if (password.length < 8) {
      return next(
        new AppError("Password must be at least 8 characters long", 400),
      );
    }
    const hashedPassword = await hashPassword(password);
    updateData.password = hashedPassword;
  }

  // Remove fields that shouldn't be updated directly
  const forbiddenFields = [
    "_id",
    "__v",
    "createdAt",
    "passwordResetToken",
    "passwordResetExpires",
  ];
  forbiddenFields.forEach((field) => delete updateData[field]);

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    id,
    { $set: updateData },
    {
      new: true,
      runValidators: true,
      context: "query",
    },
  ).select("-password -__v");

  if (!updatedUser) {
    return next(new AppError("Failed to update user", 500));
  }

  if (password) {
    console.log(
      `Password updated for user: ${updatedUser.email} at ${new Date().toISOString()}`,
    );
  }

  res.status(200).json({
    status: "success",
    message: password
      ? "User updated successfully with new password"
      : "User updated successfully",
    data: {
      user: updatedUser,
      passwordChanged: !!password,
    },
  });
});

// ============ GET USER STATISTICS ============
export const getUserStats = catchAsync(async (req, res, next) => {
  const stats = await User.aggregate([
    {
      $facet: {
        total: [{ $count: "count" }],
        active: [{ $match: { isActive: true } }, { $count: "count" }],
        byRole: [{ $group: { _id: "$role", count: { $sum: 1 } } }],
        recent: [
          {
            $match: {
              createdAt: {
                $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          },
          { $count: "count" },
        ],
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      total: stats[0].total[0]?.count || 0,
      active: stats[0].active[0]?.count || 0,
      byRole: stats[0].byRole || [],
      recentRegistrations: stats[0].recent[0]?.count || 0,
    },
  });
});
