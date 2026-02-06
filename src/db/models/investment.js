const mongoose = require("mongoose");
const { ValidationMsgs, TableNames, TableFields, UserTypes, PlantStatus } = require("../../utils/constants");

const investmentSchema = new mongoose.Schema(
    {
        [TableFields.ppaDetail]: {
            [TableFields.ID]: false,
            [TableFields.ppaId]: {
                type: mongoose.Schema.Types.ObjectId,
            },
            [TableFields.plantId]: {
                type: mongoose.Schema.Types.ObjectId,
            },
            [TableFields.userId]: {
                type: mongoose.Schema.Types.ObjectId,
            },
            [TableFields.plantCapacity]: { // size of plant 
                type: Number,
                required: [true, ValidationMsgs.PlantCapacityEmpty],
            },
        },
        [TableFields.investorDetails]: {
            [TableFields.ID]: false,
            [TableFields.investorId]: {
                type: mongoose.Schema.Types.ObjectId,
            },
            [TableFields.userType]: {
                type: Number,
                enum: [2, 3], // Investor = 2, Consumer = 3
            },
            [TableFields.name_]: {
                type: String,
                trim: true,
            },
            [TableFields.deleted]: {
                type: Boolean
            }
        },
        [TableFields.investmentAmount]: {
            type: Number,
            required: [true, ValidationMsgs.InvestmentAmountEmpty]
        },
        [TableFields.plantCapacityReserved]: {
            type: Number,
        },
        [TableFields.investmentPercent]: {
            type: Number
        },
        [TableFields.isActive]: {
            type: Boolean,
            default: false
        },
        [TableFields.deleted]: {
            type: Boolean,
            default: false,
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

const Investment = mongoose.model(TableNames.Investment, investmentSchema);
module.exports = Investment;
