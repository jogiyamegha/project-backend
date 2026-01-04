const mongoose = require("mongoose");
const {ValidationMsgs, TableNames, TableFields } = require("../../utils/constants");

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
            [TableFields.tarrif] :{ //per uint price of electricity
                type: Number,
                required: [true, ValidationMsgs.TarrifEmpty],
            },
            [TableFields.plantCapacity] :{ // size of plant 
                type: Number,
                required: [true, ValidationMsgs.PlantCapacityEmpty],
            },

        },
        [TableFields.billingMonth] : {
            type: String,
        },
        [TableFields.billingYear] : {
            type: Number,
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
            default: 0
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
