const PpaService = require("../../db/services/PpaService");
const PlantService = require("../../db/services/PlantService");
const UserService = require('../../db/services/UserService');
const ServiceManager = require("../../db/serviceManager");
const {
    TableFields,
    ValidationMsgs,
    UserTypes,
    AuthTypes,
    TableNames,
    InterfaceTypes,
    PlantStatus,
} = require("../../utils/constants");
const ValidationError = require("../../utils/ValidationError");
const Email = require("../../emails/email");
const {Folders} = require("../../utils/metadata");
const {addFile, createThumbnailSingle, removeFileById} = require("../../utils/storage");

exports.createPpa = async (req) => {
    let reqBody = req.body;
    let providedFiles = req.files || [];
    if (!providedFiles.length) {
        throw new ValidationError(ValidationMsgs.FileEmpty)
    }

    let documents = [];
    if(providedFiles.length > 0) {
        const docs = [];

        providedFiles.forEach((a) => {
            docs.push(new Promise(async (resolve) => {
                const filename = await addFile(
                    Folders.PpaDocs,
                    a.originalname,
                    a.buffer,
                    true,
                    a
                );
                resolve({
                    originalname: a.originalname, url: filename
                })
            }))
        })
        documents = await Promise.all(docs);
    }

    const plantId = reqBody[TableFields.plantId];
    if(!plantId) {
        throw new ValidationError(ValidationMsgs.PlantIdEmpty)
    }
    const alreadyCreatedForPlant = await PpaService.existWithPlantId(plantId);
    if(alreadyCreatedForPlant) {
        throw new ValidationError(ValidationMsgs.PpaAlreadyCreatedForPlant)
    }

    return await parseAndValidatePpa(
        reqBody, 
        undefined, 
        documents, 
        async (updatedUserFields) => {
            return await PpaService.insertRecord(updatedUserFields);
        }
    );
};

exports.listPPa = async (req) => {
    return await PpaService.listPpa({
        ...req.query,
    })
    .withBasicInfo()
    .withTimeStamps()
    .execute();
};

exports.ppaInfo = async (req) => {
    const ppaId = req.params[TableFields.ID];
    const ppa = await PpaService.getUserById(ppaId).withBasicInfo().execute();
    if (!ppa) {
        throw new ValidationError(ValidationMsgs.RecordNotExists);
    }
    return ppa;
}


exports.updatePlantStatus = async(req) => {
    const reqBody = req.body;
    const plantId = req.params[TableFields.ID];
    const reqUser = req.user;

    const plantExists = await PlantService.recordExists(plantId);
    if (!plantExists) {
        throw new ValidationError(ValidationMsgs.RecordNotExists);
    }

    return await PlantService.updatePlantStatus(plantId, reqBody[TableFields.plantStatus], reqUser);
}

// async function parseAndValidatePpa(
//     reqBody,
//     existingPlant = {},
//     providedFileArray,
//     onValidationCompleted = async () => {}
// ) {
//     console.log("providedFileArray", providedFileArray);
    
//     if (isFieldEmpty(reqBody[TableFields.plantId], existingPlant[`${TableFields.plantDetail}.${TableFields.plantId}`])) {
//         throw new ValidationError(ValidationMsgs.PlantIdEmpty);
//     }
//     if (isFieldEmpty(reqBody[TableFields.plantCapacity], existingPlant[TableFields.plantCapacity])){
//         throw new ValidationError(ValidationMsgs.PlantCapacityEmpty);
//     }
//     if (isFieldEmpty(reqBody[TableFields.tarrif], existingPlant[TableFields.tarrif])) {
//         throw new ValidationError(ValidationMsgs.TarrifEmpty);
//     }
//     if (isFieldEmpty(reqBody[TableFields.expectedYears], existingPlant[TableFields.expectedYears])) {
//         throw new ValidationError(ValidationMsgs.ExpectedYearsEmpty);
//     }
//     if (isFieldEmpty(reqBody[TableFields.startDate], existingPlant[TableFields.startDate])) {
//         throw new ValidationError(ValidationMsgs.StartDateEmpty);
//     }

//     const ppaFile = providedFileArray?.[0];
//     const leaseFile = providedFileArray?.[1];

//     console.log("ppaFile",ppaFile);
//     console.log("leaseFile",leaseFile);

//     if (!ppaFile) {
//         throw new ValidationError(ValidationMsgs.PpaDocumentEmpty);
//     }
    
//     if (!leaseFile) {
//         throw new ValidationError(ValidationMsgs.LeaseDocumentEmpty);
//     }
    
//     const plantInfo = await PlantService.getUserById(reqBody[TableFields.plantId]).withUser().withPlantStatus().execute() 
//     const currentPlantStatus = plantInfo?.[TableFields.plantStatus];
//     if(currentPlantStatus !== PlantStatus.Approved) {
//         throw new ValidationError(ValidationMsgs.PlantNotApproveToCreatePpa)
//     }
    
//     const existingPpaFileKey = existingPlant[TableFields.ppaDocument];
//     let persistedPpaKey = existingPpaFileKey;
    
//     const existingLeaseFileKey = existingPlant[TableFields.leaseDocument];
//     let persistedLeaseKey = existingLeaseFileKey;
    
