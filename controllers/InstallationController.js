const AppSettings = require("../models/AppSettings");
const Admin = require("../models/Admin");
const { ValidationService } = require("../services/ValidationService");
const validator = require("validator");

exports.InstallationController = class {
  static async saveAppName(req, res) {
    const errors = await ValidationService.run(
      {
        appName: [[(val) => !val, "Appnavn er påkrævet"]],
      },
      req.body
    );

    if (Object.keys(errors).length) {
      return res.status(403).send({ errors });
    }

    const appSettings = new AppSettings({ ...req.body, appEnv: "unpublished" });
    await appSettings.save();
    res.send({ appSettings });
  }

  static async saveAdminAccount(req, res) {
    const errors = await ValidationService.run(
      {
        name: [[(val) => !val, "Navn er påkrævet"]],
        email: [
          [(val) => !val, "Email er påkrævet"],
          [
            (val) => val && !validator.isEmail(val),
            "Email skal være i korrekt format",
          ],
        ],
        password: [
          [(val) => !val, "Kodeord er påkrævet"],
          [(val) => val.length < 6, "Kodeord skal være mindst 6 tegn langt"],
        ],
        passwordAgain: [
          [(val) => !val, "Kodeord bekræftelse er påkrævet"],
          [(val) => val !== req.body.password, "Kodeord skal være ens"],
        ],
      },
      req.body
    );

    if (Object.keys(errors).length) {
      return res.status(403).send({ errors });
    }

    const admin = new Admin({ ...req.body });
    await admin.save();
    res.send({ admin });
  }
};
