const PlantService = require("../../db/services/PlantService");
const UserService = require("../../db/services/UserService");
const { TableFields, ValidationMsgs } = require("../../utils/constants");
const ValidationError = require("../../utils/ValidationError");

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

exports.addUser = async (req) => {
    const { name, email, phoneCountry, phone, userType } = req.body;

    // Provide a default password if not provided
    const password = req.body.password || "Samran@123";

    const user = await UserService.insertUserRecord({
        [TableFields.name_]: name,
        [TableFields.email]: email,
        [TableFields.phoneCountry]: phoneCountry,
        [TableFields.phone]: phone,
        [TableFields.userType]: userType,
        [TableFields.password]: password,
        [TableFields.isActive]: true,
        ...(req.file && { [TableFields.profilePicture]: req.file.path })
    });

    return await UserService.getUserById(user[TableFields.ID]).withBasicInfo().execute();
}

exports.editUser = async (req) => {
    const userId = req.params[TableFields.ID];
    const { name, email, phoneCountry, phone, userType } = req.body;

    const updatedFields = {
        [TableFields.name_]: name,
        [TableFields.email]: email,
        [TableFields.phoneCountry]: phoneCountry,
        [TableFields.phone]: phone,
        [TableFields.userType]: userType,
        ...(req.file && { [TableFields.profilePicture]: req.file.path })
    };

    await UserService.updateRecord(userId, updatedFields);
    return await UserService.getUserById(userId).withBasicInfo().execute();
}