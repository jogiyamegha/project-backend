const moment = require("moment");

const fs = require("fs");
const Util = class {
    static isImageFile(fileOriginalName) {
        return fileOriginalName
        .toLocaleLowerCase()
        .match(/\.(jpg|jpeg|jpe|jif|jfif|jfi|png|bmp|webp|tiff|tif|dib|svg|svgz|heic|heif|csv|xlsx)$/) == undefined
            ? false
            : true;
    }
    static isAudioFile(fileOriginalName) {
        return fileOriginalName.toLocaleLowerCase().match(/\.(mp3|m4a)$/) == undefined ? false : true;
    }
    static isExcelFile(fileOriginalName) {
        return fileOriginalName.toLocaleLowerCase().match(/\.(xlsx|xls)$/) == undefined ? false : true;
    }
    static getErrorMessage(mongooseException) {
        try {
            const mainJSONKeys = Object.keys(mongooseException.errors);
            if (mongooseException.errors[mainJSONKeys[0]].errors) {
                const jsonKeys = Object.keys(mongooseException.errors[mainJSONKeys[0]].errors);
                return {
                    error: mongooseException.errors[mainJSONKeys[0]].errors[jsonKeys[0]].properties.message,
                };
            } else {
                return {
                    error: mongooseException.errors[mainJSONKeys[0]].message,
                };
            }
        } catch (e) {
            return {
                error: mongooseException.message,
            };
        }
    }

    static getErrorMessageFromString(message) {
        return {
            error: message,
        };
    }

    static getBaseURL() {
        let baseURL = process.env.HOST;
        if (Util.useProductionSettings() == false) {
            baseURL += ":" + process.env.PORT;
        }
        return baseURL;
    }

    static useProductionSettings() {
        return Util.parseBoolean(process.env.isProd);
    }

    static parseBoolean(b) {
        return (b + "").toLowerCase() == "true";
    }

    static escapeRegex(textStr = "") {
        return textStr.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
    }

    static wrapWithRegexQry(textStr = "") {
        return new RegExp(Util.escapeRegex(textStr));
    }

    static generateRandomFileName(filename) {
        var ext = filename.split(".").pop();
        var random = Math.floor(Math.random() * 9000000000000000);
        let timestamp = new Date().getTime().toString();
        filename = timestamp + "_" + random + "." + ext;
        return filename;
    }

    static tokenMaxAge() {
        return new Date("2099-12-31");
    }

    static removeTime(dateObj) {
        if (!dateObj) {
            return;
        }
        let year = dateObj.getUTCFullYear();
        let month = dateObj.getUTCMonth() + 1;
        let dt = dateObj.getUTCDate();
        if (dt < 10) {
            dt = "0" + dt;
        }
        if (month < 10) {
            month = "0" + month;
        }
        return year + "-" + month + "-" + dt;
    }

    static generateRandomPassword(length) {
        var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        var upperCaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var lowerCaseChars = "abcdefghijklmnopqrstuvwxyz";
        var specialChars = "@$#";
        var numbers = "0123456789";

        var getRandomChar = (characters) => characters.charAt(Math.floor(Math.random() * characters.length));
        var result = getRandomChar(upperCaseChars);
        result += getRandomChar(lowerCaseChars);
        result += getRandomChar(numbers);
        result += getRandomChar(specialChars);
        length = length - 4;

        for (let i = 0; i < length; i++) {
            result += getRandomChar(characters);
        }
        return result;
    }

    static generateRandomOTP(length) {
        var result = "";
        var characters = "0123456789";
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    static addZero = (i) => {
        if (i < 10) {
            i = "0" + i;
        }
        return i;
    };

    static getSystemDateUTC = (d) => {
        let currentDate = new Date(new Date().toUTCString());
        return (
            currentDate.getFullYear() +
            "-" +
            this.addZero(currentDate.getMonth() + 1) +
            "-" +
            this.addZero(currentDate.getDate())
        );
    };

    static getSystemDateTimeUTC = () => {
        return new Date(new Date().toUTCString());
    };

    static getDateTimeMST = () => {
        return new Date(
            new Date().toLocaleString("en-US", {
                timeZone: "America/Denver",
            })
        );
    };

    static getCurrentUTCTime = () => {
        const now = new Date().getUTCMilliseconds();
        dateFormat(now, "dddd, mmmm dS, yyyy, h:MM:ss TT");
    };

    static msToTime(duration) {
        console.log(duration);
        var minutes = Math.floor((duration / (1000 * 60)) % 60),
            hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

        hours = hours < 10 ? "0" + hours : hours;
        minutes = minutes < 10 ? "0" + minutes : minutes;

        return hours + ":" + minutes;
    }

    static getFileContent(filePath) {
        let content = "";
        if (fs.existsSync(filePath)) {
            content = fs.readFileSync(filePath);
        }
        return content;
    }

    static isValidMobileNumber(v) {
        return v.length >= 7 && v.length <= 12;
    }

    static isValidName = (name) => {
        const regEx = /^[a-zA-Z0-9\s]{1,50}$/;
        return regEx.test(name);
    };

    static isValueDuplicate = (arr) => {
        return new Set(arr).size !== arr.length;
    };

    static trimLeadingZeros(stringValue) {
        if (stringValue) {
            try {
                stringValue = stringValue.replace(/^0+/, "");
            } catch (error) {
                throw error;
            }
        }
        return stringValue;
    }

    static populateMissingDates = (dataObject, startDate, endDate) => {
        dataObject = dataObject.map((val) => {
            return {...val, createdAt: moment(val.createdAt).format("YYYY-MM-DD")};
        });
        let startMonth = parseInt(moment(startDate).format("MM"));
        let endMonth = parseInt(moment(endDate).format("MM"));
        let startYear = parseInt(moment(endDate).format("YYYY"));
        let endYear = parseInt(moment(endDate).format("YYYY"));
        // console.log(startMonth,endMonth)
        if (startMonth === endMonth) {
            const allDates = Array.from(
                new Set(dataObject.map((entry) => moment(entry.createdAt).format("YYYY-MM-DD")))
            );
            // Get the unique months from the dataObject
            const uniqueMonths = Array.from(
                new Set(allDates.map((date) => moment(date).format("YYYY-MM-DD").toString().slice(0, 7)))
            );
            // console.log(parseInt(moment(endDate).format("D")))

            // Populate missing dates for each month in the dataObject with zeros
            uniqueMonths.forEach((month) => {
                const monthDates = allDates.filter((date) =>
                    moment(date.toString().startsWith(month)).format("YYYY-MM-DD")
                );
                // for (let i = parseInt(moment(startDate).format("D")); i <= parseInt(moment(endDate).format("D")); i++) {
                //     const day = i < 10 ? `0${i}` : `${i}`
                //     const date = `${startYear}-${startMonth}-${day}`
                //     console.log("monthDates",monthDates,"date",date)
                //     if (!monthDates.includes(date)) {
                //     dataObject.push({createdAt: date,emojiId:0,title:""})
                //     }
                // }
                for (let i = parseInt(moment(startDate).format("D")); i <= parseInt(moment(endDate).format("D")); i++) {
                    const day = i < 10 ? `0${i}` : `${i}`;
                    const date = `${startYear}-${startMonth}-${day}`;

                    if (!monthDates.includes(moment(date).format("YYYY-MM-DD"))) {
                        dataObject.push({createdAt: date, emojiId: 0, title: ""});
                    }
                }
            });
        } else {
            const monthEnd = moment(startDate).endOf("month").format("YYYY-MM-DD");
            const monthStart = moment(endDate).startOf("month").format("YYYY-MM-DD");
            // console.log("monthEnd",monthEnd,"monthStart",monthStart)

            const allDates = Array.from(
                new Set(dataObject.map((entry) => moment(entry.createdAt).format("YYYY-MM-DD")))
            );
            // Get the unique months from the dataObject
            const uniqueMonths = Array.from(
                new Set(allDates.map((date) => moment(date).format("YYYY-MM-DD").toString().slice(0, 7)))
            );
            // console.log(parseInt(moment(endDate).format("D")))

            // Populate missing dates for each month in the dataObject with zeros
            uniqueMonths.forEach((month) => {
                const monthDates = allDates.filter((date) => date.toString().startsWith(month));
                // for (let i = parseInt(moment(startDate).format("D")); i <= parseInt(moment(monthEnd).format("D")); i++) {
                //     const day = i < 10 ? `0${i}` : `${i}`
                //     const month = startMonth < 10 ? `0${startMonth}` : `${startMonth}`

                //     const date = `${startYear}-${month}-${day}`
                //     // console.log(`${month}-${day}`)
                //     // console.log(date)
                //     if (!monthDates.includes(date)) {
                //         dataObject.push({createdAt: date,emojiId:0,title:""})
                //         }
                // }
                for (
                    let i = parseInt(moment(startDate).format("D"));
                    i <= parseInt(moment(monthEnd).format("D"));
                    i++
                ) {
                    const day = i < 10 ? `0${i}` : `${i}`;
                    const month = startMonth < 10 ? `0${startMonth}` : `${startMonth}`;
                    const date = `${startYear}-${month}-${day}`;

                    if (!monthDates.includes(moment(date).format("YYYY-MM-DD"))) {
                        dataObject.push({createdAt: date, emojiId: 0, title: ""});
                    }
                }
            });
            uniqueMonths.forEach((month) => {
                const monthDates = allDates.filter((date) => date.toString().startsWith(month));
                // console.log("dataObject",monthDates)

                // for (let i = parseInt(moment(monthStart).format("D")); i <= parseInt(moment(endDate).format("D")); i++) {
                //     const day = i < 10 ? `0${i}` : `${i}`
                //     const month = endMonth < 10 ? `0${endMonth}` : `${endMonth}`
                //     const date = `${endYear}-${month}-${day}`

                //     if (!monthDates.includes(date.toString())) {
                //         dataObject.push({createdAt: date,emojiId:0,title:""})
                //         }
                // }
                for (
                    let i = parseInt(moment(monthStart).format("D"));
                    i <= parseInt(moment(endDate).format("D"));
                    i++
                ) {
                    const day = i < 10 ? `0${i}` : `${i}`;
                    const month = endMonth < 10 ? `0${endMonth}` : `${endMonth}`;
                    const date = `${endYear}-${month}-${day}`;

                    if (!monthDates.includes(moment(date).format("YYYY-MM-DD"))) {
                        dataObject.push({createdAt: date, emojiId: 0, title: ""});
                    }
                }
            });
            // console.log("dataObject",dataObject)

            // uniqueMonths.forEach((month) => {
            //     const monthDates = allDates.filter((date) => moment(date.toString().startsWith(month)).format("YYYY-MM-DD"));
            //     for (let i = 1; i <= moment(month + '-01').daysInMonth(); i++) {
            //         const day = i < 10 ? `0${i}` : `${i}`;
            //         const date = `${month}-${day}`;
            //         if (!monthDates.includes(date)) {
            //             dataObject.push({ createdAt: date, emojiId: 0, title: "" });
            //         }
            //     }
            // });
        }

        // Sort dataObject based on dates
        return dataObject;
    };

    static padValue(value, padCount = 4, padSymbol = "0") {
        return String(value).padStart(padCount, padSymbol);
    }

    static median(array) {
        if (array.length === 0) return 0;
        array.sort((a, b) => a - b);
        const mid = Math.floor(array.length / 2);
        if (array.length % 2 === 0) {
            return (array[mid - 1] + array[mid]) / 2;
        }
        return array[mid];
    }
    
};
module.exports = Util;
