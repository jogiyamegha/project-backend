const mongoose = require("mongoose");
const validator = require("validator");
const {ValidationMsgs, TableNames, TableFields, UserTypes} = require("../../utils/constants");
const ValidationError = require("../../utils/ValidationError");
const bcrypt = require("bcryptjs"); // To compare value with it's Hash
const jwt = require("jsonwebtoken"); // To generate Hash

const adminSchema = new mongoose.Schema(
    {
        [TableFields.name_]: {
            type: String,
            trim: true,
        },
        [TableFields.email]: {
            type: String,
            required: [true, ValidationMsgs.EmailEmpty],
            trim: true,
            unique: true,
            lowercase: true,
            validate(value) {
                if (!validator.isEmail(value)) {
                    throw new ValidationError(ValidationMsgs.EmailInvalid);
                }
            },
        },
        [TableFields.password]: {
            type: String,
            minlength: 8,
            trim: true,
            required: [true, ValidationMsgs.PasswordEmpty],
        },
        [TableFields.tokens]: [
            {
                [TableFields.ID]: false,
                [TableFields.token]: {
                    type: String,
                },
            },
        ],
        [TableFields.userType]: {
            type: Number,
            enum: Object.values(UserTypes),
        },
        [TableFields.passwordResetToken]: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret) {
                delete ret[TableFields.tokens];
                delete ret[TableFields.passwordResetToken];
                delete ret[TableFields.password];
                delete ret.createdAt;
                delete ret.updatedAt;
                delete ret.__v;
            },
        },
    }
);

adminSchema.methods.isValidAuth = async function (password) {
    return await bcrypt.compare(password, this.password);
};

adminSchema.methods.isValidPassword = function (password) {
    const regEx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regEx.test(password);
};

adminSchema.methods.createAuthToken = function () {
    const token = jwt.sign(
        {
            [TableFields.ID]: this[TableFields.ID].toString(),
        },
        process.env.JWT_ADMIN_PK
    );
    return token;
};

//Hash the plaintext password before saving
adminSchema.pre("save", async function (next) {
    if (this.isModified(TableFields.password)) {
        this[TableFields.password] = await bcrypt.hash(this[TableFields.password], 8); // 8 = number of rounds of encryption
    }
    next();
});

adminSchema.index({[TableFields.email]: 1}, {unique: true});

const Admin = mongoose.model(TableNames.Admin, adminSchema);
module.exports = Admin;
