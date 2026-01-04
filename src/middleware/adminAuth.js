const jwt = require("jsonwebtoken");
const {
    ValidationMsgs,
    TableFields,
    UserTypes,
    InterfaceTypes,
    ResponseStatus,
    AuthTypes,
} = require("../utils/constants");
const Util = require("../utils/util");
const ValidationError = require("../utils/ValidationError");
const AdminService = require("../db/services/AdminService");

const auth = async (req, res, next) => {
    try {
        const headerToken = req.header("Authorization").replace("Bearer ", "");
        const decoded = jwt.verify(headerToken, process.env.JWT_ADMIN_PK);
        const admin = await AdminService.getUserByIdAndToken(decoded[TableFields.ID], headerToken)
        .withBasicInfo()
        .withApproved()
        .execute();

        if (!admin) {
            throw new ValidationError();
        }

        req.user = admin;
        req.user[TableFields.userType] = UserTypes.Admin;
        req.user[TableFields.authType] = AuthTypes.Admin;
        req[TableFields.interface] = decoded[TableFields.interface] || InterfaceTypes.Admin.AdminWeb;
        next();
    } catch (e) {
        if (!(e instanceof ValidationError)) {
            console.log(e);
        }
        //Error due to:
        // - No token in header  OR
        // - Token not exists in the database
        res.status(ResponseStatus.Unauthorized).send(Util.getErrorMessageFromString(ValidationMsgs.AuthFail));
    }
};
module.exports = auth;
