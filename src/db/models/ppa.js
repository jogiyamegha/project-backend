const mongoose = require("mongoose");
const {ValidationMsgs, TableNames, TableFields, UserTypes, PlantStatus} = require("../../utils/constants");

const ppaSchema = new mongoose.Schema(
    {
        [TableFields.plantDetail]: {
            [TableFields.ID] :  false,
            [TableFields.plantId] : {
                type: mongoose.Schema.Types.ObjectId,   
            },
            [TableFields.userId] : {
                type: mongoose.Schema.Types.ObjectId,
            },
        },
        [TableFields.plantCapacity] :{ // size of plant 
            type: Number,
            required: [true, ValidationMsgs.PlantCapacityEmpty],
        },
        [TableFields.tarrif] :{ //per uint price of electricity
            type: Number,
            required: [true, ValidationMsgs.TarrifEmpty],
        },
        [TableFields.expectedYears] : {
            type: Number,
            required: [true, ValidationMsgs.ExpectedYearsEmpty],
        },
        [TableFields.startDate] : {
            type: Date,
            required: [true, ValidationMsgs.StartDateEmpty],
        },
        [TableFields.endDate] : {
            type: Date,
        },
        [TableFields.ppaDocument] :{
            type: String,
            required: [true, ValidationMsgs.PpaDocumentEmpty],
        },
        [TableFields.leaseDocument] :{
            type: String,
            required: [true, ValidationMsgs.LeaseDocumentEmpty],
        },
        [TableFields.isSigned] : {
            type: Boolean,
            default: false
        },
        [TableFields.signedAt] : {
            type: Date,
            default: Date.now
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
            default: Date.now()
        },
         [TableFields._deletedAt]: {
            type: Date,
            default: Date.now()
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

const Ppa = mongoose.model(TableNames.Ppa, ppaSchema);
module.exports = Ppa;
