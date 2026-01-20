const {ValidationMsgs, TableFields, TableNames, PlantStatus} = require("../../utils/constants");
const {removeFileById, Folders} = require("../../utils/storage");
const Util = require("../../utils/util");
const ValidationError = require("../../utils/ValidationError");
const Plant = require("../models/plant");
const {MongoUtil} = require("../mongoose");

class PlantService {
    static getUserById = (userId) => {
        return new ProjectionBuilder(async function () {
            return await Plant.findOne({[TableFields.ID]: userId}, this);
        });
    };

    static recordExists = async (recordId) => {
        return await Plant.exists({
            [TableFields.ID]: MongoUtil.toObjectId(recordId),
        });
    };

    static insertRecord = async (updatedFields) => {
        const record = new Plant({
            ...updatedFields,
        });

        console.log("record", record);
        try {
            await record.save();
            return record;
        } catch (error) {
            if (error.code == 11000) {
                //Mongoose duplicate email error
                throw new ValidationError(ValidationMsgs.PlantExists);
            }
            throw error;
        }
    };

    static listPlants = (filter = {}) => {
        return new ProjectionBuilder(async function () {
            let limit = filter.limit || 0;
            let skip = filter.skip || 0;
            let sortKey = filter.sortKey || TableFields._createdAt;
            let sortOrder = filter.sortOrder || 1;
            let needCount = Util.parseBoolean(filter.needCount);
            let searchQuery = {};

            let searchTerm = filter.searchTerm;
            if (searchTerm) {
                searchQuery = {
                    $or: [
                            {
                                [`${TableFields.propertyAddress}.${TableFields.address}`]: {
                                    $regex: Util.wrapWithRegexQry(searchTerm),
                                    $options: "i",
                                },
                            },
                            {
                                [`${TableFields.propertyAddress}.${TableFields.city}`]: {
                                    $regex: Util.wrapWithRegexQry(searchTerm),
                                    $options: "i",
                                },
                            },
                            {
                                [`${TableFields.propertyAddress}.${TableFields.state}`]: {
                                    $regex: Util.wrapWithRegexQry(searchTerm),
                                    $options: "i",
                                },
                            },
                    ],
                };
            }

            
            if (filter.userId) {
                searchQuery[`${TableFields.userDetails}.${TableFields.userId}`] = filter.userId;
            }
            
            if (filter.plantStatus) {
                searchQuery[TableFields.plantStatus] = Number(filter.plantStatus);
            }

            if (filter.propertyType) {
                searchQuery[`${TableFields.propertyAddress}.${TableFields.propertyType}`] = Number(filter.propertyType)
            }

            return await Promise.all([
                needCount ? Plant.countDocuments(searchQuery) : undefined,
                Plant.find(searchQuery, this)
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

    static updatePlantStatus = async (recordId, plantStatus, user, plantUniqueName) => {
        const status = Number(plantStatus);

        let updatePayload = {
            [TableFields.plantStatus]: status,
        };

        if (status === PlantStatus.Approved) {
            if (!plantUniqueName) {
                throw new ValidationError(ValidationMsgs.PlantUniqueNameEmpty)
            }
            const isValidPlantUniqueName = Util.isValidPlantUniqueName(plantUniqueName);
            if(!isValidPlantUniqueName) {
                throw new ValidationError(ValidationMsgs.InvalidPlantUniqueName);
            }
            const upperName = plantUniqueName.toUpperCase().trim();
            
            updatePayload[TableFields.plantUniqueName] = upperName;            
            
            updatePayload[`${TableFields.approvedBy}.${TableFields.userDetails}`] = {
                [TableFields.userId]: user[TableFields.ID],
                [TableFields.userType]: user[TableFields.userType],
                [TableFields.name_]: user[TableFields.name_],
                [TableFields.approvedOn]: new Date(),
            };
        }

        if (status === PlantStatus.Rejected) {
            updatePayload[`${TableFields.rejectedBy}.${TableFields.userDetails}`] = {
                [TableFields.userId]: user[TableFields.ID],
                [TableFields.userType]: user[TableFields.userType],
                [TableFields.name_]: user[TableFields.name_],
                [TableFields.rejectedOn]: new Date(),
                [TableFields.rejectionReason] : 'rejection reason'
            };
        }

        await Plant.updateOne(
            {
                [TableFields.ID]: MongoUtil.toObjectId(recordId),
            },
            {
                $set: updatePayload,
            }
        );
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
            projection[TableFields.plantUniqueName] = 1;            
            projection[TableFields.plantUniqueId] = 1;            
            projection[TableFields.userDetails] = 1;
            projection[TableFields.propertyAddress] = 1;
            projection[TableFields.plantStatus] = 1;
            projection[TableFields.approvedBy] = 1;
            projection[TableFields.rejectedBy] = 1;
            projection[TableFields.isActive] = 1;
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
        this.withUser = () => {
            projection[TableFields.userDetails] = 1;
            return this;
        };
        this.withPropertyAddress = () => {
            projection[TableFields.propertyAddress] = 1;
            return this;
        }
        this.withPlantStatus = () => {
            projection[TableFields.plantStatus] = 1;
            return this;
        };

        this.execute = async () => {
            return await methodToExecute.call(projection);
        };
    }
};

module.exports = PlantService;
