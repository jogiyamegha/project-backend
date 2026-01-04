const API = require("../utils/apiBuilder");
const {TableFields} = require("../utils/constants");
const AuthController = require("../controllers/admin/AuthController");
const PlantController = require('../controllers/admin/PlantController');
const DefaultController = require("../controllers/admin/DefaultController");
const ImageHandler = require("../middleware/imageVerifier");

const router = API.configRoute("/admin")
/**
 * -------------------------------------
 * Auth Routes
 * -------------------------------------
 */
.addPath("/signup")
.asPOST(AuthController.addAdminUser)
.build()

.addPath("/login")
.asPOST(AuthController.login)
.build()

.addPath("/logout")
.asPOST(AuthController.logout)
.useAdminAuth()
.build()

.addPath("/password/forgot")
.asPOST(AuthController.forgotPassword)
.build()

.addPath("/verify/otp")
.asPOST(AuthController.forgotPasswordCodeExists)
.build()

.addPath("/password/reset")
.asPOST(AuthController.resetPassword)
.build()

.addPath("/password/change")
.asUPDATE(AuthController.changePassword)
.useAdminAuth()
.build()


/**
 * -------------------------------------
 * Plant Routes
 * -------------------------------------
 */

.addPath('/plant/add')
.asPOST(PlantController.addPlant)
.useAdminAuth()
.userMiddlewares(ImageHandler.single([TableFields.billImage]))
.build()



/**
 * -------------------------------------
 * CMS
 * -------------------------------------
 */
.addPath("/privacy-policy")
.asPOST(DefaultController.editPrivacyPolicy)
// .useAdminAuth()
.build()

.addPath("/terms-conditions")
.asPOST(DefaultController.editTermsAndConditions)
// .useAdminAuth()
.build()

.addPath("/about-us")
.asPOST(DefaultController.editAboutUs)
// .useAdminAuth()
.build()


/**
 * -------------------------------------
 * App Settings Route
 * -------------------------------------
 */
.addPath("/appSettings")
.asUPDATE(DefaultController.updateAppSettings)
// .useAdminAuth()
.build()

.addPath("/appSettings/list")
.asGET(DefaultController.getAppSettings)
// .useAdminAuth()
.build()

.getRouter();

module.exports = router;
