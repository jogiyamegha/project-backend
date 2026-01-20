const {ValidationMsgs, TableFields, TableNames, PlantStatus} = require("../../utils/constants");
const Util = require("../../utils/util");
const ValidationError = require("../../utils/ValidationError");
const Ppa = require("../models/ppa");
const {MongoUtil} = require("../mongoose");

class PpaService {
    static getUserById = (userId) => {
        return new ProjectionBuilder(async function () {
            return await Ppa.findOne({[TableFields.ID]: userId}, this);
        });
    };

    static recordExists = async (recordId) => {
        return await Ppa.exists({
            [TableFields.ID]: MongoUtil.toObjectId(recordId),
        });
    };

    static existWithPlantId = async (plantId) => {
        return await Ppa.exists({
            [`${TableFields.plantDetail}.${TableFields.plantId}`] : MongoUtil.toObjectId(plantId)
        })
    }

    static insertRecord = async (updatedFields) => {
        const record = new Ppa({
            ...updatedFields,
        });

        try {
            await record.save();
            return record;
        } catch (error) {
            if (error.code == 11000) {
                //Mongoose duplicate email error
                throw new ValidationError(ValidationMsgs.PpaExists);
            }
            throw error;
        }
    };

    static listPpa = (filter = {}) => {
        return new ProjectionBuilder(async function () {
            let limit = filter.limit || 0;
            let skip = filter.skip || 0;
            let sortKey = filter.sortKey || TableFields._createdAt;
            let sortOrder = filter.sortOrder || 1;
            let needCount = Util.parseBoolean(filter.needCount);
            let searchQuery = {};

            let searchTerm = filter.searchTerm;
            // if (searchTerm) {
            //     searchQuery = {
            //         $or: [
            //                 {
            //                     [`${TableFields.propertyAddress}.${TableFields.address}`]: {
            //                         $regex: Util.wrapWithRegexQry(searchTerm),
            //                         $options: "i",
            //                     },
            //                 },
            //                 {
            //                     [`${TableFields.propertyAddress}.${TableFields.city}`]: {
            //                         $regex: Util.wrapWithRegexQry(searchTerm),
            //                         $options: "i",
            //                     },
            //                 },
            //                 {
            //                     [`${TableFields.propertyAddress}.${TableFields.state}`]: {
            //                         $regex: Util.wrapWithRegexQry(searchTerm),
            //                         $options: "i",
            //                     },
            //                 },
            //         ],
            //     };
            // }
            if (filter.plantId) {
                searchQuery[`${TableFields.plantDetail}.${TableFields.plantId}`] = filter.plantId;
            }
            
            if (filter.userId) {
                searchQuery[`${TableFields.plantDetail}.${TableFields.userId}`] = filter.userId;
            }
            
            if (filter.isSigned) {
                searchQuery[TableFields.isSigned] = filter.isSigned;
            }

            return await Promise.all([
                needCount ? Ppa.countDocuments(searchQuery) : undefined,
                Ppa.find(searchQuery, this)
                    .limit(parseInt(limit))
                    .skip(parseInt(skip))
                    .sort({[sortKey]: parseInt(sortOrder)}),
            ]).then(([total, records]) => ({total, records}));
        });
    };

    static updateSign = async (ppaId) => {
        return await Ppa.updateOne(
            { [TableFields.ID]: ppaId },  
            { 
                $set: {
                    [TableFields.isSigned]: true,
                    [TableFields.signedAt]: new Date()
                }
            } 
        );
    }


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
            projection[TableFields.ppaUniqueId] = 1;
            projection[TableFields.ppaName] = 1;
            projection[TableFields.plantDetail] = 1;
            projection[TableFields.plantCapacity] = 1;
            projection[TableFields.tarrif] = 1;
            projection[TableFields.expectedYears] = 1;
            projection[TableFields.startDate] = 1;
            projection[TableFields.endDate] = 1;
            projection[TableFields.ppaDocument] = 1;
            projection[TableFields.leaseDocument] = 1;
            projection[TableFields.isSigned] = 1;
            projection[TableFields.deleted] = 1;
            return this;
        };
        this.withTimeStamps = () => {
            projection[TableFields._createdAt] = 1;
            projection[TableFields._updatedAt] = 1;
            return this;
        };
        this.withId = () => {
            projection[TableFields.ID] = 1;
            return this;
        };
        this.withSigned = () => {
            projection[TableFields.isSigned] = 1;
            return this;
        };
        this.execute = async () => {
            return await methodToExecute.call(projection);
        };
    }
};

module.exports = PpaService;
