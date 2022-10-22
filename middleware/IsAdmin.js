exports.IsAdmin = (req, res, next) => {
  if (!res.locals.adminId) {
    return res.status(403).send({ error: "Ikke Admin" });
  }

  next();
};
