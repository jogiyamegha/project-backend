const mongoose = require("mongoose");
const {TableNames, TableFields, PaymentStatusTypes, PaymentTypes, UserTypes} = require("../../utils/constants");

const paymentSchema = new mongoose.Schema(
    {
        [TableFields.billReference]: {
            type: mongoose.Schema.Types.ObjectId,
            ref: TableNames.Bill,
            required: true,
        },
        [TableFields.userReference]: {
            type: mongoose.Schema.Types.ObjectId,
            ref: TableNames.User,
            required: true,
        },
        [TableFields.paymentType]: {
            type: Number,
            enum: Object.values(PaymentTypes),
            required: true,
        },
        [TableFields.amount]: {
            type: Number,
            required: true,
            min: 0,
        },
        [TableFields.currency]: {
            type: String,
            default: "INR",
            trim: true,
        },
        [TableFields.paymentStatus]: {
            type: Number,
            enum: Object.values(PaymentStatusTypes),
            default: PaymentStatusTypes.Pending,
        },
        [TableFields.stripeConsumerId]: {
            type: String,
            trim: true,
        },
        [TableFields.stripePaymentIntentId]: {
            type: String,
            trim: true,
        },
        [TableFields.stripePayoutId]: {
            type: String,
            trim: true,
        },
        [TableFields.paymentMethod]: {
            type: String,
            trim: true,
        },
        [TableFields.paymentDate]: {
            type: Date,
        },
        [TableFields.failureReason]: {
            type: String,
            trim: true,
        },
        [TableFields.metadata]: {
            type: mongoose.Schema.Types.Mixed,
        },
        [TableFields._createdAt]: {
            type: Date,
            default: Date.now,
        },
        [TableFields._updatedAt]: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false,
        toJSON: {
            transform: function (doc, ret) {
                delete ret.__v;
            },
        },
    }
);

// Indexes for efficient queries
paymentSchema.index({[TableFields.billReference]: 1});
paymentSchema.index({[TableFields.userReference]: 1});
paymentSchema.index({[TableFields.paymentStatus]: 1});
paymentSchema.index({[TableFields.stripePaymentIntentId]: 1});
paymentSchema.index({[TableFields.stripePayoutId]: 1});

const Payment = mongoose.model(TableNames.Payment, paymentSchema);
module.exports = Payment;
