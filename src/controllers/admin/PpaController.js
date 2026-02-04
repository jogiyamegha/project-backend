const PpaService = require("../../db/services/PpaService");
const PlantService = require("../../db/services/PlantService");
const UserService = require('../../db/services/UserService');
const ServiceManager = require("../../db/serviceManager");
const { TableFields, ValidationMsgs, PlantStatus, CounterSchemaType } = require("../../utils/constants");
const ValidationError = require("../../utils/ValidationError");
const Email = require("../../emails/email");
const {Folders} = require("../../utils/metadata");
const {addFile,  removeFileById} = require("../../utils/storage");
const CounterService = require("../../db/services/CounterService");
const BillService = require("../../db/services/BillService");

exports.createPpa = async (req) => {
    let reqBody = req.body;
    let providedFiles = req.files || [];
    if (!providedFiles.length) {
        throw new ValidationError(ValidationMsgs.FileEmpty)
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
        providedFiles,
        false, 
        async (updatedUserFields) => {
            return await PpaService.insertRecord(updatedUserFields);
        }
    );
};

exports.editPpa = async (req) => {
    const reqBody = req.body;
    const ppaId = req.params[TableFields.ID];
    let providedFiles = req.files || [];

    const existingPpa = await PpaService.getUserById(ppaId).withBasicInfo().execute();
    if(!existingPpa) {
        throw new ValidationError(ValidationMsgs.RecordNotExists);
    }
    if(existingPpa && existingPpa[TableFields.deleted]) {
        throw new ValidationError(ValidationMsgs.RecordNotExists);
    }

    let ppaObj = null;
    const response = await parseAndValidatePpa(
        reqBody,
        existingPpa,
        providedFiles,
        true,
        async (updatedFields) => {
            const record = await PpaService.updateRecord(ppaId, updatedFields);
            ppaObj = {
                plantId : record?.[TableFields.plantDetail]?.[TableFields.plantId],
                plantUniqueId : record?.[TableFields.plantDetail]?.[TableFields.plantUniqueId],
                plantUniqueName : record?.[TableFields.plantDetail]?.[TableFields.plantUniqueName],
                ppaName : record?.[TableFields.ppaName],
                tarrif : record?.[TableFields.tarrif],
                plantCapacity : record?.[TableFields.plantCapacity],
            }
            BillService.updatePpaInfo(ppaId, ppaObj);
            return record;
        }
    )
    return response
}

