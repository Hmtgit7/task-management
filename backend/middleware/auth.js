const jwt = require("jsonwebtoken");
const asyncHandler = require("./async");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/User");
const config = require("../config/config");

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Debug log for authentication
  console.log("Headers:", req.headers);

  // Get token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(" ")[1];
    console.log(
      "Token extracted from header:",
      token ? token.substring(0, 10) + "..." : "none"
    );
  }
  // Also check if token exists in cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log("Token extracted from cookies");
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }

  // Handle guest token
  if (token === "guest-token") {
    // Set guest user
    req.user = {
      _id: "guest-user",
      name: "Guest User",
      email: "guest@example.com",
      role: "user",
    };
    return next();
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);
    console.log("Token verified, user ID:", decoded.id);

    // Add user to req object
    req.user = await User.findById(decoded.id);

    // Check if user exists
    if (!req.user) {
      return next(new ErrorResponse("User not found", 401));
    }

    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};
