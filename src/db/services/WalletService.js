const { ValidationMsgs, TableFields, TableNames, PlantStatus } = require("../../utils/constants");
const Util = require("../../utils/util");
const ValidationError = require("../../utils/ValidationError");
const Wallet = require("../models/wallet");
const { MongoUtil } = require("../mongoose");

class WalletService {
    static getUserById = (userId) => {
        return new ProjectionBuilder(async function () {
            return await Wallet.findOne({ [TableFields.ID]: userId }, this);
        });
    };

    static recordExists = async (recordId) => {
        return await Wallet.exists({
            [TableFields.ID]: MongoUtil.toObjectId(recordId),
        });
    };


    static insertRecord = async (updatedFields) => {
        const record = new Wallet({
            ...updatedFields,
        });

        try {
            await record.save();
        } catch (error) {
            if (error.code == 11000) {
                //Mongoose duplicate email error
                throw new ValidationError(ValidationMsgs.WalletExists);
            }
            throw error;
        }
    };

    static listWallets = (filter = {}) => {
        return new ProjectionBuilder(async function () {
            let limit = filter.limit || 0;
            let skip = filter.skip || 0;
            let sortKey = filter.sortKey || TableFields._createdAt;
            let sortOrder = filter.sortOrder || 1;
            let needCount = Util.parseBoolean(filter.needCount);
            let searchQuery = {};

            let searchTerm = filter.searchTerm;

            if (filter.ppaId) {
                searchQuery[`${TableFields.ppaDetail}.${TableFields.ppaId}`] = filter.ppaId
            }
            if (filter.billingMonth) {
                searchQuery[TableFields.billingMonth] = filter.billingMonth
            }
            if (filter.billingYear) {
                searchQuery[TableFields.billingYear] = filter.billingYear
            }

            return await Promise.all([
                needCount ? Wallet.countDocuments(searchQuery) : undefined,
                Wallet.find(searchQuery, this)
                    .limit(parseInt(limit))
                    .skip(parseInt(skip))
                    .sort({ [sortKey]: parseInt(sortOrder) }),
            ]).then(([total, records]) => ({ total, records }));
        });
    };

    static updateRecord = async (recordId, updatedFields = {}) => {
        let record = await Wallet.findByIdAndUpdate(
            recordId,
            {
                $set: {
                    ...updatedFields,
                    [TableFields._updatedAt]: Date.now(),
                },
            },
            {
                new: true,
                projection: { [TableFields.ID]: 1, [TableFields.balance]: 1 },
            }
        );
        if (!record) {
            throw new ValidationError(ValidationMsgs.RecordNotFound);
        }
        return record;
    };

    static deleteMyReferences = async (cascadeDeleteMethodReference, tableName, ...referenceId) => {
        let records = undefined;
        // console.log(cascadeDeleteMethodReference, tableName, ...referenceId);
        switch (tableName) {
            case TableNames.Plant:
                records = await Plant.find({
                    [TableFields.ID]: {
                        $in: referenceId,
                    },
                });
                break;
        }
        if (records && records.length > 0) {
            let deleteRecordIds = records.map((a) => a[TableFields.ID]);
            await Plant.deleteMany({
                [TableFields.ID]: {
                    $in: deleteRecordIds,
                },
            });
            if (tableName != TableNames.Plant) {
                //It means that the above objects are deleted on request from model's references (And not from model itself)
                cascadeDeleteMethodReference.call(
                    {
                        ignoreSelfCall: true,
                    },
                    TableNames.Plant,
                    ...deleteRecordIds
                ); //So, let's remove references which points to this model
            }
        }
    };

}
const ProjectionBuilder = class {
    constructor(methodToExecute) {
        const projection = {};
        this.withBasicInfo = () => {
            projection[TableFields.ID] = 1;
            projection[TableFields.userDetails] = 1;
            projection[TableFields.balance] = 1;
            projection[TableFields.depositedAmount] = 1;
            projection[TableFields.withdrawalAmount] = 1;
            projection[TableFields.totalInvestedAmount] = 1;
            projection[TableFields.totalReturn] = 1;
            projection[TableFields.isPaid] = 1;
            projection[TableFields.deleted] = 1;
            return this;
        };
        this.withPaymentDetail = () => {
            projection[TableFields.isPaid] = 1;
            projection[TableFields.paymentRefId] = 1;
            projection[TableFields.paymentDate] = 1;
            return this;
        }
        this.withTimeStamps = () => {
            projection[TableFields._createdAt] = 1;
            projection[TableFields._updatedAt] = 1;
            return this;
        };
        this.withPaid = () => {
            projection[TableFields.isPaid] = 1;
            return this;
        }
        this.withId = () => {
            projection[TableFields.ID] = 1;
            return this;
        };
        this.withPpaDetails = () => {
            projection[TableFields.ppaDetail] = 1;
            return this;
        };

        this.execute = async () => {
            return await methodToExecute.call(projection);
        };
    }
};

module.exports = WalletService;