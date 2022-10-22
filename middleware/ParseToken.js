const jwt = require("jsonwebtoken");
exports.ParseToken = (req, res, next) => {
  if (!req.headers.authorization) return next();
  const token = req.headers.authorization.split(" ")[1];
  if (!token) return next();

  try {
    const { userId, userRole, isAdmin, adminId } = jwt.verify(
      token,
      process.env.JWT_SECRET
    );
    if (!userId) {
      return next();
    }

    res.locals.userId = userId;
    res.locals.userRole = userRole;
    res.locals.isAdmin = isAdmin;
    res.locals.adminId = adminId
    return next();
  } catch (e) {
    console.log(e.message);
    return next();
  }
};
