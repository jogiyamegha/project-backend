const {ValidationMsgs, TableFields, TableNames, PlantStatus} = require("../../utils/constants");
const {removeFileById, Folders} = require("../../utils/storage");
const { StripeManager } = require("../../utils/stripeManager");
const Util = require("../../utils/util");
const ValidationError = require("../../utils/ValidationError");
const Plant = require("../models/plant");
const {MongoUtil} = require("../mongoose");
const UserService = require("./UserService");
const PDFCreator = require("../../utils/pdfCreator")

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

    static generatePlantPdf = async (plant) => {
        const utcOffset = 330;
        const plantData = [];  
        plantData.push(plant);
    
        let contents = [
            ...PDFCreator.getTitleHeader('Plant Information',
            null, null,
            Util.formatToDdMmYyyyWithTime(new Date(), utcOffset))
        ]
    
        contents.push(PDFCreator.getTwoLineBreak());

        contents.push([{
            columns: [
                { text: `PLANT ID: ${plant[TableFields.plantUniqueId] || '-'}`, style: 'tableData3', alignment: 'left'},
            ]
        }]);
    
        contents.push(PDFCreator.getOneLineBreak());

        contents.push([{
            columns: [
                { text: `Added By: ${plant?.[TableFields.userDetails]?.[TableFields.name_] || '-'}`, style: 'tableData3', alignment: 'left' }
            ]
        }]);
        contents.push(PDFCreator.getOneLineBreak());
        
        contents.push({
            columns: [
                { text: `Plant (Property) Name: ${plant?.[TableFields.propertyAddress]?.[TableFields.propertyName]}`, style: 'tableData3', alignment: 'left' },
            ]
        });
    
        contents.push(PDFCreator.getOneLineBreak());
        
        contents.push({
            columns: [
                { text: `Property Type: ${plant?.[TableFields.propertyAddress]?.[TableFields.propertyType]}`, style: 'tableData3', alignment: 'left' },
            ]
        });
    
        contents.push(PDFCreator.getOneLineBreak());
        
        contents.push({
            columns: [
                { text: `Plant (Property) Address: ${plant?.[TableFields.propertyAddress]?.[TableFields.address]}`, style: 'tableData3', alignment: 'left' },
            ]
        });
        
        contents.push(PDFCreator.getOneLineBreak());
        
        contents.push({
            columns: [
                { text: `Plant RoofArea : ${plant?.[TableFields.propertyAddress]?.[TableFields.roofArea]}`, style: 'tableData3', alignment: 'left' },
            ]
        });
    
        contents.push(PDFCreator.getOneLineBreak());
        
        contents.push({
            columns: [
                { text: `Plant (Property) Pincode: ${plant?.[TableFields.propertyAddress]?.[TableFields.pincode]}`, style: 'tableData3', alignment: 'left' },
            ]
        }); 
        
        contents.push(PDFCreator.getOneLineBreak());
        
        contents.push({
            columns: [
                { text: `Plant (Property) City: ${plant?.[TableFields.propertyAddress]?.[TableFields.city]}`, style: 'tableData3', alignment: 'left' },
            ]
        });
        
        contents.push(PDFCreator.getOneLineBreak());
        
        contents.push({
            columns: [
                { text: `Plant (Property) State: ${plant?.[TableFields.propertyAddress]?.[TableFields.state]}`, style: 'tableData3', alignment: 'left' },
            ]
        });
    
        contents.push(PDFCreator.getOneLineBreak());
    
        contents.push({
            columns: [
                { text: `Bill Amount: ${plant?.[TableFields.propertyAddress]?.[TableFields.billAmount]}`, style: 'tableData3', alignment: 'left' },
            ]
        });
        
        contents.push(PDFCreator.getOneLineBreak());
    
        contents.push({
            columns: [
                { text: `Electricity rate: ${plant?.[TableFields.propertyAddress]?.[TableFields.electricityRate]}`, style: 'tableData3', alignment: 'left' },
            ]
        });

        contents.push(PDFCreator.getOneLineBreak());

        const file = await PDFCreator.generatePDFBuffer(contents)
        return file;
    }

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
                                [TableFields.plantUniqueId] : {
                                    $regex: Util.wrapWithRegexQry(searchTerm),
                                    $options: "i",
                                }
                            },
                            {
                                [TableFields.plantUniqueName] : {
                                    $regex: Util.wrapWithRegexQry(searchTerm),
                                    $options: "i",
                                }
                            },
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

    static updateRecord = async (recordId, updatedFields = {}) => {
        const record = await Plant.findByIdAndUpdate(
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

    static updatePlantStatus = async (plantId, plantStatus, user, plantUniqueName) => {
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

            // create stripe customer Now
            const plantDetail = await PlantService.getUserById(plantId).withUser().execute()
            const customerId = plantDetail?.[TableFields.userDetails]?.[TableFields.userId];

            const customerDetail = await UserService.getUserById(customerId).withBasicInfo().execute();
            const stripeCustomer = await StripeManager.createCustomer(
                customerDetail[TableFields.name_],
                customerDetail[TableFields.email],
                customerDetail[TableFields.phone],
                customerDetail[TableFields.phoneCountry],
            )

            await UserService.updateRecord(customerId, {
                [TableFields.stripeCustomerId] : stripeCustomer.id
            })
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
                [TableFields.ID]: MongoUtil.toObjectId(plantId),
            },
            {
                $set: updatePayload,
            }
        );
    };

    static updateUserDelete = async (userId) => {
        return await Plant.updateMany(
            {
                [`${TableFields.userDetails}.${TableFields.userId}`]: MongoUtil.toObjectId(userId)
            },
            {
                $set: {
                    [TableFields.userDeleted]: true
                }
            }
        )
    }

    static updateDelete = async (plantId) => {
        return await Plant.updateOne(
            {
                [TableFields.ID] : MongoUtil.toObjectId(plantId)
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
