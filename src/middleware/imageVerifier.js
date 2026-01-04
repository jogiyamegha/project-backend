const {ValidationMsgs, ResponseStatus, TableFields, ApiResponseCode} = require("../utils/constants");
const ValidationError = require("../utils/ValidationError");
const Util = require("../utils/util");
const multer = require("multer");
// const IMAGE_SIZE=5000000 // Added Image compression in S3.js
function isValidImageFile(fileOriginalname) {
    return Util.isImageFile(fileOriginalname);
}
// function isImageOrPDFFile(fileOriginalname){
//     return isValidImageFile(fileOriginalname) || Util.isValidPDFFile(fileOriginalname)
// }
function isImageVideoOrPDFFile(fileOriginalname) {
    return (
        isValidImageFile(fileOriginalname) ||
        Util.isValidPDFFile(fileOriginalname) ||
        Util.isValidVideoFile(fileOriginalname)
    );
}
const uploader = multer({
    // limits:{
    //     fileSize: IMAGE_SIZE //Added Image compression in S3.js
    // },
    fileFilter(req, file, cb) {
        if (isValidImageFile(file.originalname) == false) {
            return cb(new ValidationError(ValidationMsgs.incorrectImage));
        }
        cb(undefined, true);
    },
});
const pdfAndImagesAndVideosUploader = multer({
    fileFilter(req, file, cb) {
        if (file.fieldname == TableFields.signatures && isValidImageFile(file.originalname) == false) {
            return cb(new ValidationError(ValidationMsgs.incorrectImage));
        }
        if (file.fieldname == TableFields.documents && Util.isValidPDFFile(file.originalname) == false) {
            return cb(new ValidationError(ValidationMsgs.incorrectPDF));
        }
        cb(undefined, true);
    },
});
const uploaderImageAndVideo = multer({
    fileFilter(req, file, cb) {
        if (
            [TableFields.images, TableFields.signatures, TableFields.evidences, TableFields.injuryNotations].includes(
                file.fieldname
            ) &&
            isValidImageFile(file.originalname) == false
        ) {
            return cb(new ValidationError(ValidationMsgs.incorrectImage));
        }
        if (file.fieldname == TableFields.videos && Util.isValidVideoFile(file.originalname) == false) {
            return cb(new ValidationError(ValidationMsgs.incorrectVideo));
        }
        cb(undefined, true);
    },
});

const ImageHandler = class {
    static single = function (fieldName) {
        const m1 = uploader.single(fieldName);
        const methodToExecute = async (req, res, next) => {
            m1(req, res, function (err) {
                if (err) {
                    // console.log(err);
                    res.status(ResponseStatus.InternalServerError).send(Util.getErrorMessage(err));
                } else {
                    next();
                }
            });
        };
        return methodToExecute;
    };

    static multipleImage = function () {
        const m1 = uploader.any();
        const methodToExecute = async (req, res, next) => {
            m1(req, res, function (err) {
                if (err) {
                    res.status(ResponseStatus.InternalServerError).send(Util.getErrorMessage(err));
                } else {
                    let hasError = false;
                    req.files.forEach((element) => {
                        if (isValidImageFile(element.originalname) == false) {
                            hasError = true;
                            res.status(ResponseStatus.InternalServerError).send(
                                Util.getErrorMessage(new ValidationError(ValidationMsgs.incorrectImage))
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

    // static multiplePDFAndImages= function(pdfFieldName,imagesFieldName){
    //     const m1=pdfAndImagesUploader.fields([
    //         {name: pdfFieldName},
    //         {name: imagesFieldName}
    //     ])
    //     const methodToExecute=async (req,res,next)=>{
    //         m1(req, res, function (err) {
    //             if (err) {
    //                 res.status(ResponseStatus.InternalServerError).send(
    //                     Util.getErrorMessage(err))
    //             }else{
    //                 next()
    //             }
    //         })
    //     }
    //     return methodToExecute;
    // }

    static multiplePDFAndImagesBasedOnType = function () {
        const m1 = multer({
            limits: {
                fileSize: 5000000 * 20, // 5MB * 20
            },
        }).any();
        const methodToExecute = async (req, res, next) => {
            m1(req, res, function (err) {
                if (err) {
                    res.status(ResponseStatus.InternalServerError).send(Util.getErrorMessage(err));
                } else {
                    // let hasError=false
                    // req.files.forEach(element => {
                    //     if(isImageOrPDFFile(element.originalname)==undefined){
                    //         hasError=true
                    //         res.status(ResponseStatus.InternalServerError).send(
                    //             Util.getErrorMessage(new ValidationError(ValidationMsgs.incorrectImageOrPDF)))
                    //     }
                    // });
                    // if(hasError==false){
                    next();
                    // }
                }
            });
        };
        return methodToExecute;
    };

    static multipleImagesVideosAndPDF = function () {
        const m1 = multer({
            limits: {
                fileSize: 5000000 * 100, // 5MB * 100=500MB maximum
            },
        }).any();
        const methodToExecute = async (req, res, next) => {
            m1(req, res, function (err) {
                if (err) {
                    res.status(ResponseStatus.InternalServerError).send(Util.getErrorMessage(err));
                } else {
                    let hasError = false;
                    req.files.forEach((element) => {
                        if (isImageVideoOrPDFFile(element.originalname) == undefined) {
                            hasError = true;
                            res.status(ResponseStatus.InternalServerError).send(
                                Util.getErrorMessage(new ValidationError(ValidationMsgs.incorrectImageVideosOrPDF))
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

    static multipleImagesAndVideos = function (fieldNameVideo, ...fieldNameImage) {
        const m1 = uploaderImageAndVideo.fields([
            ...fieldNameImage.map((a) => {
                return {name: a};
            }),
            {name: fieldNameVideo},
        ]);
        const methodToExecute = async (req, res, next) => {
            m1(req, res, function (err) {
                if (err) {
                    // console.log(err)
                    res.status(ResponseStatus.InternalServerError).send(Util.getErrorMessage(err));
                } else {
                    next();
                }
            });
        };
        return methodToExecute;
    };

    static uploadCSVFile = function (fieldName) {
        const m1 = uploader.single(fieldName);
        const methodToExecute = async (req, res, next) => {
            m1(req, res, function (err) {
                if (err) {
                    // console.log(err);
                    res.status(ApiResponseCode.ClientOrServerError).send(Util.getErrorMessage(err));
                } else {
                    next();
                }
            });
        };
        return methodToExecute;
    }
};

// const MultipleImageAndVideoHandler=class{
//     static multiple=function (fieldName) {
//         multer().array(TableFields.videos)
//     }
// }

module.exports = ImageHandler;
