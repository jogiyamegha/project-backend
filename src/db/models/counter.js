const {TableNames, TableFields, CounterSchemaType} = require("../../utils/constants");
const mongoose = require("mongoose");

const rootSchema = {
    [TableFields.value]: {
        type: Number,
        default: 1,
    },
};

const counterSchema = new mongoose.Schema(
    {
        ...rootSchema,
    },
    {
        discriminatorKey: TableFields.type,
    }
);

const CounterRoot = mongoose.model(TableNames.Counter, counterSchema);

const CaseCounter = CounterRoot.discriminator(CounterSchemaType.Case, counterSchema);

module.exports = {
    CounterRoot,
    CaseCounter,
};
