const User = require("../models/User");
const Shop = require("../models/Shop");
const bcrypt = require("bcryptjs");
const { ValidationService } = require("../services/ValidationService");
const { v4 } = require("uuid");
const shortid = require("shortid");
const moment = require("moment");
const validator = require("validator");

exports.UserController = class {
  static async changePassword(req, res) {
    const user = await User.findById(res.locals.userId);

    const errors = await ValidationService.checkNewPassword(user, req.body);
    if (Object.keys(errors).length) {
      return res.status(403).send({ errors });
    }

    user.password = req.body.newPassword;
    await user.save();

    res.sendStatus(204);
  }

  static async create(req, res) {
    const errors = await ValidationService.checkUser(req.body);
    if (Object.keys(errors).length) {
      return res.status(403).send({ errors });
    }

    const user = new User({
      ...req.body,
      tempPassword: req.body.password,
    });
    await user.save();
    res.send({ user });
  }

  static saveUserDetails = async (req, res) => {
    try {
      await User.findByIdAndUpdate(res.locals.userId, { $set: req.body });
      res.sendStatus(204);
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  };

  static adminGetWebhotelsForUser = async (req, res) => {
    const webhotels = await Webhotel.find({ user: req.query.userId });
    res.send({ webhotels });
  };

  static async adminDeleteUsers(req, res) {
    for (let id of req.body.ids) {
      const user = await User.findById(id);
      if (!user) {
        return res.sendStatus(500);
      }

      const shops = await Shop.find({ user: id });
      for (let shop of shops) {
        await shop.remove();
      }

      await user.remove();
    }

    return res.sendStatus(204);
  }

  static async adminGetUsers(req, res) {
    const perPage = parseInt(req.query.per_page);
    const page = parseInt(req.query.page);

    let searchQuery = {};

    if (req.query.search) {
      const regexString = new RegExp(req.query.search, "i");

      searchQuery = {
        $or: [{ email: regexString }, { name: regexString }],
      };
    }

    const users = await User.find(searchQuery)
      .limit(perPage)
      .skip((page - 1) * perPage);

    const total = await User.find(searchQuery).countDocuments();
    return res.send({ users, total: total });
  }

  static removeAccount = async (req, res) => {
    const user = await User.findById(res.locals.userId);

    //TODO: remove shop

    await user.remove();

    res.sendStatus(204);
  };
};
