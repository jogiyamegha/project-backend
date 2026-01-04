const {
    InterfaceTypes, ValidationMsgs, CmsTypes, TableFields
} = require("../../utils/constants");
const CmsService = require("../../db/services/CmsService");
const ValidationError = require("../../utils/ValidationError");

exports.getPrivacyPolicy = async function () {
    const pageContent = await CmsService.findByType(CmsTypes.PrivacyPolicy).withContent().execute();

    if (pageContent) {
        return pageContent[TableFields.content];
    }
};

exports.getAboutUs = async function () {
    const pageContent = await CmsService.findByType(CmsTypes.Aboutus).withContent().execute();
    if (pageContent) {
        return pageContent[TableFields.content];
    }
};

exports.getTermsAndConditions = async function () {
    const pageContent = await CmsService.findByType(CmsTypes.TermsConditions).withContent().execute();
    if (pageContent) {
        return pageContent[TableFields.content];
    }
};

exports.editAboutUs = async function (req) {
    try {
        await CmsService.insertRecord(
            CmsTypes.Aboutus,
            req.body.content
        );
    } catch (error) {
        throw new error();
    }
};

exports.editPrivacyPolicy = async function (req) {
    try {
        await CmsService.insertRecord(
            CmsTypes.PrivacyPolicy,
            req.body.content
        );
    } catch (error) {
        throw new error();
    }
};

exports.editTermsAndConditions = async function (req) {
    try {
        await CmsService.insertRecord(
            CmsTypes.TermsConditions,
            req.body.content
        );
    } catch (error) {
        throw new error();
    }
};

exports.updateAppSettings = async (req) => {
    const interfaceType = req.body.interface;
    if (interfaceType === InterfaceTypes.User.UserApp) {
        return await UserAppSettingsService.updateUserAppSettings(req.body).execute();
    } else {
        throw new ValidationError(ValidationMsgs.ParametersError);
    }
};

exports.getAppSettings = async (req) => {
    const interfaceType = req.query.interface;

    let record;
    if (interfaceType === InterfaceTypes.User.UserApp) {
        record = await UserAppSettingsService.getUserAppSettings().withAndroid().withIOS().execute();
        if (!record) {
            record = await UserAppSettingsService.updateUserAppSettings().withAndroid().withIOS().execute();
        }
    } else {
        throw new ValidationError(ValidationMsgs.ParametersError);
    }

    return record;
};
