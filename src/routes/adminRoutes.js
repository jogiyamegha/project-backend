const API = require("../utils/apiBuilder");
const {TableFields} = require("../utils/constants");
const AuthController = require("../controllers/admin/AuthController");
const PlantController = require('../controllers/admin/PlantController');
const PpaController = require('../controllers/admin/PpaController');
const BillController = require("../controllers/admin/BillController");
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

.addPath('/plant/list')
.asGET(PlantController.listPlants)
.useAdminAuth()
.build()

.addPath(`/plant/status/update/:${TableFields.ID}`)
.asUPDATE(PlantController.updatePlantStatus)
.useAdminAuth()
.build()

/**
 * -------------------------------------
 * Ppa Routes
 * -------------------------------------
 */

.addPath('/ppa/create')
.asPOST(PpaController.createPpa)
.useAdminAuth()
.userMiddlewares(ImageHandler.multiplePDFAndImagesBasedOnType())
.build()

.addPath('/ppa/list')
.asGET(PpaController.listPPa)
.useAdminAuth()
.build()

/**
 * -------------------------------------
 * Bill Routes
 * -------------------------------------
 */

.addPath('/bill/generate/')
.asPOST(BillController.generateBill)
.useAdminAuth()
.build()

.addPath('/bill/list')
.asGET(BillController.listBills)
.useAdminAuth()
.build()


.getRouter();

module.exports = router;
