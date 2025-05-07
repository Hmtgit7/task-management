const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  logout,
} = require("../controllers/authController");
const { protect, authorize } = require("../middleware/auth");
const { validateRegister, validateLogin } = require("../middleware/validator");

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get("/me", protect, getMe);
router.get("/logout", protect, logout);

module.exports = router;
