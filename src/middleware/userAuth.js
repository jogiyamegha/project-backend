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
const UserService = require("../db/services/UserService");

const auth = (allowedRoles = []) => {
    return async (req, res, next) => {
        try {
            const headerToken = req.header("Authorization")?.replace("Bearer ", "");
            if (!headerToken) {
                return res.status(ResponseStatus.Unauthorized).json({
                code: ResponseStatus.Unauthorized,
                message: Util.getErrorMessageFromString(ValidationMsgs.AuthFail),
                });
            }

            const decoded = jwt.verify(headerToken, process.env.JWT_USER_PK);
            const user = await UserService.getUserByIdAndToken(
                decoded[TableFields.ID],
                headerToken
            )
                .withBasicInfo()
                .execute();

            if (!user) {
                return res.status(ResponseStatus.Unauthorized).json({
                    code: ResponseStatus.Unauthorized,
                    message: Util.getErrorMessageFromString(ValidationMsgs.AuthFail),
                });
            }
            const userRole = user.userType;
        
            if (allowedRoles.length && !allowedRoles.includes(userRole)) {
                return res.status(ResponseStatus.Unauthorized).json({
                    code: ResponseStatus.Unauthorized,
                    message: Util.getErrorMessageFromString(ValidationMsgs.AuthFail),
                });
            }

            req.user = user.toObject ? user.toObject() : user;
            req.user[TableFields.userType] = userRole;
            req.user[TableFields.authType] = Util.getAuthType(userRole);

            next();
        } catch (err) {
        if (!(err instanceof ValidationError)) console.error(err);
            res.status(ResponseStatus.Unauthorized).send(
                Util.getErrorMessageFromString(ValidationMsgs.AuthFail)
            );
        }
    };
};

module.exports = auth;