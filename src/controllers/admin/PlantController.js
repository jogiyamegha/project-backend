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

exports.getCollegeInfo = async (req) => {
    let record = await CollegeService.getUserById(req.params[TableFields.ID])
    .withBasicInfo()
    .withStudentCount()
    .withImage()
    .withBooleanFields()
    .withTimeStamps()
    .withImage()
    .execute();
    if (!record) {
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }
    return record;
};

exports.listAllCollege = async (req) => {
    return await CollegeService.listColleges({
        ...req.query,
    })
    .withBasicInfo()
    .withStudentCount()
    .withImage()
    .withTimeStamps()
    .execute();
};

exports.deleteCollege = async (req) => {
    let recordId = req.params[TableFields.ID];

    if (!(await CollegeService.recordExists(recordId))) {
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }

    if (await StudentService.studentExistInCollege(recordId)) {
        throw new ValidationError(ValidationMsgs.CannotCollegeDelete);
    }
    await ServiceManager.cascadeDelete(TableNames.College, recordId);
};

exports.AccessCollege = async (req) => {
    let collegeReference = req.params[TableFields.ID];
    let user = await CollegeService.getUserById(collegeReference)
    .withUserType()
    .withBasicInfo()
    .withAddedByAdmin()
    .execute();

    if (user && user[TableFields.addedByAdmin]) {
        const token = user.createAuthToken(InterfaceTypes.College.CollegeWeb);
        await CollegeService.saveAuthToken(user[TableFields.ID], token);
        return {user, token};
    } else throw new ValidationError(ValidationMsgs.AuthFail);
};

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

    const existingImageKey = existingPlant[TableFields.billImage];
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
            [`${TableFields.userDetails},${TableFields.userId}`]: reqBody[TableFields.userId],
            [TableFields.email]: reqBody[TableFields.email],
            [TableFields.phone]: reqBody[TableFields.phone],
            [TableFields.phoneCountry]: reqBody[TableFields.phoneCountry],
            [TableFields.userType]: UserTypes.College,
            [TableFields.image]: persistedImageKey,
            [TableFields.thumbnail]: persistedThumbnailKey,
            ...(regCompleted
                ? {
                      [TableFields.regCompleted]: true,
                      [TableFields.approved]: true,
                  }
                : {}),
        });

        if (persistedImageKey && existingImageKey && existingImageKey != persistedImageKey) {
            await removeFileById(Folders.CollegeImage, existingImageKey);
        }
        if (persistedThumbnailKey && existingThumbnailKey && existingThumbnailKey != persistedThumbnailKey) {
            await removeFileById(Folders.CollegeThumbnail, existingThumbnailKey);
        }

        return response;
    } catch (error) {
        await removeFileById(Folders.CollegeImage, persistedImageKey);
        await removeFileById(Folders.CollegeThumbnail, persistedThumbnailKey);
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
