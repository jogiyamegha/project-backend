const { TableFields } = require("../../utils/constants");
const Cms = require("../models/cms");

class CmsService {
    static findByType = (type) => new ProjectionBuilder(async function () {
        return await Cms.findOne(
            { type },
            this
        );
    });

    static insertRecord = async (type, content) => await Cms.findOneAndUpdate(
        { [TableFields.type]: type },
        { [TableFields.content]: content },
        {
            upsert: true, new: true
        }
    );
}

const ProjectionBuilder = class {
    constructor(methodToExecute) {
        const projection = {};

        this.withType = () => {
            projection[TableFields.type] = 1;

            return this;
        };
        this.withContent = () => {
            projection[TableFields.content] = 1;

            return this;
        };

        this.execute = async () => await methodToExecute.call(projection);
    }
};

module.exports = CmsService;
