const {ValidationMsgs, ResponseStatus} = require("../utils/constants");
const ValidationError = require("../utils/ValidationError");
const Util = require("../utils/util");
const multer = require("multer");
function isValidAudioFile(fileOriginalname) {
    return Util.isAudioFile(fileOriginalname);
}

const uploader = multer({
    fileFilter(req, file, cb) {
        if (isValidAudioFile(file.originalname) == false) {
            return cb(new ValidationError(ValidationMsgs.IncorrectAudio));
        }
        cb(undefined, true);
    },
});

const AudioHandler = class {
    static multipleAudios = function () {
        const m1 = uploader.any();
        const methodToExecute = async (req, res, next) => {
            m1(req, res, function (err) {
                if (err) {
                    res.status(ResponseStatus.InternalServerError).send(Util.getErrorMessage(err));
                } else {
                    let hasError = false;
                    req.files.forEach((element) => {
                        if (isValidAudioFile(element.originalname) == false) {
                            hasError = true;
                            res.status(ResponseStatus.InternalServerError).send(
                                Util.getErrorMessage(new ValidationError(ValidationMsgs.IncorrectAudio))
                            );
                        }
                    });
                    if (hasError == false) {
                        next();
                    }
                }
            });
        };
        return methodToExecute;
    };
};

module.exports = AudioHandler;
