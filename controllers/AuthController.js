const { ValidationService } = require("../services/ValidationService");
const User = require("../models/User");
const Admin = require("../models/Admin");
const Plan = require("../models/Plan");
const AppSettings = require("../models/AppSettings");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const getIP = require("ipware")().get_ip;
const geoip = require("geoip-country");
const lookup = require("country-code-lookup");
const randomWords = require("random-words");
const moment = require("moment");
const Shop = require("../models/Shop");
const { checkToken } = require("encryptly-auth-sdk");

exports.AuthController = class {
  static async oauthLogin(req, res) {
    if (!req.query.token) {
      return res.status(400).send({ error: "No token provided" });
    }

    const settings = await AppSettings.findOne();

    const response = await checkToken({
      token: req.query.token,
      serverUrl: process.env.ENCRYPTLY_SERVER_URL,
      clientId: process.env.ENCRYPTLY_CLIENT_ID,
      clientSecret: process.env.ENCRYPTLY_CLIENT_SECRET,
    });

    if (response.error) {
      return res.sendStatus(401);
    }

    const { _id, displayName, email } = response.user;
    console.log(response.user);

    let user = await User.findOne({ email: email });
    if (!user) {
      user = new User({
        displayName,
        email,
        oauthId: _id,
        role: "User",
      });
      await user.save();
    }

    const jwtUserData = {
      userId: user._id,
      userRole: user.role,
    };
    const jwtToken = jwt.sign(jwtUserData, process.env.JWT_SECRET);

    if (req.query.serverRedirect) {
      let redirectUrl =
        process.env.CLIENT_URL +
        (req.query.redirectUrl ? req.query.redirectUrl : "/");
      redirectUrl = redirectUrl + "?token=" + jwtToken;

      return res.redirect(redirectUrl);
    }

    return res.send({ token: jwtToken });
  }

  static async loginAdminAsUser(req, res) {
    const user = await User.findById(req.body.userId);

    const jwtUserData = {
      userId: user._id,
      isAdmin: true,
    };

    const token = jwt.sign(jwtUserData, process.env.JWT_SECRET);
    res.send({ token });
  }

  static init = async (req, res) => {
    const userId = res.locals.userId;
    let user = null;

    const admin = await Admin.find().countDocuments();
    const appSettings = await AppSettings.findOne();

    if (userId) {
      user = await User.findById(res.locals.userId);

      if (user) {
        if (
          moment().isAfter(moment(user.stripeSubscriptionCurrentPeriodEnd)) &&
          user.isTrialing
        ) {
          user.isTrialing = false;
          user.stripeSubscriptionStatus = "canceled";
          await user.save();
        }
      }
    }

    res.send({
      user,
      installed: !!admin,
      appSettings,
      isAdmin: res.locals.isAdmin,
    });
  };

  static initAdmin = async (req, res) => {
    const adminId = res.locals.adminId;
    let admin = null;

    if (adminId) {
      admin = await Admin.findById(res.locals.adminId);
    }

    const appSettings = await AppSettings.findOne();

    res.send({
      admin,
      installed: !!admin,
      appSettings,
    });
  };

  static loginAdmin = async (req, res) => {
    const admin = await Admin.findOne({
      email: req.body.email.toLowerCase(),
    });

    if (!admin) {
      return res.status(403).send({
        error: "Could not log you in",
      });
    }

    const passwordEquals = await bcrypt.compare(
      req.body.password,
      admin.password
    );
    if (!passwordEquals) {
      return res.status(403).send({
        error: "Could not log you in",
      });
    }

    const jwtData = {
      adminId: admin._id,
    };

    const token = jwt.sign(jwtData, process.env.JWT_SECRET);

    res.send({ token, admin });
  };

  static login = async (req, res) => {
    const user = await User.findOne({
      email: req.body.email.toLowerCase(),
    });

    if (!user) {
      return res.status(403).send({
        error: "Could not log you in",
      });
    }

    const passwordEquals = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!passwordEquals) {
      return res.status(403).send({
        error: "Could not log you in",
      });
    }

    const jwtUserData = {
      userId: user._id,
    };

    const token = jwt.sign(jwtUserData, process.env.JWT_SECRET);
    res.send({ token, user });
  };

  static register = async (req, res) => {
    const errors = await ValidationService.run(
      {
        name: [[(val) => !val, "Name is required"]],
        email: [
          [(val) => !val, "Email is required"],
          [
            (val) => val && !validator.isEmail(val),
            "Email needs to be in correct format",
          ],
          [
            async (val) => {
              if (!val) return true;

              const exists = await User.findOne({
                email: val.trim().toLowerCase(),
              });
              return !!exists;
            },
            "This email is taken",
          ],
        ],
        password: [
          [(val) => !val, "Password"],
          [
            (val) => val.length < 6,
            "Password needs to be at least 6 characters long",
          ],
        ],
        passwordAgain: [
          [(val) => !val, "Password confirmation is required"],
          [(val) => val !== req.body.password, "Passwords must match"],
        ],
      },
      req.body
    );

    if (Object.keys(errors).length) {
      return res.status(403).send({ errors });
    }

    const user = new User({
      ...req.body,
      role: "User",
    });
    await user.save();

    const jwtUserData = {
      userId: user._id,
      userRole: user.role,
    };

    const token = jwt.sign(jwtUserData, process.env.JWT_SECRET);
    res.send({ token, user });
  };
};
