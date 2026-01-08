const UserService = require("../../db/services/UserService")

exports.getAllUsers = async (req) => {
    return await UserService.listUsers({
        ...req.query
    }).withBasicInfo().execute();
}