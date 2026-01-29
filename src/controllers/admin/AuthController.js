const AdminService = require("../../db/services/AdminService");
const {InterfaceTypes, TableFields, ValidationMsgs, PlantStatus} = require("../../utils/constants");
const Util = require("../../utils/util");
const Email = require("../../emails/email");
const ValidationError = require("../../utils/ValidationError");
const PlantService = require("../../db/services/PlantService");
const PpaService = require("../../db/services/PpaService");
const UserService = require("../../db/services/UserService");

exports.addAdminUser = async (req) => {
    if (Util.parseBoolean(req.headers.dbuser)) {
        await AdminService.insertUserRecord(req.body);

        let email = req.body[TableFields.email];
        email = (email + "").trim().toLowerCase();
        let user = await AdminService.findByEmail(email).withPassword().withUserType().withBasicInfo().execute();

        const token = user.createAuthToken(InterfaceTypes.Admin.AdminWeb); 
        await AdminService.saveAuthToken(user[TableFields.ID], token);

        return {user, token};
    } else throw new ValidationError(ValidationMsgs.NotAllowed);
};

exports.login = async (req) => {
    let email = req.body[TableFields.email];
    if (!email) throw new ValidationError(ValidationMsgs.EmailEmpty);
    email = (email + "").trim().toLowerCase();

    const password = req.body[TableFields.password];
    if (!password) throw new ValidationError(ValidationMsgs.PasswordEmpty);

    let admin = await AdminService.findByEmail(email).withPassword().withUserType().withBasicInfo().execute();
    if (admin && (await admin.isValidAuth(password))) {
        const token = admin.createAuthToken(InterfaceTypes.Admin.AdminWeb);
        await AdminService.saveAuthToken(admin[TableFields.ID], token);
        return {admin, token};
    } else throw new ValidationError(ValidationMsgs.UnableToLogin);
};

exports.getDashboardData = async (req) => {
    const plants = await PlantService.listPlants({...req.query}).withId().execute();
    const approvedPlants = await PlantService.listPlants({
        plantStatus : PlantStatus.Approved,
        ...req.query
    }).withId().execute();
    const ppa = await PpaService.listPpa({...req.query}).withId().execute();
    const users = await UserService.listUsers({...req.query}).withId().execute();
    return {
        totalPlants : plants?.records.length || 0,
        totalApprovedPlants : approvedPlants?.records.length || 0,
        totalPpas : ppa?.records.length || 0,
        totalUsers : users?.records.length || 0,
    }
}

exports.logout = async (req) => {
    const headerToken = req.header("Authorization").replace("Bearer ", "");
    AdminService.removeAuth(req.user[TableFields.ID], headerToken);
};

exports.forgotPasswordCodeExists = async (req) => {
    let providedEmail = req.body[TableFields.email];
    let providedCode = req.body.code;
    if (providedEmail) {
        providedEmail = (providedEmail + "").trim().toLowerCase();
    }
    if (!providedEmail || !providedCode) {
        throw new ValidationError(ValidationMsgs.ParametersError);
    }
    let exists = await AdminService.resetPasswordCodeExists(providedEmail, providedCode);
    if (!exists) {
        throw new ValidationError(ValidationMsgs.InvalidPassResetCode);
    }
};

exports.forgotPassword = async (req) => {
    let providedEmail = req.body[TableFields.email];
    providedEmail = (providedEmail + "").trim().toLowerCase();
    
    if (!providedEmail) throw new ValidationError(ValidationMsgs.EmailEmpty);
    let admin = await AdminService.getUserByEmail(providedEmail).withBasicInfo().execute();
    
    let {code, email} = await AdminService.getResetPasswordToken(providedEmail);
    Email.sendForgotPasswordEmail(code, email, admin[TableFields.name_]);
};

exports.resetPassword = async (req) => {
    let providedEmail = req.body[TableFields.email];
    providedEmail = (providedEmail + "").trim().toLowerCase();

    const {code, newPassword} = req.body;

    if (!providedEmail) throw new ValidationError(ValidationMsgs.EmailEmpty);
    if (!code) throw new ValidationError(ValidationMsgs.PassResetCodeEmpty);
    if (!newPassword) throw new ValidationError(ValidationMsgs.NewPasswordEmpty);

    let user = await AdminService.resetPassword(providedEmail, code, newPassword);
    let token = await createAndStoreAuthToken(user);
    return {
        user: await AdminService.getUserById(user[TableFields.ID])
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

    let user = await AdminService.getUserById(req.user[TableFields.ID]).withPassword().withId().execute();

    if (user && (await user.isValidAuth(oldPassword))) {
        if (!user.isValidPassword(newPassword)) throw new ValidationError(ValidationMsgs.PasswordInvalid);
        const token = user.createAuthToken();
        await AdminService.updatePasswordAndInsertLatestToken(user, newPassword, token);
        return {token};
    } else throw new ValidationError(ValidationMsgs.OldPasswordIncorrect);
};

async function createAndStoreAuthToken(userObj) {
    const token = userObj.createAuthToken(InterfaceTypes.Admin.AdminWeb);
    await AdminService.saveAuthToken(userObj[TableFields.ID], token);
    return token;
}
