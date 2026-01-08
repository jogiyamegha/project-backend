const UserService = require("../../db/services/UserService");
const {InterfaceTypes, TableFields, ValidationMsgs} = require("../../utils/constants");
const ValidationError = require("../../utils/ValidationError")
const Email = require("../../emails/email");


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

exports.forgotPassword = async (req) => {
    let providedEmail = req.body[TableFields.email];
    providedEmail = (providedEmail + "").trim().toLowerCase();

    if (!providedEmail) throw new ValidationError(ValidationMsgs.EmailEmpty);

    let {code, email, name} = await UserService.getResetPasswordToken(providedEmail);
    Email.sendForgotPasswordEmail(code, email, name);
};

exports.resetPassword = async (req) => {
    let providedEmail = req.body[TableFields.email];
    providedEmail = (providedEmail + "").trim().toLowerCase();

    const {code, newPassword} = req.body;

    if (!providedEmail) throw new ValidationError(ValidationMsgs.EmailEmpty);
    if (!code) throw new ValidationError(ValidationMsgs.PassResetCodeEmpty);
    if (!newPassword) throw new ValidationError(ValidationMsgs.NewPasswordEmpty);

    let user = await UserService.resetPassword(providedEmail, code, newPassword);
    let token = await createAndStoreAuthToken(user);
    return {
        user: await UserService.getUserById(user[TableFields.ID])
        .withPassword()
        .withUserType()
        .withBasicInfo()
        .execute(),
        token: token || undefined,
    };
};

exports.changePassword = async (req) => {
    let {oldPassword, newPassword} = req.body;

    if (!oldPassword || !newPassword) throw new ValidationError(ValidationMsgs.ParametersError);

    let user = await UserService.getUserById(req.user[TableFields.ID]).withPassword().withId().execute();

    if (user && (await user.isValidAuth(oldPassword))) {
        if (!user.isValidPassword(newPassword)) throw new ValidationError(ValidationMsgs.PasswordInvalid);
        const token = user.createAuthToken();
        await UserService.updatePasswordAndInsertLatestToken(user, newPassword, token);
        return {token};
    } else throw new ValidationError(ValidationMsgs.OldPasswordIncorrect);
};

exports.logout = async (req) => {
    const headerToken = req.header("Authorization").replace("Bearer ", "");
    UserService.removeAuth(req.user[TableFields.ID], headerToken);
};

async function createAndStoreAuthToken(userObj) {
    const token = userObj.createAuthToken(InterfaceTypes.Admin.AdminWeb);
    await UserService.saveAuthToken(userObj[TableFields.ID], token);
    return token;
}

