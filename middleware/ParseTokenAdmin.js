const jwt = require("jsonwebtoken");
exports.ParseTokenAdmin = (req, res, next) => {
  if (!req.headers.authorization) return next();
  const token = req.headers.authorization.split(" ")[1];
  if (!token) return next();

  try {
    const { adminId } = jwt.verify(token, process.env.JWT_SECRET);
    if (!adminId) {
      return next();
    }

    res.locals.adminId = adminId;
    return next();
  } catch (e) {
    console.log(e.message);
    return next();
  }
};
