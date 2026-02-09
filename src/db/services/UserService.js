const { TableFields, ValidationMsgs, UserTypes, TableNames } = require("../../utils/constants");
const Util = require("../../utils/util");
const ValidationError = require("../../utils/ValidationError");
const { MongoUtil } = require('../../db/mongoose');
const User = require("../models/user");

class UserService {
    static findByEmail = (email) => {
        return new ProjectionBuilder(async function () {
            return await User.findOne({ email }, this);
        });
    };

    static saveAuthToken = async (userId, token) => {
        await User.updateOne(
            {
                [TableFields.ID]: userId,
            },
            {
                $push: {
                    [TableFields.tokens]: { [TableFields.token]: token },
                },
            }
        );
    };

    static getUserById = (userId) => {
        return new ProjectionBuilder(async function () {
            return await User.findOne({ 
                [TableFields.ID]: userId,
                [TableFields.deleted] : false
            }, this);
        });
    };

    static existsWithEmail = async (email, exceptionId) => {
        return await User.exists({
            [TableFields.email]: email,
            ...(exceptionId
                ? {
                    [TableFields.ID]: { $ne: exceptionId },
                }
                : {}),
        });
    };

    static existsWithPhone = async (phone, phoneCountry, exceptionId) => {
        return await User.exists({
            [TableFields.phone]: phone,
            [TableFields.phoneCountry]: phoneCountry,
            ...(exceptionId
                ? {
                      [TableFields.ID]: {$ne: exceptionId},
                  }
                : {}),
        });
    };

    static insertUserRecord = async (reqBody) => {
        let email = reqBody[TableFields.email];
        email = (email + "").trim().toLocaleLowerCase();
        const password = reqBody[TableFields.password];

        if (!email) throw new ValidationError(ValidationMsgs.EmailEmpty);
        if (!password) throw new ValidationError(ValidationMsgs.PasswordEmpty);
        if (email == password) throw new ValidationError(ValidationMsgs.PasswordInvalid);

        if (await UserService.existsWithEmail(email)) throw new ValidationError(ValidationMsgs.DuplicateEmail);

        const user = new User(reqBody);
        // Set userType from reqBody if present, otherwise default to Investor
        if (!reqBody[TableFields.userType]) {
            user[TableFields.userType] = UserTypes.Investor;
        }

        if (reqBody[TableFields.profilePicture]) {
            user[TableFields.profilePicture] = reqBody[TableFields.profilePicture] 
        }

        if (!user.isValidPassword(password)) {
            throw new ValidationError(ValidationMsgs.PasswordInvalid);
        }
        try {
            await user.save();
            return user;
        } catch (error) {
            if (error.code == 11000) {
                //Mongoose duplicate email error
                throw new ValidationError(ValidationMsgs.DuplicateEmail);
            }
            throw error;
        }
    };

    static getUserByEmail = (email) => {
        return new ProjectionBuilder(async function () {
            return await User.findOne({ [TableFields.email]: email }, this);
        });
    };

    static getUserByIdAndToken = (userId, token, lean = false) => {
        return new ProjectionBuilder(async function () {
            return await User.findOne(
                {
                    [TableFields.ID]: userId,
                    [TableFields.tokens + "." + TableFields.token]: token,
                },
                this
            ).lean(lean);
        });
    };

    static listUsers = (filter = {}) => {
        return new ProjectionBuilder(async function () {
            let limit = filter.limit || 0;
            let skip = filter.skip || 0;
            let sortKey = filter.sortKey || TableFields._createdAt;
            let sortOrder = filter.sortOrder || 1;
            let needCount = Util.parseBoolean(filter.needCount);
            let searchQuery = {};

            let searchTerm = filter.searchTerm;
            if (searchTerm) {
                searchQuery = {
                    $or: [
                        {
                            [TableFields.name_]: {
                                $regex: Util.wrapWithRegexQry(searchTerm),
                                $options: "i",
                            },
                        },
                        {
                            [TableFields.email]: {
                                $regex: Util.wrapWithRegexQry(searchTerm),
                                $options: "i",
                            },
                        },
                    ],
                };
            }
            if (filter.userType) {
                searchQuery[TableFields.userType] = filter.userType;
            }

            if (filter.isActive) {
                searchQuery[TableFields.isActive] = filter.isActive;
            }

            return await Promise.all([
                needCount ? User.countDocuments(searchQuery) : undefined,
                User.find(searchQuery, this)
                    .limit(parseInt(limit))
                    .skip(parseInt(skip))
                    .sort({ [sortKey]: parseInt(sortOrder) }),
            ]).then(([total, records]) => ({ total, records }));
        });
    };

    static removeAuth = async (UserId, authToken) => {
        await User.updateOne(
            {
                [TableFields.ID]: UserId,
            },
            {
                $pull: {
                    [TableFields.tokens]: { [TableFields.token]: authToken },
                },
            }
        );
    };

    static generateOTPCode = () => {
        return Util.generateRandomPassword(6);
    };

    static updateRecord = async (recordId, updatedUserFields = {}) => {
        console.log("updatedUserFields",updatedUserFields);
        const record = await User.findByIdAndUpdate(
            recordId,
            {
                $set: {
                    ...updatedUserFields,
                    [TableFields._updatedAt]: new Date()
                }
            },
            {
                new: true,
                select: TableFields.ID
            }
        );

        if (!record) {
            throw new ValidationError(ValidationMsgs.RecordNotFound);
        }
    };

