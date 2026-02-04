const API = require("../utils/apiBuilder");
const {TableFields} = require("../utils/constants");
const AuthController = require("../controllers/admin/AuthController");
const PlantController = require('../controllers/admin/PlantController');
const PpaController = require('../controllers/admin/PpaController');
const BillController = require("../controllers/admin/BillController");
const UserController = require("../controllers/admin/UserController");
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
 * Dashboard Routes
 * -------------------------------------
 */

.addPath('/dashboard')
.asGET(AuthController.getDashboardData)
.useAdminAuth()
.build()

/**
 * -------------------------------------
 * Reports 
 * -------------------------------------
 */

.addPath('/plant/report/download')
.asGET(PlantController.downloadPlantReport)
.useAdminAuth()
.build()

.addPath('/bill/report/download')
.asGET(BillController.downloadBillReport)
.useAdminAuth()
.build()

/**
 * -------------------------------------
 * User Routes
 * -------------------------------------
 */

.addPath('/user/list')
.asGET(UserController.getAllUsers)
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

.addPath(`/plant/edit/:${TableFields.ID}`)
.asUPDATE(PlantController.editPlant)
.userMiddlewares(ImageHandler.single([TableFields.billImage]))
.useAdminAuth()
.build()

.addPath('/plant/list')
.asGET(PlantController.listPlants)
.useAdminAuth()
.build()

.addPath(`/plant/info/:${TableFields.ID}`)
.asGET(PlantController.plantInfo)
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

.addPath(`/ppa/edit/:${TableFields.ID}`)
.asUPDATE(PpaController.editPpa)
.userMiddlewares(ImageHandler.multiplePDFAndImagesBasedOnType())
.useAdminAuth()
.build()

.addPath('/ppa/list')
.asGET(PpaController.listPPa)
.useAdminAuth()
.build()

.addPath(`/ppa/info/:${TableFields.ID}`)
.asGET(PpaController.ppaInfo)
.useAdminAuth()
.build()

.addPath(`/ppa/sign/:${TableFields.ID}`)
.asUPDATE(PpaController.signPpa)
.useAdminAuth()
.build()

/**
 * -------------------------------------
 * Bill Routes
 * -------------------------------------
 */

.addPath('/bill/generate')
.asPOST(BillController.generateBill)
.useAdminAuth()
.build()

.addPath(`/bill/edit/:${TableFields.ID}`)
.asUPDATE(BillController.editBill)
.useAdminAuth()
.build()

.addPath('/bill/list')
.asGET(BillController.listBills)
.useAdminAuth()
.build()

.addPath(`/bill/info/:${TableFields.ID}`)
.asGET(BillController.billInfo)
.useAdminAuth()
.build()

/**
 * -------------------------------------
 * Payment Routes
 * -------------------------------------
 */

.addPath(`/update/cash-payment/:${TableFields.ID}`)
.asUPDATE(BillController.updateCashPayment)
.useAdminAuth()
.build()

.getRouter();

module.exports = router;
