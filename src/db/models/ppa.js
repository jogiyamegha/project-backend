const mongoose = require("mongoose");
const {ValidationMsgs, TableNames, TableFields, UserTypes, PlantStatus, PropertyTypes} = require("../../utils/constants");
const { getUrl, Folders } = require("../../utils/storage");

const ppaSchema = new mongoose.Schema(
    {
        [TableFields.plantDetail]: {
            [TableFields.ID] :  false,
            [TableFields.plantId] : {
                type: mongoose.Schema.Types.ObjectId,   
            },
            [TableFields.propertyName] : {
                type: String,
                trim: true,
            },
            [TableFields.propertyType] : {
                type: Number,
                enum: Object.values(PropertyTypes),
            },
            [TableFields.address] : {
                type: String,
                trim : true,
            },
            [TableFields.city] : {
                type: String,
                trim : true,
            },
            [TableFields.userId] : {
                type: mongoose.Schema.Types.ObjectId,
            },
            [TableFields.name_] : {
                type: String,
                trim: true
            }
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
                
                if (ret.hasOwnProperty([TableFields.ppaDocument])) {
                    ret[TableFields.ppaDocument] = getUrl(Folders.PpaDocs, ret[TableFields.ppaDocument]);
                };
                if (ret.hasOwnProperty([TableFields.leaseDocument])) {
                    ret[TableFields.leaseDocument] = getUrl(Folders.LeaseDocs, ret[TableFields.leaseDocument]);
                };
            },
        },
    }
);

const Ppa = mongoose.model(TableNames.Ppa, ppaSchema);
module.exports = Ppa;
