const API = require("../utils/apiBuilder");
const { UserTypes } = require("../utils/constants");
const InvestorController = require('../controllers/user/InvestorController');

const router = API.configRoute("/investor")
    /**
     * -------------------------------------
     * Investor Portfolio Routes
     * -------------------------------------
     */
    .addPath("/portfolio")
    .asGET(InvestorController.getPortfolio)
    .useUserAuth([UserTypes.Investor])
    .build()

    .addPath("/my-investments")
    .asGET(InvestorController.myInvestments)
    .useUserAuth([UserTypes.Investor])
    .build()

    .addPath("/my-investments/:id")
    .asGET(InvestorController.getInvestmentDetail)
    .useUserAuth([UserTypes.Investor])
    .build()

    .addPath("/payouts")
    .asGET(InvestorController.getPayouts)
    .useUserAuth([UserTypes.Investor])
    .build()

    .addPath("/available-investments")
    .asGET(InvestorController.getAvailableInvestments)
    .useUserAuth([UserTypes.Investor])
    .build()

    .getRouter();

module.exports = router;
