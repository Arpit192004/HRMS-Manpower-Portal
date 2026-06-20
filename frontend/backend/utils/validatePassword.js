const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters long";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must include at least one uppercase letter";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must include at least one lowercase letter";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must include at least one number";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include at least one special character";
  }

  const weakPasswords = [
    "password",
    "password@123",
    "admin@123",
    "qwerty@123",
    "welcome@123"
  ];

  if (weakPasswords.includes(password.toLowerCase())) {
    return "Password is too common. Please choose a stronger password";
  }

  return null;
};

module.exports = validatePassword;