    static updateUserRecord = async (recordId, updatedUserFields = {}) => {
        let phone = updatedUserFields[TableFields.phone];
        let phoneCountry = updatedUserFields[TableFields.phoneCountry];

        if (phone && (await UserService.existsWithPhone(phone, phoneCountry, recordId))) {
            throw new ValidationError(ValidationMsgs.DuplicatePhone);
        }
        let record = await User.updateOne(
            {

                [TableFields.ID] : MongoUtil.toObjectId(recordId),
            },
            {
                ...updatedUserFields,
                [TableFields._updatedAt]: Date.now(),
            },
            {
                new: false,
                projection: {[TableFields.ID]: 1},
            }
        );
        console.log("record",record);
        if (!record) {
            throw new ValidationError(ValidationMsgs.RecordNotFound);
        }
        return record;
    };

    static getResetPasswordToken = async (email) => {
        let user = await UserService.findByEmail(email).withId().withBasicInfo().withPasswordResetToken().execute();
        if (!user) throw new ValidationError(ValidationMsgs.AccountNotRegistered);
        if (!user[TableFields.isActive]) throw new ValidationError(ValidationMsgs.UnableToForgotPassword);

        let code;
        if (!user[TableFields.passwordResetToken]) {
            code = UserService.generateOTPCode();
            // code = "123456";
            user[TableFields.passwordResetToken] = code;
            await user.save();
        } else code = user[TableFields.passwordResetToken];
        return {
            code,
            email: user[TableFields.email],
            name: user[TableFields.name_],
        };
    };

    static resetPasswordCodeExists = async (providedEmail, otp) => {
        if (!otp) {
            return false;
        }
        if (providedEmail) {
            return (await User.exists({
                [TableFields.email]: providedEmail,
                [TableFields.passwordResetToken]: otp,
            }))
                ? true
                : false;
        } else {
            return (await User.exists({
                [TableFields.passwordResetToken]: otp,
            }))
                ? true
                : false;
        }
    };

    static resetPassword = async (email, code, newPassword) => {
        let user = await UserService.findByEmail(email).withId().withBasicInfo().withPasswordResetToken().execute();
        if (!user) throw new ValidationError(ValidationMsgs.AccountNotRegistered);

        if (!user[TableFields.isActive]) throw new ValidationError(ValidationMsgs.UnableToForgotPassword);

        if (!user.isValidPassword(newPassword)) throw new ValidationError(ValidationMsgs.PasswordInvalid);

        if (user[TableFields.passwordResetToken] == code) {
            user[TableFields.password] = newPassword;
            user[TableFields.passwordResetToken] = "";
            user[TableFields.tokens] = [];
            return await user.save();
        } else throw new ValidationError(ValidationMsgs.InvalidPassResetCode);
    };

    static updatePasswordAndInsertLatestToken = async (userObj, newPassword, token) => {
        userObj[TableFields.tokens] = [{ [TableFields.token]: token }];
        userObj[TableFields.password] = newPassword; // It will be hashed by Schema methods (pre hook 'save')
        await userObj.save();
    };

    static updateDelete = async (userId) => {
        return await User.updateOne(
            {
                [TableFields.ID]: MongoUtil.toObjectId(userId)
            },
            {
                $set: {
                    [TableFields.deleted]: true,
                    [TableFields._deletedAt]: new Date()
                }
            }
        )
    }

    static deleteMyReferences = async (tableName, deleteRecordIds) => {
        let recordsList = [];
        let projection = { [TableFields.ID]: 1 };

        switch (tableName) {
            case TableNames.User:
                recordsList = await User.find(
                    {
                        [TableFields.ID]: { $in: deleteRecordIds },
                    },
                    projection
                );
                break;
            default:
                break;
        }

        if (recordsList.length) {
            let ids = [];
            recordsList.forEach((a) => {
                ids.push(a[TableFields.ID]);
            });

            await User.deleteMany({
                [TableFields.ID]: { $in: ids },
            });
        }
    };
}

const ProjectionBuilder = class {
    constructor(methodToExecute) {
        const projection = {};
        this.withBasicInfo = () => {
            projection[TableFields.ID] = 1;
            projection[TableFields.profilePicture] = 1;
            projection[TableFields.name_] = 1;
            projection[TableFields.email] = 1;
            projection[TableFields.userType] = 1;
            projection[TableFields.phoneCountry] = 1;
            projection[TableFields.phone] = 1;
            projection[TableFields.isActive] = 1;
            projection[TableFields.addressDetail] = 1;
            projection[TableFields.stripeCustomerId] = 1;
            projection[TableFields.stripeAccountId] = 1;
            projection[TableFields.deleted] = 1;
            return this;
        };
        this.withPassword = () => {
            projection[TableFields.password] = 1;
            return this;
        };
        this.withEmail = () => {
            projection[TableFields.email] = 1;
            return this;
        };
        this.withUserType = () => {
            projection[TableFields.userType] = 1;
            return this;
        };
        this.withId = () => {
            projection[TableFields.ID] = 1;
            return this;
        };
        this.withName = () => {
            projection[TableFields.name_] = 1;
            return this;
        };
        this.withPasswordResetToken = () => {
            projection[TableFields.passwordResetToken] = 1;
            return this;
        };

        this.execute = async () => {
            return await methodToExecute.call(projection);
        };
    }
};

module.exports = UserService;
