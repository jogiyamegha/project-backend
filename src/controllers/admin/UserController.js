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

    if(user && user[TableFields.deleted]) {
        throw new ValidationError(ValidationMsgs.RecordNotExists);
    }

    await UserService.updateDelete(userId);
    await PlantService.updateUserDelete(userId);
}   