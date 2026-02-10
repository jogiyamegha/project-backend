const { ValidationMsgs, TableFields, TableNames, PlantStatus, UserPaymentMethod } = require("../../utils/constants");
const Util = require("../../utils/util");
const ValidationError = require("../../utils/ValidationError");
const Bill = require("../models/bill");
const { MongoUtil } = require("../mongoose");

class BillService {
    static getUserById = (userId) => {
        return new ProjectionBuilder(async function () {
            return await Bill.findOne({ [TableFields.ID]: userId }, this);
        });
    };

    static recordExists = async (recordId) => {
        return await Bill.exists({
            [TableFields.ID]: MongoUtil.toObjectId(recordId),
        });
    };

    static existForMonthPpaId = async (ppaId, billingMonth, billingYear) => {
        return await Bill.exists({
            [`${TableFields.ppaDetail}.${TableFields.ppaId}`]: MongoUtil.toObjectId(ppaId),
            [TableFields.billingMonth]: billingMonth,
            [TableFields.billingYear]: billingYear,
        })
    }

    static insertRecord = async (updatedFields) => {
        const record = new Bill({
            ...updatedFields,
        });

        try {
            await record.save();
            return record;
        } catch (error) {
            if (error.code == 11000) {
                //Mongoose duplicate email error
                throw new ValidationError(ValidationMsgs.BillExists);
            }
            throw error;
        }
    };

    static listBills = (filter = {}) => {
        return new ProjectionBuilder(async function () {
            let limit = filter.limit || 0;
            let skip = filter.skip || 0;
            let sortKey = filter.sortKey || TableFields._createdAt;
            let sortOrder = filter.sortOrder || 1;
            let needCount = Util.parseBoolean(filter.needCount);
            let searchQuery = {
                [TableFields.deleted] : false
            };

            let searchTerm = filter.searchTerm;
            if (searchTerm) {
                searchQuery = {
                    $or: [
                        {
                            [`${TableFields.ppaDetail}.${TableFields.ppaName}`]: {
                                $regex: Util.wrapWithRegexQry(searchTerm),
                                $options: "i",
                            },
                        },
                        {
                            [`${TableFields.ppaDetail}.${TableFields.ppaUniqueId}`]: {
                                $regex: Util.wrapWithRegexQry(searchTerm),
                                $options: "i",
                            },
                        },
                    ],
                };
            }

            if (filter.ppaId) {
                searchQuery[`${TableFields.ppaDetail}.${TableFields.ppaId}`] = filter.ppaId;
            }
            if (filter.userId) {
                searchQuery[`${TableFields.ppaDetail}.${TableFields.userId}`] = filter.userId;
            }
            if (filter.billingMonth) {
                searchQuery[TableFields.billingMonth] = filter.billingMonth;
            }
            if (filter.billingYear) {
                searchQuery[TableFields.billingYear] = filter.billingYear;
            }
            if (filter.userPaymentMethod) {
                searchQuery[TableFields.userPaymentMethod] = filter.userPaymentMethod;
            }
            if (filter.isPaid) {
                searchQuery[TableFields.isPaid] = filter.isPaid;
            }

            return await Promise.all([
                needCount ? Bill.countDocuments(searchQuery) : undefined,
                Bill.find(searchQuery, this)
                    .limit(parseInt(limit))
                    .skip(parseInt(skip))
                    .sort({ [sortKey]: parseInt(sortOrder) }),
            ]).then(([total, records]) => ({ total, records }));
        });
    };

    static updateRecord = async (recordId, updatedFields = {}) => {
        const record = await Bill.findByIdAndUpdate(
            recordId,
            {
                $set: {
                    ...updatedFields,
                    [TableFields._updatedAt]: Date.now(),
                },
            },
            { new: true }
        );

        if (!record) {
            throw new ValidationError(ValidationMsgs.RecordNotFound);
        }

        return record;
    };

    static updateBillStatus = async (recordId, updatedFields = {}) => {
        return await Bill.findOneAndUpdate(
            MongoUtil.toObjectId(recordId),
            {
                ...updatedFields,
                [TableFields._updatedAt]: new Date()
            },
            { new: true }
        )
    }

    static requestCashPayment = async (billId) => {
        return await Bill.updateOne(
            {
                [TableFields.ID]: MongoUtil.toObjectId(billId),
            },
            {
                [TableFields.userPaymentMethod]: UserPaymentMethod.Cash,
                [TableFields.paymentStatus]: 2, // Processing
            }
        )
    }

    static updateCashPayment = async (billId, adminNote) => {
        return await Bill.updateOne(
            {
                [TableFields.ID]: MongoUtil.toObjectId(billId),
            },
            {
                [TableFields.userPaymentMethod]: UserPaymentMethod.Cash,
                [TableFields.isPaid]: true,
                [TableFields.paymentStatus]: 3, // Completed
                [TableFields.paymentDate]: new Date(),
                [TableFields.adminNote]: adminNote
            }
        )
    }

    static updatePlantInfo = async (plantId, plantObj) => {
        const { plantUniqueName } = plantObj
        await Bill.updateMany(
            {
                [TableFields.ppaDetail + '.' + TableFields.plantId]: MongoUtil.toObjectId(plantId)
            },
            {
                [TableFields.ppaDetail + '.' + TableFields.plantUniqueName]: plantUniqueName,
            }
        )
    }

    static updatePpaInfo = async (ppaId, ppaObj) => {
        const { plantId } = ppaObj
        const { plantUniqueId } = ppaObj
        const { plantUniqueName } = ppaObj
        const { ppaName } = ppaObj
        const { tarrif } = ppaObj
        const { plantCapacity } = ppaObj

        await Bill.updateMany(
            {
                [TableFields.ppaDetail + '.' + TableFields.ppaId]: MongoUtil.toObjectId(ppaId)
            },
            {
                [TableFields.ppaDetail + '.' + TableFields.plantId]: plantId,
                [TableFields.ppaDetail + '.' + TableFields.plantUniqueId]: plantUniqueId,
                [TableFields.ppaDetail + '.' + TableFields.plantUniqueName]: plantUniqueName,
                [TableFields.ppaDetail + '.' + TableFields.ppaName]: ppaName,
                [TableFields.ppaDetail + '.' + TableFields.tarrif]: tarrif,
                [TableFields.ppaDetail + '.' + TableFields.plantCapacity]: plantCapacity,
            }
        )
    }

    static updatePpaDeleted = async (ppaId) => {
        return await Bill.updateMany(
            {
                [`${TableFields.ppaDetail}.${TableFields.ppaId}`]: MongoUtil.toObjectId(ppaId)
            },
            {
                $set: {
                    [TableFields.ppaDeleted]: true
                }
            }
        )
    }

    static updateDelete = async (billId) => {
        return await Bill.updateOne(
            {
                [TableFields.ID]: MongoUtil.toObjectId(billId)
            },
            {
                $set: {
                    [TableFields.deleted]: true,
                    [TableFields._deletedAt]: new Date()
                }
            }
        )
    }


    static deleteMyReferences = async (cascadeDeleteMethodReference, tableName, ...referenceId) => {
        let records = undefined;
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
            projection[TableFields.ppaDetail] = 1;
            projection[TableFields.billingMonth] = 1;
            projection[TableFields.billingYear] = 1;
            projection[TableFields.generatedUnits] = 1;
            projection[TableFields.consumedUnits] = 1;
            projection[TableFields.exportedUnits] = 1;
            projection[TableFields.totalAmount] = 1;
            projection[TableFields.isPaid] = 1;
            projection[TableFields.userPaymentMethod] = 1;
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

module.exports = BillService;
