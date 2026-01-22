const mongoose = require("mongoose");
const {
    TableNames,
    TableFields,
    PayoutStatusTypes,
} = require("../../utils/constants");

const payoutSchema = new mongoose.Schema(
    {
        [TableFields.billReference]: {
            type: mongoose.Schema.Types.ObjectId,
            ref: TableNames.Bill,
            required: true,
        },
        [TableFields.stripeTransferId]: {
            type: String,
        },
        [TableFields.stripePaymentIntentId]: {
            type: String,
        },
        // [TableFields.hostAmount]: {
        //     //amount to be paid to host that comes directly affter adding host amount of bookings
        //     type: Number,
        //     required: true,
        //     min: 0,
        // },
        [TableFields.currency]: {
            type: String,
            default: "inr",
            trim: true,
        },
        [TableFields.payoutStatus]: {
            type: Number,
            enum: Object.values(PayoutStatusTypes),
            default: PayoutStatusTypes.Pending,
        },
        [TableFields.stripePayoutId]: {
            type: String,
            trim: true,
        },
        [TableFields.stripeAccountId]: {
            type: String,
            trim: true,
        },
        [TableFields.payoutDate]: {
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
payoutSchema.index({[TableFields.billReference]: 1});
payoutSchema.index({[TableFields.payoutStatus]: 1});
payoutSchema.index({[TableFields.stripePayoutId]: 1});

const Payout = mongoose.model(TableNames.Payout, payoutSchema);
module.exports = Payout;