exports.listPPa = async (req) => {
    return await PpaService.listPpa({
        ...req.query,
    })
    .withBasicInfo()
    .withSigned()
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

exports.signPpa = async (req) => {
    const ppaId = req.params[TableFields.ID];
    const ppa = await PpaService.recordExists(ppaId);
    if (!ppa) {
        throw new ValidationError(ValidationMsgs.RecordNotExists);
    }
    
    return await PpaService.updateSign(ppaId);
}

async function parseAndValidatePpa(
    reqBody,
    existingPpa = {},
    providedFileArray,
    update = false,
    onValidationCompleted = async () => {}
) {
    let ppaUniqueId =  await CounterService.consumeSingleKey(CounterSchemaType.Ppa);

    if (isFieldEmpty(reqBody[TableFields.ppaName], existingPpa?.[TableFields.ppaName])){
        throw new ValidationError(ValidationMsgs.PpaNameEmpty);
    }
    if (isFieldEmpty(reqBody[TableFields.plantId], existingPpa?.[TableFields.plantDetail]?.[TableFields.plantId])) {
        throw new ValidationError(ValidationMsgs.PlantIdEmpty);
    }

    if (isFieldEmpty(reqBody[TableFields.plantCapacity], existingPpa?.[TableFields.plantCapacity])) {
        throw new ValidationError(ValidationMsgs.PlantCapacityEmpty);
    }

    if (isFieldEmpty(reqBody[TableFields.tarrif], existingPpa?.[TableFields.tarrif])) {
        throw new ValidationError(ValidationMsgs.TarrifEmpty);
    }

    if (isFieldEmpty(reqBody[TableFields.expectedYears], existingPpa?.[TableFields.expectedYears])) {
        throw new ValidationError(ValidationMsgs.ExpectedYearsEmpty);
    }
   
    if (isFieldEmpty(reqBody[TableFields.startDate], existingPpa?.[TableFields.startDate])) {
        throw new ValidationError(ValidationMsgs.StartDateEmpty);
    }

    const existingPpaFile = existingPpa[TableFields.ppaDocument];
    let persistedPpaKey = existingPpaFile;

    const existingLeaseFile = existingPpa[TableFields.leaseDocument];
    let persistedLeaseKey = existingLeaseFile;

    const ppaFile = providedFileArray.find(
        f => f.fieldname === 'ppaDocument'
    );

    const leaseFile = providedFileArray.find(
        f => f.fieldname === 'leaseDocument'
    );

    if (ppaFile) {
        let newPpaKey = await addFile(
            Folders.PpaDocs,
            ppaFile.originalname,
            ppaFile.buffer,
            true,
            ppaFile
        );
        persistedPpaKey = newPpaKey;
    }

    if (leaseFile) {
        let newLeaseKey = await addFile(
            Folders.LeaseDocs,
            leaseFile.originalname,
            leaseFile.buffer,
            true,
            leaseFile
        );
        persistedLeaseKey = newLeaseKey;
    }

    if(update === true) {
        let updatedFields = {}

        if (reqBody[TableFields.expectedYears]) {
            const startDate = new Date(existingPpa?.[TableFields.startDate]);
            const endDate = new Date(startDate);
            endDate.setFullYear(startDate.getFullYear() + Number(reqBody[TableFields.expectedYears]));

            updatedFields[TableFields.expectedYears] = reqBody[TableFields.expectedYears];
            updatedFields[TableFields.endDate] = endDate;
        }

        if (reqBody[TableFields.startDate]) {
            const startDateStr = reqBody[TableFields.startDate]; // "2025-01-02"
            const [y, m, d] = startDateStr.split('-').map(Number);
            const startDate = new Date(Date.UTC(y, m - 1, d));

            const endDate = new Date(startDate);
            endDate.setUTCFullYear(
                startDate.getUTCFullYear() + Number(existingPpa?.[TableFields.expectedYears])
            );

            updatedFields[TableFields.startDate] = reqBody[TableFields.startDate];
            updatedFields[TableFields.endDate] = endDate;
        }

        if (reqBody[TableFields.expectedYears] && reqBody[TableFields.startDate]) {
            const startDate = new Date(reqBody[TableFields.startDate]);
            const endDate = new Date(startDate);
            endDate.setFullYear(startDate.getFullYear() + Number(reqBody[TableFields.expectedYears]));

            updatedFields[TableFields.expectedYears] = reqBody[TableFields.expectedYears];
            updatedFields[TableFields.startDate] = reqBody[TableFields.startDate];
            updatedFields[TableFields.endDate] = endDate;
        }

        if (reqBody[TableFields.plantId]) {
            const newPlantInfo = await PlantService.getUserById(reqBody[TableFields.plantId]).withBasicInfo().execute();

            if (newPlantInfo == null) {
                throw new ValidationError(ValidationMsgs.RecordNotExists);
            }

            updatedFields[TableFields.plantDetail] = {
                [TableFields.plantId] : reqBody[TableFields.plantId],
                [TableFields.plantUniqueId] : newPlantInfo[TableFields.plantUniqueId],
                [TableFields.plantUniqueName] : newPlantInfo[TableFields.plantUniqueName],
                [TableFields.propertyName] : newPlantInfo?.[TableFields.propertyAddress]?.[TableFields.propertyName],
                [TableFields.propertyType] : newPlantInfo?.[TableFields.propertyAddress]?.[TableFields.propertyType],
                [TableFields.address] : newPlantInfo?.[TableFields.propertyAddress]?.[TableFields.address],
                [TableFields.city] : newPlantInfo?.[TableFields.propertyAddress]?.[TableFields.city],
                [TableFields.userId] : newPlantInfo?.[TableFields.userDetails]?.[TableFields.userId],
                [TableFields.name_] : newPlantInfo?.[TableFields.userDetails]?.[TableFields.name_],
            }
        }

        updatedFields = {
            ...updatedFields,
            [TableFields.ppaName] : reqBody[TableFields.ppaName] ?? existingPpa[TableFields.ppaName],
            [TableFields.plantCapacity] : reqBody[TableFields.plantCapacity] ?? existingPpa?.[TableFields.plantCapacity],
            [TableFields.tarrif] : reqBody[TableFields.tarrif] ?? existingPpa?.[TableFields.tarrif],
            [TableFields.ppaDocument] : persistedPpaKey ?? existingPpa?.[TableFields.ppaDocument],
            [TableFields.leaseDocument] : persistedLeaseKey ?? existingPpa?.[TableFields.leaseDocument],
        }
        return await onValidationCompleted(updatedFields);
    } else {
        const plantInfo = await PlantService.getUserById(reqBody[TableFields.plantId]).withBasicInfo().withUser().withPlantStatus().execute();
    
        if (plantInfo?.[TableFields.plantStatus] !== PlantStatus.Approved) {
            throw new ValidationError(ValidationMsgs.PlantNotApproveToCreatePpa);
        }

        const startDate = new Date(reqBody[TableFields.startDate]);
        const endDate = new Date(startDate);
        endDate.setFullYear(startDate.getFullYear() + Number(reqBody[TableFields.expectedYears]));

        const response = await onValidationCompleted({
            [TableFields.ppaUniqueId] : ppaUniqueId,
            [TableFields.ppaName] : reqBody[TableFields.ppaName],
            [`${TableFields.plantDetail}.${TableFields.plantId}`]: reqBody[TableFields.plantId],
            [`${TableFields.plantDetail}.${TableFields.plantUniqueId}`]: plantInfo?.[TableFields.plantUniqueId],
            [`${TableFields.plantDetail}.${TableFields.plantUniqueName}`]: plantInfo?.[TableFields.plantUniqueName],
            [`${TableFields.plantDetail}.${TableFields.propertyName}`]: plantInfo?.[TableFields.propertyAddress]?.[TableFields.propertyName],
            [`${TableFields.plantDetail}.${TableFields.propertyType}`]: plantInfo?.[TableFields.propertyAddress]?.[TableFields.propertyType],
            [`${TableFields.plantDetail}.${TableFields.address}`]: plantInfo?.[TableFields.propertyAddress]?.[TableFields.address],
            [`${TableFields.plantDetail}.${TableFields.city}`]: plantInfo?.[TableFields.propertyAddress]?.[TableFields.city],
            [`${TableFields.plantDetail}.${TableFields.userId}`]: plantInfo?.[TableFields.userDetails]?.[TableFields.userId],
            [`${TableFields.plantDetail}.${TableFields.name_}`]: plantInfo?.[TableFields.userDetails]?.[TableFields.name_],
            [TableFields.plantCapacity]: reqBody[TableFields.plantCapacity],
            [TableFields.tarrif]: reqBody[TableFields.tarrif],
            [TableFields.expectedYears]: reqBody[TableFields.expectedYears],
            [TableFields.startDate]: reqBody[TableFields.startDate],
            [TableFields.endDate]: endDate,
            [TableFields.ppaDocument]: persistedPpaKey,
            [TableFields.leaseDocument]: persistedLeaseKey,
        });
        return response;
    }
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