//     let response;
//     try {
//         if (ppaFile) {
//             let newPpaFileKey = await addFile(
//             Folders.PpaDocs,
//                 providedFileArray[0].originalname,
//                 providedFileArray[0].buffer, 
//                 true,
//                 providedFileArray[0]
//             );

//             console.log("here", newPpaFileKey);
//             persistedPpaKey = newPpaFileKey;
//         }
        
//         if (leaseFile) {
//             let newLeaseFileKey = await addFile(
//                 Folders.LeaseDocs,
//                 providedFileArray?.[1].originalname,
//                 providedFileArray?.[1].buffer,
//                 true,
//                 providedFileArray?.[1]
//             );
//             persistedLeaseKey = newLeaseFileKey;
//         }
//         const startDate = new Date(reqBody[TableFields.startDate]);
//         let endDate = new Date(startDate);
//         endDate.setFullYear(startDate.getFullYear() + Number(reqBody[TableFields.expectedYears]));

//         response = await onValidationCompleted({
//             [`${TableFields.plantDetail}.${TableFields.plantId}`]: reqBody[TableFields.plantId],
//             [`${TableFields.plantDetail}.${TableFields.userId}`]: plantInfo?.[`${TableFields.userDetails}.${TableFields.userId}`],
//             [TableFields.plantCapacity]: reqBody[TableFields.plantCapacity],
//             [TableFields.tarrif]: reqBody[TableFields.tarrif],
//             [TableFields.plantCapacity]: reqBody[TableFields.plantCapacity],
//             [TableFields.expectedYears]: reqBody[TableFields.expectedYears],
//             [TableFields.startDate]: reqBody[TableFields.startDate],
//             [TableFields.endDate] : endDate,
//             [TableFields.ppaDocument]: persistedPpaKey,
//             [TableFields.leaseDocument]: persistedLeaseKey,
//         });
//         return response;
//     } catch (error) {
//         throw error;
//     }
// }

async function parseAndValidatePpa(
    reqBody,
    existingPlant = {},
    providedFileArray,
    onValidationCompleted = async () => {}
) {
    if (isFieldEmpty(reqBody[TableFields.plantId], existingPlant[`${TableFields.plantDetail}.${TableFields.plantId}`])) {
        throw new ValidationError(ValidationMsgs.PlantIdEmpty);
    }

    if (isFieldEmpty(reqBody[TableFields.plantCapacity], existingPlant[TableFields.plantCapacity])) {
        throw new ValidationError(ValidationMsgs.PlantCapacityEmpty);
    }

    if (isFieldEmpty(reqBody[TableFields.tarrif], existingPlant[TableFields.tarrif])) {
        throw new ValidationError(ValidationMsgs.TarrifEmpty);
    }

    if (isFieldEmpty(reqBody[TableFields.expectedYears], existingPlant[TableFields.expectedYears])) {
        throw new ValidationError(ValidationMsgs.ExpectedYearsEmpty);
    }

    if (isFieldEmpty(reqBody[TableFields.startDate], existingPlant[TableFields.startDate])) {
        throw new ValidationError(ValidationMsgs.StartDateEmpty);
    }

    const ppaFile = providedFileArray?.[0];
    const leaseFile = providedFileArray?.[1];

    if (!ppaFile) {
        throw new ValidationError(ValidationMsgs.PpaDocumentEmpty);
    }

    if (!leaseFile) {
        throw new ValidationError(ValidationMsgs.LeaseDocumentEmpty);
    }

    const plantInfo = await PlantService
        .getUserById(reqBody[TableFields.plantId])
        .withUser()
        .withPlantStatus()
        .execute();

    if (plantInfo?.[TableFields.plantStatus] !== PlantStatus.Approved) {
        throw new ValidationError(ValidationMsgs.PlantNotApproveToCreatePpa);
    }

    let persistedPpaKey = ppaFile.url;
    let persistedLeaseKey = leaseFile.url;

    const startDate = new Date(reqBody[TableFields.startDate]);
    const endDate = new Date(startDate);
    endDate.setFullYear(startDate.getFullYear() + Number(reqBody[TableFields.expectedYears]));

    return await onValidationCompleted({
        [`${TableFields.plantDetail}.${TableFields.plantId}`]: reqBody[TableFields.plantId],
        [`${TableFields.plantDetail}.${TableFields.userId}`]: plantInfo?.[TableFields.userDetails]?.[TableFields.userId],
        [TableFields.plantCapacity]: reqBody[TableFields.plantCapacity],
        [TableFields.tarrif]: reqBody[TableFields.tarrif],
        [TableFields.expectedYears]: reqBody[TableFields.expectedYears],
        [TableFields.startDate]: reqBody[TableFields.startDate],
        [TableFields.endDate]: endDate,
        [TableFields.ppaDocument]: persistedPpaKey,
        [TableFields.leaseDocument]: persistedLeaseKey,
    });
}

function isFieldEmpty(providedField, existingField) {
    if (providedField != undefined) {
        if (providedField) {
            return false;
        }
    } else if (existingField) {
        return false;
    }
    return true;
}
