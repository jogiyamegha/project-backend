const mongoose = require("mongoose");
const {ValidationMsgs, TableNames, TableFields, Months, UserPaymentMethod } = require("../../utils/constants");

const billSchema = new mongoose.Schema(
    {
        [TableFields.ppaDetail]: {
            [TableFields.ID] :  false,
            [TableFields.ppaId] : {
                type: mongoose.Schema.Types.ObjectId,   
            },
            [TableFields.plantId] : {
                type: mongoose.Schema.Types.ObjectId,   
            },
            [TableFields.userId] : {
                type: mongoose.Schema.Types.ObjectId,
            },
            [TableFields.ppaUniqueId] : {
                type: String,
                trim: true,
            },
            [TableFields.ppaName] : {
                type: String,
                trim: true,
            },
            [TableFields.plantUniqueId] : {
                type: String,
                trim: true,
            },
            [TableFields.plantUniqueName] : {
                type: String,
                trim: true,
            },
            [TableFields.tarrif] :{ //per uint price of electricity
                type: Number,
            },
            [TableFields.plantCapacity] :{ // size of plant 
                type: Number,
            },
        },
        [TableFields.billingMonth] : {
            type: Number,
            enum: Object.values(Months),
            required: [true ,ValidationMsgs.BillingMonthEmpty]
        },
        [TableFields.billingYear] : {
            type: Number,
            required: [true ,ValidationMsgs.BillingYearEmpty]
        },
        [TableFields.generatedUnits] : {
            type: Number,
            required: [true ,ValidationMsgs.GeneratedUnitsEmpty]
        },
        [TableFields.consumedUnits] : {
            type: Number,
            required: [true ,ValidationMsgs.ConsumedUnitsEmpty]        
        },
        [TableFields.exportedUnits] : {
            type: Number,
            required: [true ,ValidationMsgs.ExportedUnitsEmpty]        
        },
        [TableFields.totalAmount] : {
            type: Number,
        },
        [TableFields.userPaymentMethod] : {
            type: Number,
            enum : Object.values(UserPaymentMethod),
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
        [TableFields.paymentIntentId]: {
            type: String,
            trim: true,
        },
        [TableFields.paymentMethodId]: {
            type: String,
            trim: true,
        },
        [TableFields.paymentMethodTypes]: {
            type: [String],
        },
        [TableFields.paymentReleased]: {
            type: Boolean,
            default: false,
        },
        [TableFields.paymentReleasedAt]: {type: Date},
        [TableFields.paymentReceived]: {type: Boolean, default: false},
        [TableFields.paymentReceivedAt]: {type: Date},
        [TableFields.deleted] : {
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

const Bill = mongoose.model(TableNames.Bill, billSchema);
module.exports = Bill;
