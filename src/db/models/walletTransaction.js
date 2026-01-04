const mongoose = require("mongoose");
const { TableNames, TableFields, UserTypes, ValidationMsgs, Method, TransactionType } = require("../../utils/constants");

const walletTransactionSchema = new mongoose.Schema(
    {
        [TableFields.fromUserDetail] : {
            [TableFields.walletId] : {
                type: mongoose.Schema.Types.ObjectId
            },
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
        },
        [TableFields.toUserDetail] : {
            [TableFields.walletId] : {
                type: mongoose.Schema.Types.ObjectId
            },
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
        },
        [TableFields.transactionType] : {
            type: Number,
            enum: Object.values(TransactionType)
        },
        [TableFields.transactionAmount] : {
            type: Number,
        },
        [TableFields.transactionId] : {
            type: String,
            trim: true,
        },
        [TableFields.transactionStatus] : {
            type: Number,
            enum: Object.values(TransactionStatus)
        },
        [TableFields.bankReferenceId] : {
            type: String,
            trim: true,
        },
        [TableFields.description] : {
            type: String,
            trim: true,
        },
        [TableFields.note] : {
            type: String,
            trim: true,
        },
        [TableFields.processedAt] : {
            type: Date
        },
        [TableFields.processedBy] : {
            type: mongoose.Schema.Types.ObjectId
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

const walletTransaction = mongoose.model(TableNames.WalletTransaction, walletTransactionSchema);
module.exports = walletTransaction;
