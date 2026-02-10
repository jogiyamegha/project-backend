const PlantService = require("../../db/services/PlantService");
const UserService = require("../../db/services/UserService");
const { TableFields, ValidationMsgs } = require("../../utils/constants");
const { Folders } = require("../../utils/metadata");
const { addFile } = require("../../utils/storage");
const ValidationError = require("../../utils/ValidationError");

exports.addUser = async (req) => {
    const reqBody = req.body;
    const profilePicture = req.file

    // Provide a default password if not provided
    const password = req.body.password || "Samran@123";

    return await parseAndValidateUser(
        reqBody,
        undefined,
        profilePicture,
        false,
        async (updatedFields) => {
            return await UserService.insertUserRecord(updatedFields);
        }
    );
}

exports.editUser = async (req) => {
    const userId = req.params[TableFields.ID];
    const reqBody = req.body;
    const profilePicture = req.file || null;

    const user = await UserService.getUserById(userId).withBasicInfo().execute();
    if(!user) {
        throw new ValidationError(ValidationMsgs.RecordNotExists);
    }

    return await parseAndValidateUser(
        reqBody,
        user,
        profilePicture,
        true,
        async (updatedUserProfile) => {
            return await UserService.updateUserRecord(userId, updatedUserProfile)
        }
    )

}

exports.getAllUsers = async (req) => {
    return await UserService.listUsers({
        ...req.query
    }).withBasicInfo().execute();
}

exports.deleteUser = async (req) => {
    const userId = req.params[TableFields.ID];
    const user = await UserService.getUserById(userId).withBasicInfo().execute();

    if (user && user[TableFields.deleted]) {
        throw new ValidationError(ValidationMsgs.RecordNotExists);
    }

    await UserService.updateDelete(userId);
    await PlantService.updateUserDelete(userId);
}

async function parseAndValidateUser(
    reqBody,
    existingUser = {},
    providedFile,
    update = false,
    onValidationCompleted = async (updatedUserFields) => {}
) {

    if (isFieldEmpty(reqBody[TableFields.name_], existingUser?.[TableFields.name_])) {
        throw new ValidationError(ValidationMsgs.NameEmpty);
    } 
    if (isFieldEmpty(reqBody[TableFields.phoneCountry], existingUser?.[TableFields.phoneCountry])) {
        throw new ValidationError(ValidationMsgs.PhoneCountryEmpty);
    } 
    if (isFieldEmpty(reqBody[TableFields.phone], existingUser?.[TableFields.phone])) {
        throw new ValidationError(ValidationMsgs.PhoneEmpty);
    } 
    if (isFieldEmpty(reqBody[TableFields.userType], existingUser?.[TableFields.userType])) {
        throw new ValidationError(ValidationMsgs.UserTypeEmpty);
    }
   
    const existingImageKey = existingUser[TableFields.profilePicture];
    let persistedImageKey = existingImageKey;

    try {
        if (providedFile) {
            let newImageKey = await addFile(
                Folders.ProfilePicture,
                providedFile.originalname,
                providedFile.buffer,
                true,
                providedFile
            );
            persistedImageKey = newImageKey;
        }

        if (update === true) {
            let updatedFields = {};
            updatedFields = {
                [TableFields.profilePicture]: persistedImageKey ?? existingUser?.[TableFields.profilePicture],
                [TableFields.userType] : reqBody[TableFields.userType] ?? existingUser[TableFields.userType],
                [TableFields.name_]: reqBody[TableFields.name_] ?? existingUser[TableFields.name_],
                [TableFields.phoneCountry]: reqBody[TableFields.phoneCountry] ?? existingUser[TableFields.phoneCountry],
                [TableFields.phone]: reqBody[TableFields.phone] ?? existingUser[TableFields.phone],
                [TableFields.addressDetail]: {    
                    [TableFields.address]: reqBody[TableFields.address] ?? existingUser[TableFields.addressDetail]?.[TableFields.address],
                    [TableFields.pincode]: reqBody[TableFields.pincode] ?? existingUser[TableFields.addressDetail]?.[TableFields.pincode],
                    [TableFields.city]: reqBody[TableFields.city] ?? existingUser[TableFields.addressDetail]?.[TableFields.city],
                },
            }; 
            return await onValidationCompleted(updatedFields);
        } else {

            return await onValidationCompleted({
                [TableFields.profilePicture]: persistedImageKey ?? existingUser?.[TableFields.profilePicture],
                [TableFields.userType] : reqBody[TableFields.userType] ?? existingUser[TableFields.userType],
                [TableFields.name_]: reqBody[TableFields.name_] ?? existingUser[TableFields.name_],
                [TableFields.email]: reqBody[TableFields.email] ?? existingUser[TableFields.email],
                [TableFields.password] : "Samran@123",
                [TableFields.phoneCountry]: reqBody[TableFields.phoneCountry] ?? existingUser[TableFields.phoneCountry],
                [TableFields.phone]: reqBody[TableFields.phone] ?? existingUser[TableFields.phone],
                [TableFields.addressDetail]: {    
                    [TableFields.address]: reqBody[TableFields.address] ?? existingUser[TableFields.addressDetail]?.[TableFields.address],
                    [TableFields.pincode]: reqBody[TableFields.pincode] ?? existingUser[TableFields.addressDetail]?.[TableFields.pincode],
                    [TableFields.city]: reqBody[TableFields.city] ?? existingUser[TableFields.addressDetail]?.[TableFields.city],
                },
            });
        }
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
