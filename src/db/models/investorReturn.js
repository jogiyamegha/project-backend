const mongoose = require("mongoose");
const { TableNames, TableFields } = require("../../utils/constants");

const investorReturnSchema = new mongoose.Schema(
    {
        [TableFields.investorId] : {
            type: mongoose.Schema.Types.ObjectId, 
        },
        [TableFields.investmentDetail] : {
            [TableFields.ID] : false,
            [TableFields.investmentId] : {
                type: mongoose.Schema.Types.ObjectId, 
            },
            [TableFields.investmentAmount] : {
                type: Number,
            },
            [TableFields.investmentPercent] : {
                type: Number
            },
        },
        [TableFields.billDetail]: {
            [TableFields.ID] :  false,
            [TableFields.billId] : {
                type: mongoose.Schema.Types.ObjectId,   
            },
            [TableFields.ppaId] : {
                type: mongoose.Schema.Types.ObjectId,
            }
        },
        [TableFields.returnAmount] : {
            type: Number
        },
        [TableFields.isPaid] : {
            type: Boolean,
            default: false,
        },
        [TableFields.paymentRefId] : {
            type: String,
            trim: true
        },
        [TableFields.paymentDate] : {
            type: Date
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

const InvestorReturn = mongoose.model(TableNames.InvestorReturn, investorReturnSchema);
module.exports = InvestorReturn;
