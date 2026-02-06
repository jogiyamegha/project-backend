const InvestorService = require("../../db/services/InvestorService");
const { TableFields } = require("../../utils/constants");

exports.getPortfolio = async (req) => {
    const investorId = req.user[TableFields.ID];
    const portfolio = await InvestorService.getPortfolio(investorId);
    return portfolio || {
        [TableFields.balance]: 0,
        [TableFields.totalInvestedAmount]: 0,
        [TableFields.totalReturn]: 0,
        [TableFields.depositedAmount]: 0,
        [TableFields.withdrawalAmount]: 0
    };
};

exports.myInvestments = async (req) => {
    const investorId = req.user[TableFields.ID];
    return await InvestorService.getMyInvestments(investorId);
};

exports.getInvestmentDetail = async (req) => {
    const { id } = req.params;
    return await InvestorService.getInvestmentDetail(id);
};

exports.getPayouts = async (req) => {
    const investorId = req.user[TableFields.ID];
    return await InvestorService.getPayouts(investorId);
};

exports.getAvailableInvestments = async (req) => {
    return await InvestorService.getAvailableInvestments();
};
