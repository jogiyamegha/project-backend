const API = require("../utils/apiBuilder");
const {TableFields, UserTypes} = require("../utils/constants");
const PlantController = require('../controllers/user/PlantController');
const DefaultController = require("../controllers/admin/DefaultController");
const AuthController = require('../controllers/user/AuthController');
const UserController = require('../controllers/user/UserController');
const ImageHandler = require("../middleware/imageVerifier");

const router = API.configRoute("/user")
/**
 * -------------------------------------
 * Auth Routes
 * -------------------------------------
 */
.addPath("/signup")
.asPOST(AuthController.signUp)
.build()

.addPath("/login")
.asPOST(AuthController.login)
.build()

.addPath('/forgot/password')
.asPOST(AuthController.forgotPassword)
.build()

.addPath("/reset/password")
.asPOST(AuthController.resetPassword)
.build()

.addPath("/logout")
.asPOST(AuthController.logout)
.useUserAuth([UserTypes.Consumer, UserTypes.Investor])
.build()


.addPath("/change/password")
.asUPDATE(AuthController.changePassword)
.useUserAuth([UserTypes.Consumer, UserTypes.Investor])
.build()


/**
 * -------------------------------------
 * Plant Routes
 * -------------------------------------
 */

.addPath('/plant/add')
.asPOST(PlantController.addPlant)
.userMiddlewares(ImageHandler.single([TableFields.billImage]))
.useUserAuth([UserTypes.Consumer])
.build()

.addPath('/my-plants')
.asGET(PlantController.listMyPlants)
.useUserAuth([UserTypes.Consumer])
.build()


/**
 * -------------------------------------
 * Payment Routes
 * -------------------------------------
 */

.addPath('/payment/create-intent')
.asPOST(UserController.createPaymentIntent)
.useUserAuth([UserTypes.Consumer])
.build()

.addPath("/payment/confirm-intent")
.asPOST(UserController.confirmPaymentIntent)
.useUserAuth()
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
