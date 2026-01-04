const {ValidationMsgs, FCMPlatformType, ResponseStatus, ApiResponseCode} = require("../utils/constants");
const AppSettingError = require("../utils/AppSettingError");
const API = require("../utils/apiBuilder");
const Util = require("../utils/util");

const appSettings = async (req, res, next) => {
    try {
        const appVersion = req.header("AppVersion");
        const platform = req.header("platform") || FCMPlatformType.Android;

        // Call adminAuth middleware first

        const appSettings = await StudentService.getStudentAppSettings().withAndroid().withIOS().execute();

        if (!appSettings) {
            next();
        }

        const maintenanceKey = platform == FCMPlatformType.Android ? "androidUnderMaintenance" : "iOSUnderMaintenance";
        const forceUpdateKey = platform == FCMPlatformType.Android ? "androidForceUpdate" : "iOSForceUpdate";
        const versionKey = platform == FCMPlatformType.Android ? "androidVersion" : "iOSVersion";

        if (appSettings[maintenanceKey]) {
            throw new AppSettingError(ValidationMsgs.UnderMaintenance, true);
        }

        if (appSettings[forceUpdateKey] && appVersion !== appSettings[versionKey]) {
            throw new AppSettingError(ValidationMsgs.ForceUpdate, false);
        }

        next();
    } catch (error) {
        if (error.responseCode == ApiResponseCode.UnderMaintenance) {
            res.status(error.responseCode).send(Util.getErrorMessageFromString(ValidationMsgs.UnderMaintenance));
        } else {
            res.status(error.responseCode).send(Util.getErrorMessageFromString(ValidationMsgs.ForceUpdate));
        }
    }
};

module.exports = appSettings;
