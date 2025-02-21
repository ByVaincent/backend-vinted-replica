const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      throw { status: 401, message: "Unauthorized" };
    }
    const incommingToken = req.headers.authorization.replace("Bearer ", "");

    if (!(await User.findOne({ token: incommingToken }))) {
      throw { status: 401, message: "Unauthorized" };
    }

    req.token = incommingToken;

    next();
  } catch (error) {
    res
      .status(error.status || 500)
      .json(error.message || "Internal server error");
  }
};

module.exports = isAuthenticated;
