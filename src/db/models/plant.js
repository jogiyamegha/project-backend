const mongoose = require("mongoose");
const {ValidationMsgs, TableNames, TableFields, UserTypes, PlantStatus, PropertyTypes} = require("../../utils/constants");
const { getUrl, Folders } = require("../../utils/storage");

const plantSchema = new mongoose.Schema(
    {
        [TableFields.plantUniqueName] : {
            type: String,
            trim: true,
            // unique: true,
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
                type: String,
                trim: true,
            },
        },
        [TableFields.propertyAddress] : {
            [TableFields.propertyName] : {
                type: String,
                trim : true,
                required : [true, ValidationMsgs.PropertyNameEmpty]
            },
            [TableFields.propertyType] : {
                type: Number,
                enum: Object.values(PropertyTypes),
                required : [true, ValidationMsgs.PropertyTypeEmpty]
            },
            [TableFields.address] : {
                type: String,
                trim : true,
                required : [true, ValidationMsgs.AddressEmpty]
            },
            [TableFields.city] : {
                type: String,
                trim : true,
                required : [true, ValidationMsgs.CityEmpty]
            },
            [TableFields.state] : {
                type: String,
                trim : true,
                required : [true, ValidationMsgs.StateEmpty]
            },
            [TableFields.pincode] : {
                type: String,
                trim : true,
                required : [true, ValidationMsgs.PincodeEmpty]
            },
            [TableFields.roofArea] : {
                type: Number
            },
            [TableFields.billAmount] : {
                type: Number,
                required : [true, ValidationMsgs.BillAmountEmpty]
            },
            [TableFields.billImage]: {
                type: String,
                trim: true,
                required : [true, ValidationMsgs.BillImageEmpty]
            },
            [TableFields.electricityRate] :{
                type: Number
            }
        },
        [TableFields.plantStatus] : {
            type: Number,
            enum: Object.values(PlantStatus),
            default: PlantStatus.Submitted,
        },
        [TableFields.approvedBy] : {
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
                    type: String,
                    trim: true,
                },
                [TableFields.approvedOn] : {
                    type: Date,
                }
            },
        },
        [TableFields.rejectedBy] : {
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
                    type: String,
                    trim: true,
                },
                [TableFields.rejectedOn] : {
                    type: Date,
                },
                [TableFields.rejectionReason] : {
                    type: String,
                    trim: true
                }
            },
        },
        [TableFields.isActive] : {
            type: Boolean,
            default: true
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

                if (
                    ret[TableFields.propertyAddress] &&
                    ret[TableFields.propertyAddress][TableFields.billImage]
                ) {
                    ret[TableFields.propertyAddress][TableFields.billImage] =
                        getUrl(
                            Folders.BillImage,
                            ret[TableFields.propertyAddress][TableFields.billImage]
                        );
                }

                return ret;
            },
        },
    }
);

plantSchema.index(
    { [TableFields.plantUniqueName]: 1 },
    {
        unique: true,
        partialFilterExpression: {
            [TableFields.plantStatus]: PlantStatus.Approved,
            [TableFields.plantUniqueName]: { $exists: true, $ne: null }
        }
    }
);


const Plant = mongoose.model(TableNames.Plant, plantSchema);
module.exports = Plant;
