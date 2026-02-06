const Investment = require("../models/investment");
const Wallet = require("../models/wallet");
const Bill = require("../models/bill");
const Ppa = require("../models/ppa");
const { TableFields } = require("../../utils/constants");
const { MongoUtil } = require("../mongoose");

class InvestorService {
    static getPortfolio = async (investorId) => {
        return await Wallet.findOne({
            [`${TableFields.userDetails}.${TableFields.userId}`]: MongoUtil.toObjectId(investorId)
        });
    };

    static getMyInvestments = async (investorId) => {
        return await Investment.find({
            [`${TableFields.investorDetails}.${TableFields.investorId}`]: MongoUtil.toObjectId(investorId),
            [TableFields.deleted]: false
        });
    };

    static getInvestmentDetail = async (investmentId) => {
        return await Investment.findOne({
            [TableFields.ID]: MongoUtil.toObjectId(investmentId),
            [TableFields.deleted]: false
        });
    };

    static getPayouts = async (investorId) => {
        const investments = await Investment.find({
            [`${TableFields.investorDetails}.${TableFields.investorId}`]: MongoUtil.toObjectId(investorId),
            [TableFields.isActive]: true
        });

        const ppaIds = investments.map(inv => inv[TableFields.ppaDetail][TableFields.ppaId]);

        return await Bill.find({
            [`${TableFields.ppaDetail}.${TableFields.ppaId}`]: { $in: ppaIds },
            [TableFields.isPaid]: true
        }).sort({ [TableFields._createdAt]: -1 });
    };

    static getAvailableInvestments = async () => {
        // Fetch all non-deleted PPAs
        const ppas = await Ppa.find({ [TableFields.deleted]: false });

        // Enhance with funding progress
        const detailedPpas = await Promise.all(ppas.map(async (ppa) => {
            const investments = await Investment.find({
                [`${TableFields.ppaDetail}.${TableFields.ppaId}`]: ppa._id,
                [TableFields.deleted]: false,
                [TableFields.isActive]: true
            });

            const totalReserved = investments.reduce((acc, inv) => acc + (inv[TableFields.plantCapacityReserved] || 0), 0);
            const fundedPercent = ppa[TableFields.plantCapacity] > 0
                ? Math.min(100, Math.round((totalReserved / ppa[TableFields.plantCapacity]) * 100))
                : 0;

            return {
                ...ppa.toJSON(),
                fundedPercent,
                totalReserved,
                availableCapacity: ppa[TableFields.plantCapacity] - totalReserved
            };
        }));

        return detailedPpas;
    };
}

module.exports = InvestorService;
