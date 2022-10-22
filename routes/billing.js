const { BillingController } = require("../controllers/BillingController");
const router = require("express").Router();
const { IsUser } = require("../middleware/IsUser");
const { IsAdmin } = require("../middleware/IsAdmin");
const { UserController } = require("../controllers/UserController");

router.post(
  "/billing/give-subscription-days",
  IsAdmin,
  BillingController.giveSubscriptionDays
);
router.post("/billing/swap-plans", IsUser, BillingController.swapPlans);
router.post("/billing/charge", IsUser, BillingController.charger);
router.post(
  "/billing/create-subscription",
  BillingController.createSubscription
);
router.post(
  "/billing/update-card",
  IsUser,
  BillingController.updateCustomerDefaultPaymentMethod
);
router.post("/billing/webhooks", BillingController.webhooks);
router.post("/billing/unsubscribe", BillingController.unsubscribe);
router.post("/billing/payment-past-due", BillingController.paymentPastDue);
router.post(
  "/billing/resume-subscription",
  BillingController.resumeSubscription
);
router.get("/billing/invoices", BillingController.getInvoices);

module.exports = router;
