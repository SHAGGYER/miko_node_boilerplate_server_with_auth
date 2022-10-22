const User = require("../models/User");
const Plan = require("../models/Plan");
const AppSettings = require("../models/AppSettings");
const Invoice = require("../models/Invoice");
const moment = require("moment");
const plans = require("../data/plans.json");

exports.BillingController = class {
  static async giveSubscriptionDays(req, res) {
    const user = await User.findById(req.body.userId);
    const stripe = require("stripe")(process.env.STRIPE_SECRET);

    user.stripeSubscriptionStatus = "trialing";

    const newDateEnd = user.stripeSubscriptionCurrentPeriodEnd
      ? moment(user.stripeSubscriptionCurrentPeriodEnd)
          .add(req.body.days, "days")
          .toDate()
      : moment().add(req.body.days, "days").toDate();
    user.stripeSubscriptionCurrentPeriodEnd = newDateEnd;

    user.isTrialing = true;

    const trialEnd = moment(newDateEnd).unix();
    console.log(trialEnd);

    if (user.stripeSubscriptionId) {
      const sub = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        trial_end: trialEnd,
      });

      user.stripeSubscriptionCurrentPeriodEnd = moment
        .unix(sub.current_period_end)
        .format("YYYY-MM-DD");
    }

    await user.save();

    res.send({ user });
  }

  static async swapPlans(req, res) {
    const user = await User.findById(res.locals.userId);
    const stripe = require("stripe")(process.env.STRIPE_SECRET);
    const plan = await Plan.findById(req.body.plan._id);

    if (plan._id == user.planId) {
      return res.status(400).json({
        message: "You are already subscribed to this plan",
      });
    }

    const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      proration_behavior: "none",
      items: [
        {
          id: sub.items.data[0].id,
          price: plan.stripeId,
        },
      ],
    });

    user.planId = plan._id;
    user.isTrialing = false;
    await user.save();

    res.send({ message: "Plan changed successfully" });
  }

  static paymentPastDue = async (req, res) => {
    const stripe = require("stripe")(process.env.STRIPE_SECRET);
    const user = await User.findById(res.locals.userId);

    const subscription = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId
    );

    try {
      const invoice = await stripe.invoices.pay(subscription.latest_invoice);
      user.isTrialing = false;
      await user.save();
    } catch (error) {
      return res.status(400).send({
        error: error.raw.message,
        type: error.raw.type,
      });
    }

    res.sendStatus(204);
  };

  static unsubscribe = async (req, res) => {
    const stripe = require("stripe")(process.env.STRIPE_SECRET);

    const user = await User.findById(res.locals.userId);

    const subscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    user.stripeSubscriptionCurrentPeriodEnd = moment
      .unix(subscription.current_period_end)
      .format("YYYY-MM-DD HH:mm");
    user.stripeSubscriptionCanceled = true;
    user.isTrialing = false;
    await user.save();

    res.sendStatus(204);
  };

  static resumeSubscription = async (req, res) => {
    const stripe = require("stripe")(process.env.STRIPE_SECRET);

    const user = await User.findById(res.locals.userId);

    const subscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        cancel_at_period_end: false,
      }
    );

    user.stripeSubscriptionCurrentPeriodEnd = moment
      .unix(subscription.current_period_end)
      .format("YYYY-MM-DD HH:mm");
    user.stripeSubscriptionCanceled = false;

    await user.save();

    res.sendStatus(204);
  };

  static getInvoices = async (req, res) => {
    const user = await User.findById(res.locals.userId);
    const invoices = await Invoice.find({ user: user._id }).sort({
      createdAt: -1,
    });
    res.send({ invoices });
  };

  static webhooks = async (req, res) => {
    let { data, type } = req.body;
    let { previous_attributes, object } = data;
    let customer_id = object.customer;
    const stripe = require("stripe")(process.env.STRIPE_SECRET);

    try {
      if (
        type === "customer.subscription.updated" ||
        type === "customer.subscription.deleted"
      ) {
        if (object.plan) {
          const plans = await Plan.find({});
          const planIds = plans.map((plan) => plan.stripeId);
          if (!planIds.includes(object.plan.id)) {
            return res.status(200).send({
              message: "Not daysure plan",
            });
          }
        }

        const user = await User.findOne({ stripeCustomerId: customer_id });
        console.log(user, customer_id);
        if (!user) {
          return res.status(200).send({
            message: "User not found (maybe wrong plan)",
          });
        }

        user.stripeSubscriptionStatus = object.status;
        user.isTrialing = false;

        if (object.current_period_end) {
          user.stripeSubscriptionCurrentPeriodEnd = moment
            .unix(object.current_period_end)
            .format("YYYY-MM-DD HH:mm");
        }

        if (type === "customer.subscription.deleted") {
          user.planId = null;
        }

        await user.save();

        if (
          moment
            .unix(object.current_period_end)
            .isAfter(moment.unix(previous_attributes.current_period_end))
        ) {
          const invoice = await stripe.invoices.retrieve(object.latest_invoice);

          const myInvoice = new Invoice({
            user: user._id,
            lines: invoice.lines.data,
            amountPaid: invoice.amount_paid,
          });
          await myInvoice.save();
        }
      }
      res.sendStatus(200);
    } catch (err) {
      console.log("/webhooks route error: ", err);
      res.sendStatus(200);
    }
  };

  static getPaymentIntent = async (_req, res) => {
    const stripe = require("stripe")(process.env.STRIPE_SECRET);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: total * 100,
      currency: "dkk",
      payment_method_types: ["card"],
    });

    res.send(paymentIntent);
  };

  static updateCustomerDefaultPaymentMethod = async (req, res) => {
    const stripe = require("stripe")(process.env.STRIPE_SECRET);
    const user = await User.findById(res.locals.userId);

    user.stripePaymentMethodId = req.body.source.id;
    await user.save();

    await stripe.customers.update(user.stripeCustomerId, {
      source: req.body.source.id,
    });

    const customer = await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: req.body.source.id,
      },
    });

    const subscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      {
        default_payment_method: req.body.source.id,
      }
    );

    res.send(customer);
  };

  static createSubscription = async (req, res) => {
    const user = await User.findById(res.locals.userId);
    const stripe = require("stripe")(process.env.STRIPE_SECRET);
    const appSettings = await AppSettings.findOne();

    if (appSettings.appEnv === "production") {
      if (!user.stripeCustomerId) {
        const customer = await stripe.customers.create({
          source: req.body.source.id,
          name: req.body.name,
          email: user.email,
        });

        user.stripeCustomerId = customer.id;
        user.stripePaymentMethodId = req.body.source.id;
        user.stripeCardBrand = req.body.source.card.brand;
        user.stripeCardLast4 = req.body.source.card.last4;
        user.stripeCardExpMonth = req.body.source.card.exp_month;
        user.stripeCardExpYear = req.body.source.card.exp_year;
        user.stripeCardHolderName = req.body.name;
        await user.save();
      }

      try {
        const plan = await Plan.findById(req.body.plan._id);

        const subscription = await stripe.subscriptions.create({
          customer: user.stripeCustomerId,
          default_payment_method: user.stripePaymentMethodId,
          items: [
            {
              price: `${plan.stripeId}`,
            },
          ],
        });

        const invoice = await stripe.invoices.retrieve(
          subscription.latest_invoice
        );

        const myInvoice = new Invoice({
          user: user._id,
          lines: invoice.lines.data,
          amountPaid: invoice.amount_paid,
        });
        await myInvoice.save();

        user.stripeSubscriptionId = subscription.id;
        user.stripeSubscriptionStatus = subscription.status;
        user.stripeTrialEnd = moment
          .unix(subscription.trial_end)
          .format("YYYY-MM-DD HH:mm");
        user.stripeTrialing = true;
        user.stripeSubscriptionCurrentPeriodEnd = moment
          .unix(subscription.current_period_end)
          .format("YYYY-MM-DD HH:mm");
        user.isTrialing = false;

        user.planId = req.body.plan._id;
        await user.save();

        res.send({
          subscription,
          user,
        });
      } catch (error) {
        console.log(error);
      }
    } else {
      const chosenPlan = plans.find((plan) => plan.id == req.body.plan.id);
      user.planId = chosenPlan.id;
      user.isTrialing = false;
      await user.save();

      res.send({
        user,
      });
    }
  };

  static charger = async (req, res) => {
    const user = await User.findById(res.locals.userId);
    const stripe = require("stripe")(process.env.STRIPE_SECRET);

    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        source: req.body.source.id,
        name: req.body.name,
        email: user.email,
      });

      user.stripeCustomerId = customer.id;
      user.stripePaymentMethodId = req.body.source.id;
      user.stripeCardBrand = req.body.source.card.brand;
      user.stripeCardLast4 = req.body.source.card.last4;
      user.stripeCardExpMonth = req.body.source.card.exp_month;
      user.stripeCardExpYear = req.body.source.card.exp_year;
      user.stripeCardHolderName = req.body.name;
      await user.save();
    }

    const charge = await stripe.charges.create({
      amount: req.body.total * 100,
      currency: "dkk",
      source: user.stripePaymentMethodId,
      description: `Modtaget betaling på ${req.body.total} DKK`,
      customer: user.stripeCustomerId,
    });

    if (!user.availableCredits) {
      user.availableCredits = req.body.credits;
    } else {
      user.availableCredits += req.body.credits;
    }
    await user.save();

    res.sendStatus(200);
  };
};
