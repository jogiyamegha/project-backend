const UserService = require("../../db/services/UserService");
const {InterfaceTypes, TableFields, ValidationMsgs} = require("../../utils/constants");
const ValidationError = require("../../utils/ValidationError");

exports.signUp = async (req) => {
    await UserService.insertUserRecord(req.body);

    let email = req.body[TableFields.email];
    email = (email + "").trim().toLowerCase();
    let user = await UserService.findByEmail(email).withPassword().withUserType().withBasicInfo().execute();

    const token = user.createAuthToken(InterfaceTypes.Consumer.ConsumerApp); 
    await UserService.saveAuthToken(user[TableFields.ID], token);

    return {user, token};
};

exports.login = async (req) => {
    let email = req.body[TableFields.email];
    if (!email) throw new ValidationError(ValidationMsgs.EmailEmpty);
    email = (email + "").trim().toLowerCase();

    const password = req.body[TableFields.password];
    if (!password) throw new ValidationError(ValidationMsgs.PasswordEmpty);

    let user = await UserService .findByEmail(email).withPassword().withUserType().withBasicInfo().execute();
    if (user && (await user.isValidAuth(password))) {
        const token = user.createAuthToken(InterfaceTypes.Admin.AdminWeb);
        await UserService .saveAuthToken(user[TableFields.ID], token);
        return {user, token};
    } else throw new ValidationError(ValidationMsgs.UnableToLogin);
};
