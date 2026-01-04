const { ApiResponseCode } = require("./constants");
const Util = require("./util");

class AppSettingError extends Error {

    constructor(message, isMaintenance = true) {
        super(message);
        this.name = "AppSettingsError";
        this.responseCode = isMaintenance ? ApiResponseCode.UnderMaintenance : ApiResponseCode.ForceUpdate;
    }

    // status = () => this.responseCode
    // response = (res) => Util.getErrorMessageFromString(res.__ ? res.__(this.message) : this.message)

}
module.exports = AppSettingError