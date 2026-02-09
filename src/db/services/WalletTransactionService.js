const { ValidationMsgs, TableFields, TableNames, TransactionStatus } = require("../../utils/constants");
const Util = require("../../utils/util");
const ValidationError = require("../../utils/ValidationError");
const WalletTransaction = require("../models/walletTransaction");
const { MongoUtil } = require("../mongoose");

class WalletTransactionService {
    static getUserById = (id) => {
        return new ProjectionBuilder(async function () {
            return await WalletTransaction.findOne({ [TableFields.ID]: id }, this);
        });
    };

    static recordExists = async (recordId) => {
        return await WalletTransaction.exists({
            [TableFields.ID]: MongoUtil.toObjectId(recordId),
        });
    };

    static insertRecord = async (updatedFields) => {
        const record = new WalletTransaction({
            ...updatedFields,
        });

        try {
            await record.save();
            return record;
        } catch (error) {
            throw error;
        }
    };

    static listTransactions = (filter = {}) => {
        return new ProjectionBuilder(async function () {
            let limit = filter.limit || 0;
            let skip = filter.skip || 0;
            let sortKey = filter.sortKey || TableFields._createdAt;
            let sortOrder = filter.sortOrder || -1;
            let needCount = Util.parseBoolean(filter.needCount);
            let searchQuery = {};

            if (filter.walletId) {
                searchQuery[`${TableFields.fromUserDetail}.${TableFields.walletId}`] = filter.walletId;
            }
            if (filter.userId) {
                searchQuery[`${TableFields.fromUserDetail}.${TableFields.userId}`] = MongoUtil.toObjectId(filter.userId);
            }
            if (filter.transactionStatus) {
                searchQuery[TableFields.transactionStatus] = Number(filter.transactionStatus);
            }
            if (filter.transactionType) {
                searchQuery[TableFields.transactionType] = Number(filter.transactionType);
            }

            return await Promise.all([
                needCount ? WalletTransaction.countDocuments(searchQuery) : undefined,
                WalletTransaction.find(searchQuery, this)
                    .limit(parseInt(limit))
                    .skip(parseInt(skip))
                    .sort({ [sortKey]: parseInt(sortOrder) }),
            ]).then(([total, records]) => ({ total, records }));
        });
    };

    static updateStatus = async (transactionId, status, adminId, adminNote) => {
        let updatePayload = {
            [TableFields.transactionStatus]: status,
            [TableFields.processedBy]: MongoUtil.toObjectId(adminId),
            [TableFields.processedAt]: new Date()
        }
        if (adminNote) {
            updatePayload[TableFields.note] = adminNote // Using note field for admin note
        }

        return await WalletTransaction.updateOne(
            {
                [TableFields.ID]: MongoUtil.toObjectId(transactionId)
            },
            {
                $set: updatePayload
            }
        )
    }
}

const ProjectionBuilder = class {
    constructor(methodToExecute) {
        const projection = {};
        this.withBasicInfo = () => {
            projection[TableFields.ID] = 1;
            projection[TableFields.fromUserDetail] = 1;
            projection[TableFields.toUserDetail] = 1;
            projection[TableFields.transactionType] = 1;
            projection[TableFields.transactionAmount] = 1;
            projection[TableFields.transactionId] = 1;
            projection[TableFields.transactionStatus] = 1;
            projection[TableFields.bankReferenceId] = 1;
            projection[TableFields.description] = 1;
            projection[TableFields.note] = 1;
            projection[TableFields.processedAt] = 1;
            return this;
        };
        this.withTimeStamps = () => {
            projection[TableFields._createdAt] = 1;
            projection[TableFields._updatedAt] = 1;
            return this;
        };

        this.execute = async () => {
            return await methodToExecute.call(projection);
        };
    }
};

module.exports = WalletTransactionService;
