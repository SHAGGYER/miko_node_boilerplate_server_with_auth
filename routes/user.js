const { UserController } = require("../controllers/UserController");
const { IsAdmin } = require("../middleware/IsAdmin");
const { IsUser } = require("../middleware/IsUser");
const router = require("express").Router();

router.post("/change-password", IsUser, UserController.changePassword);
router.post("/remove-account", IsUser, UserController.removeAccount);
router.post("", IsAdmin, UserController.create);

module.exports = router;
