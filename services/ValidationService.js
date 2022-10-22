const validator = require("validator");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

exports.ValidationService = class {
  static async run(field, obj) {
    let errors = {};
    for (let [key, rules] of Object.entries(field)) {
      if (errors[key]) continue;
      const reversedArray = rules.reverse();
      for (let rule of reversedArray) {
        const func = rule[0];
        const error = rule[1];
        const result = await Promise.resolve(func(obj[key]));
        if (result) errors[key] = error;
      }
    }

    return errors;
  }

  static async checkNewPassword(user, body) {
    const errors = await this.run(
      {
        newPassword: [[(val) => !val, "Nyt kodeord er påkrævet"]],
        newPasswordAgain: [
          [(val) => !val, "Kodeord bekræftelse er påkrævet"],
          [(val) => val !== body.newPassword, "Kodeord skal være ens"],
        ],
        currentPassword: [
          [(val) => !val, "Nuværende kodeord er påkrævet"],
          [
            async (val) => {
              return !(await bcrypt.compare(val, user.password));
            },
            "Nuværende kodeord er forkert",
          ],
        ],
      },
      body
    );

    return errors;
  }

  static async checkUser(user) {
    const errors = await this.run(
      {
        name: [[(val) => !val, "Navn er påkrævet"]],
        email: [
          [(val) => !val, "Email er påkrævet"],
          [
            (val) => val && !validator.isEmail(val),
            "Email skal være i korrekt format",
          ],
          [
            async (val) => {
              if (!val) return true;

              const exists = await User.findOne({
                email: val.trim().toLowerCase(),
              });
              return !!exists;
            },
            "Denne Email er optaget",
          ],
        ],
        password: [
          [(val) => !val, "Kodeord er påkrævet"],
          [(val) => val.length < 6, "Kodeord skal være mindst 6 tegn langt"],
        ],
        passwordAgain: [
          [(val) => !val, "Kodeord bekræftelse er påkrævet"],
          [(val) => val !== user.password, "Kodeord skal være ens"],
        ],
      },
      user
    );

    return errors;
  }
};
