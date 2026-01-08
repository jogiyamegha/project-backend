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
} = require("../../utils/constants");
const ValidationError = require("../../utils/ValidationError");
const Email = require("../../emails/email");
const {Folders} = require("../../utils/metadata");
const {addFile, createThumbnailSingle, removeFileById} = require("../../utils/storage");

exports.addPlant = async (req) => {
    let reqBody = req.body;
    let providedFiles = req.file || null;

    await parseAndValidatePlant(
        reqBody, 
        undefined, 
        providedFiles, 
        async (updatedUserFields) => {
            await PlantService.insertRecord(updatedUserFields);
        }
    );
};

exports.updateCollege = async (req) => {
    let reqBody = req.body;
    let providedFile = req.file || null;

    let userId;
    if (req.user[TableFields.authType] == AuthTypes.Admin) {
        userId = req.params[TableFields.ID];
    } else if (req.user[TableFields.authType] == AuthTypes.College) {
        userId = req.user[TableFields.ID];
    }

    let userProfile = await CollegeService.getUserById(userId).withoutTokens().execute();
    if (!userProfile) {
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }
    return await parseAndValidateCollege(
        reqBody,
        userProfile,
        providedFile,
        userProfile[TableFields.regCompleted] ? false : true,
        async (updatedUserFields) => {
            await CollegeService.updateUserRecord(userId, updatedUserFields);
            if (req.user[TableFields.authType] == AuthTypes.College) {
                return await getUserDashboard(userId);
            }
        }
    );
};

exports.listPlants = async (req) => {
    return await PlantService.listPlants({
        ...req.query,
    })
    .withBasicInfo()
    .withTimeStamps()
    .execute();
};

exports.plantInfo = async (req) => {
    const plantId = req.params[TableFields.ID];
    const plant = await PlantService.getUserById(plantId).withBasicInfo().execute();
    if (!plant) {
        throw new ValidationError(ValidationMsgs.RecordNotExists);
    }
    return plant;
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

async function parseAndValidatePlant(
    reqBody,
    existingPlant = {},
    providedFile,
    onValidationCompleted = async () => {}
) {
    //Text fields validations
    if (isFieldEmpty(reqBody[TableFields.userId], existingPlant[TableFields.userId])) {
        throw new ValidationError(ValidationMsgs.UserIdEmpty);
    }
    if (isFieldEmpty(reqBody[TableFields.propertyType], existingPlant[`${TableFields.propertyAddress}.${TableFields.propertyType}`])){
        throw new ValidationError(ValidationMsgs.PropertyTypeEmpty);
    }
    if (isFieldEmpty(reqBody[TableFields.address], existingPlant[`${TableFields.propertyAddress}.${TableFields.address}`])) {
        throw new ValidationError(ValidationMsgs.AddressEmpty);
    }
    if (isFieldEmpty(reqBody[TableFields.state], existingPlant[`${TableFields.propertyAddress}.${TableFields.state}`])) {
        throw new ValidationError(ValidationMsgs.StateEmpty);
    }
    if (isFieldEmpty(reqBody[TableFields.city], existingPlant[`${TableFields.propertyAddress}.${TableFields.city}`])) {
        throw new ValidationError(ValidationMsgs.CityEmpty);
    }
    if (isFieldEmpty(reqBody[TableFields.pincode], existingPlant[`${TableFields.propertyAddress}.${TableFields.pincode}`])) {
        throw new ValidationError(ValidationMsgs.PincodeEmpty);
    }
    if (isFieldEmpty(reqBody[TableFields.billAmount], existingPlant[`${TableFields.propertyAddress}.${TableFields.billAmount}`])) {
        throw new ValidationError(ValidationMsgs.PincodeEmpty);
    }

    const userInfo = await UserService.getUserById(reqBody[TableFields.userId]).withBasicInfo().execute();

    const existingImageKey = existingPlant[`${TableFields.propertyAddress}.${TableFields.billImage}`];
    let persistedImageKey = existingImageKey;

    try {
        if (providedFile) {
            let newImageKey = await addFile(
                Folders.BillImage,
                providedFile.originalname,
                providedFile.buffer,
                true,
                providedFile
            );
            persistedImageKey = newImageKey;
        }

        let response = await onValidationCompleted({
            [`${TableFields.userDetails}.${TableFields.userId}`]: userInfo[TableFields.ID],
            [`${TableFields.userDetails}.${TableFields.userType}`]: userInfo[TableFields.userType],
            [`${TableFields.userDetails}.${TableFields.name_}`]: userInfo[TableFields.name_],
            [`${TableFields.userDetails}.${TableFields.deleted}`]: userInfo[TableFields.deleted],
            [`${TableFields.propertyAddress}.${TableFields.propertyName}`]: reqBody[TableFields.propertyName] || null,
            [`${TableFields.propertyAddress}.${TableFields.propertyType}`]: reqBody[TableFields.propertyType],
            [`${TableFields.propertyAddress}.${TableFields.address}`]: reqBody[TableFields.address],
            [`${TableFields.propertyAddress}.${TableFields.city}`]: reqBody[TableFields.city],
            [`${TableFields.propertyAddress}.${TableFields.state}`]: reqBody[TableFields.state],
            [`${TableFields.propertyAddress}.${TableFields.pincode}`]: reqBody[TableFields.pincode],
            [`${TableFields.propertyAddress}.${TableFields.roofArea}`]: reqBody[TableFields.roofArea],
            [`${TableFields.propertyAddress}.${TableFields.billAmount}`]: reqBody[TableFields.billAmount],
            [`${TableFields.propertyAddress}.${TableFields.billImage}`]: persistedImageKey,
            [`${TableFields.propertyAddress}.${TableFields.electricityRate}`]: reqBody[TableFields.electricityRate] || 0,
        });

        return response;
    } catch (error) {
        throw error;
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

async function getUserDashboard(userId, token) {
    return {
        user: await CollegeService.getUserById(userId).withBasicInfo().execute(),
        token: token || undefined,
    };
}
