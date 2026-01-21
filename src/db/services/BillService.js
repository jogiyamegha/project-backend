const {ValidationMsgs, TableFields, TableNames, PlantStatus, UserPaymentMethod} = require("../../utils/constants");
const Util = require("../../utils/util");
const ValidationError = require("../../utils/ValidationError");
const Bill = require("../models/bill");
const {MongoUtil} = require("../mongoose");

class BillService {
    static getUserById = (userId) => {
        return new ProjectionBuilder(async function () {
            return await Bill.findOne({[TableFields.ID]: userId}, this);
        });
    };

    static recordExists = async (recordId) => {
        return await Bill.exists({
            [TableFields.ID]: MongoUtil.toObjectId(recordId),
        });
    };

    static existForMonthPpaId = async (ppaId, billingMonth, billingYear) => {
        return await Bill.exists({
            [`${TableFields.ppaDetail}.${TableFields.ppaId}`] : MongoUtil.toObjectId(ppaId),
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
            let searchQuery = {};

            let searchTerm = filter.searchTerm;

            if (filter.ppaId) {
                searchQuery[`${TableFields.ppaDetail}?.${TableFields.ppaId}`] = filter.ppaId
            }
            if (filter.billingMonth) {
                searchQuery[TableFields.billingMonth] = filter.billingMonth
            }
            if (filter.billingYear) {
                searchQuery[TableFields.billingYear] = filter.billingYear
            }

            return await Promise.all([
                needCount ? Bill.countDocuments(searchQuery) : undefined,
                Bill.find(searchQuery, this)
                    .limit(parseInt(limit))
                    .skip(parseInt(skip))
                    .sort({[sortKey]: parseInt(sortOrder)}),
            ]).then(([total, records]) => ({total, records}));
        });
    };

    static updateRecord = async (recordId, updatedUserFields = {}) => {
        if (await DiseaseService.existsWithName(updatedUserFields[TableFields.name_], recordId)) {
            throw new ValidationError(ValidationMsgs.DiseaseExist);
        }

        let record = await Disease.findByIdAndUpdate(
            recordId,
            {
                ...updatedUserFields,
                [TableFields._updatedAt]: Date.now(),
            },
            {
                new: false,
                projection: {[TableFields.ID]: 1},
            }
        );
        if (!record) {
            throw new ValidationError(ValidationMsgs.RecordNotFound);
        }
    };

    static updateBillStatus = async (recordId, updatedFields = {}) => {
        return await Bill.findOneAndUpdate(
            MongoUtil.toObjectId(recordId),
            {
                ...updatedFields,
                [TableFields._updatedAt] : new Date()
            },
            { new: true }
        )
    }

    static updateCashPayment = async (billId) => {
        return await Bill.updateOne(
            {
                [TableFields.ID] : MongoUtil.toObjectId(billId),
            },
            {
                [TableFields.userPaymentMethod] : UserPaymentMethod.Cash,
                [TableFields.isPaid] : true,
                [TableFields.paymentDate] : new Date(),
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
