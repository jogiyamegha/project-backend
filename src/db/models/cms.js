const mongoose = require("mongoose");
const {
    TableNames, TableFields, CmsTypes
} = require("../../utils/constants");

const cmsSchema = new mongoose.Schema(
    {
        [TableFields.type]: {
            type: Number,
            enum: Object.values(CmsTypes),
        },
        [TableFields.content]: { type: String, },
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

const Cms = mongoose.model(TableNames.Cms, cmsSchema );
module.exports = Cms;
