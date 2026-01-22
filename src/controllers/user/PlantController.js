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
    CounterSchemaType,
} = require("../../utils/constants");
const ValidationError = require("../../utils/ValidationError");
const {Folders} = require("../../utils/metadata");
const {addFile, createThumbnailSingle, removeFileById} = require("../../utils/storage");
const CounterService = require("../../db/services/CounterService");

exports.addPlant = async (req) => {
    let reqBody = req.body;
    let providedFiles = req.file || null;
    let reqUser = req.user;
    return await parseAndValidatePlant(
        reqUser,
        reqBody, 
        undefined, 
        providedFiles, 
        async (updatedUserFields) => {
            return await PlantService.insertRecord(updatedUserFields);
        }
    );
};

exports.listMyPlants = async (req) => {
    let reqUser = req.user;
    return await PlantService.listPlants(
        {
            [TableFields.userId] : reqUser[TableFields.ID]
        }
    ).withBasicInfo().execute()
}


async function parseAndValidatePlant(
    reqUser,
    reqBody,
    existingPlant = {},
    providedFile,
    onValidationCompleted = async () => {}
) {
    const plantUniqueId = await CounterService.consumeSingleKey(CounterSchemaType.Plant);

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
        throw new ValidationError(ValidationMsgs.BillAmountEmpty);
    }

    const userInfo = await UserService.getUserById(reqUser[TableFields.ID]).withBasicInfo().execute();

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
            [TableFields.plantUniqueId] : plantUniqueId,
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
