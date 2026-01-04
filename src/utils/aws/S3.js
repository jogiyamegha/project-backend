const S3Lib = require("./metadata");
const Util = require("../util");
const sharp = require("sharp");
const S3_MAX_OBJECT_DELETE_SIZE = 999; // (actual limit is 1000)

exports.Folders = S3Lib.Folders;
exports.Defaults = S3Lib.DefaultFiles;

exports.addFile = async (parentDir, originalFileName, file, shouldCompressIfImageSent = true) => {
    if (!originalFileName || !file) return "";
    let finalFileName = "";
    var tempFileName = originalFileName;
    if (!this.persisOriginalName) {
        //To disable this: Call this method as addFile.call({persisOriginalName:true})
        tempFileName = Util.generateRandomFileName(originalFileName);
    }
    if (shouldCompressIfImageSent == true && Util.isImageFile(tempFileName)) {
        try {
            let src = new sharp(file);
            await src.rotate();
            await src.resize({
                height: 1280,
                withoutEnlargement: true,
            });
            await src.flatten({
                background: {
                    r: 255,
                    g: 255,
                    b: 255,
                },
            });
            await src.jpeg({
                quality: 80,
                progressive: true,
            });
            file = await src.toBuffer();
            tempFileName = tempFileName.substr(0, tempFileName.lastIndexOf(".")) + ".jpg";
        } catch (e) {
            //Ignore, The original image file will be saved as it is.
        }
    }

    if (parentDir) {
        finalFileName = parentDir + "/" + tempFileName;
    } else {
        finalFileName = tempFileName;
    }
    var params = {
        Bucket: S3Lib.defaultBucket,
        Key: finalFileName,
        Body: file,
    };
    try {
        var p = await S3Lib.S3.upload(params).promise();
        return p.Key;
    } catch (e) {
        if (this.handlesError) {
            //To disable this: Call this method as addFile.call({handlesError:true})
            return {
                error: e,
            };
        } else {
            printError(e);
            return "";
        }
    }
};
exports.removeFileById = async (fileKey) => {
    if (!fileKey) return false;
    var params = {
        Bucket: S3Lib.defaultBucket,
        Key: fileKey,
    };
    try {
        var p = await S3Lib.S3.deleteObject(params).promise();
        return true;
    } catch (e) {
        if (this.handlesError) {
            //To disable this: Call this method as removeFileById.call({handlesError:true})
            return {
                error: e,
            };
        } else {
            printError(e);
            return false;
        }
    }
};
exports.removeMultipleFilesByIds = async (...fileKey) => {
    fileKey = fileKey.filter((a) => a);
    if (fileKey.length == 0) return false;
    try {
        await callFunctionWithChunkOfFiles(fileKey, S3_MAX_OBJECT_DELETE_SIZE, async (filesInChunkArray = []) => {
            var params = {
                Bucket: S3Lib.defaultBucket,
                Delete: {
                    Objects: filesInChunkArray.map((a) => {
                        return {
                            Key: a,
                        };
                    }),
                },
            };
            var p = await S3Lib.S3.deleteObjects(params).promise();
        });
        return true;
    } catch (e) {
        if (this.handlesError) {
            //To disable this: Call this method as removeFileById.call({handlesError:true})
            return {
                error: e,
            };
        } else {
            printError(e);
            return false;
        }
    }
};
exports.getFile = (keyName) => {
    console.log(keyName);
    return new Promise(async (resolve, reject) => {
        try {
            const stream = await S3Lib.S3.getObject({
                Bucket: S3Lib.defaultBucket,
                Key: keyName,
            }).promise();
            resolve(stream.Body);
        } catch (e) {
            console.log("error", e);
            resolve();
        }
    });
};
exports.getUrl = (key) => {
    if (key) return this.getBaseURL() + key;
    else return "";
};
exports.getBaseURL = () => {
    return "https://" + S3Lib.defaultBucket + ".s3.amazonaws.com/";
};
exports.getKey = (folder, fileName) => {
    return folder + "/" + fileName;
};
exports.getUploadURL = (fileLocationS3Key) => {
    return S3Lib.S3.getSignedUrl("putObject", {
        Bucket: S3Lib.defaultBucket,
        Key: fileLocationS3Key,
        Expires: 60 * 5 * 24, // 2 Hour  [(5 minutes) * 24]
    });
};
exports.init = async () => {
    try {
        await S3Lib.S3.headBucket({
            Bucket: S3Lib.defaultBucket,
        }).promise();
        console.log("S3 Bucket found");
    } catch (error) {
        if (error.statusCode === 404) console.log("Couldn't connect to S3 Bucket");
        else console.log(error);
    }
};
const printError = (err) => {
    console.log(err);
};
const callFunctionWithChunkOfFiles = async (allFiles = [], chunkSize, functionToTrigger) => {
    var i, j, temparray;
    if (chunkSize > 0) {
        for (i = 0, j = allFiles.length; i < j; i += chunkSize) {
            temparray = allFiles.slice(i, i + chunkSize);
            await functionToTrigger(temparray);
        }
    } else {
        await functionToTrigger(allFiles);
    }
};
