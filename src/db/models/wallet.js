const mongoose = require("mongoose");
const { TableNames, TableFields } = require("../../utils/constants");

const walletSchema = new mongoose.Schema(
    {
        [TableFields.userDetails]: {
            [TableFields.ID] :  false,
            [TableFields.userId] : {
                type: mongoose.Schema.Types.ObjectId,   
            },
            [TableFields.userType] : {
                type: Number,
                enum: Object.values(UserTypes),
            },
            [TableFields.name_] : {
                type: string,
                trim: true,
            },
            [TableFields.deleted] : {
                type: Boolean
            }
        },
        [TableFields.balance] : {
            type: Number
        },
        [TableFields.depositedAmount] : {
            type: Number
        },
        [TableFields.withdrawalAmount] : {
            type: Number
        },
        [TableFields.totalInvestedAmount] : {
            type: Number
        },
        [TableFields.totalReturn] : {
            type: Number
        },
        [TableFields._createdAt]: {
            type: Date,
            default: Date.now()
        },
        [TableFields._updatedAt]: {
            type: Date,
        },
         [TableFields._deletedAt]: {
            type: Date,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret) {
                delete ret.createdAt;
                delete ret.updatedAt;
                delete ret.__v;
            },
        },
    }
);

const Wallet = mongoose.model(TableNames.Wallet, walletSchema);
module.exports = Wallet;
