const { AuthController } = require("../controllers/AuthController");
const router = require("express").Router();

/**
 * @openapi
 * /api/auth/init:
 *   get:
 *     description: Gets initial data from API
 *     responses:
 *       200:
 *         description: Returns a mysterious string.
 */
router.get("/init", AuthController.init);

router.get("/oauth", AuthController.oauthLogin);
router.post("/login", AuthController.login);
router.post("/register", AuthController.register);

module.exports = router;
