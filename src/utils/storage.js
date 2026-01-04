const Util = require("./util");
const S3Lib = require("./metadata");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const imageThumbnail = require("./thumbnail/index");
exports.Folders = S3Lib.Folders;
const convert = require("heic-convert");

exports.saveAudioFile = async (audioBase64String, saveFilePath, originalFileName) => {
    let finalFileName = "";
    let tempFileName = await Util.generateRandomFileName(originalFileName);
    let buffer = Buffer.from(audioBase64String, "base64");
    try {
        if (saveFilePath) {
            await createDirectories(saveFilePath);
            finalFileName = saveFilePath + "/" + tempFileName;
        } else {
            finalFileName = tempFileName;
        }
        await fs.writeFileSync(finalFileName, buffer);
        return finalFileName;
    } catch (e) {
        if (this.handlesError) {
            //To disable this: Call this method as addFile.call({handlesError:true})
            return {
                error: e,
            };
        } else {
            console.log("File write error:", e);
            return "";
        }
    }
};

exports.saveCropImage = async (imgBase64String, saveFilePath, extension, originalFileName) => {
    imgBase64String = imgBase64String.split(",");
    let finalFileName = "";
    let tempFileName = await Util.generateRandomFileName(originalFileName);
    let buffer = Buffer.from(imgBase64String[1], "base64");
    try {
        if (saveFilePath) {
            await createDirectories(saveFilePath);
            finalFileName = saveFilePath + "/" + tempFileName;
        } else {
            finalFileName = tempFileName;
        }
        await fs.writeFileSync(finalFileName, buffer);
        return tempFileName;
    } catch (e) {
        if (this.handlesError) {
            //To disable this: Call this method as addFile.call({handlesError:true})
            return {
                error: e,
            };
        } else {
            console.log("File write error:", e);
            return "";
        }
    }
};
exports.addFile = async (parentDir, originalFileName, file, shouldCompressIfImageSent = true, fileObj) => {
    if (!originalFileName || !file) return "";
    let finalFileName = "";
    var tempFileName = await Util.generateRandomFileName(originalFileName);
    let fileMimeType = fileObj.mimetype;
    let originalName = fileObj.originalname;

    let fileType = fileMimeType.split("/").pop();
    let extension = originalName.split(".").pop();

    if (
        fileType == "heic" ||
        fileType == "heif" ||
        (fileType == "octet-stream" && (extension == "heic" || extension == "heif"))
    ) {
        const outputBuffer = await convert({
            buffer: fileObj.buffer,
            format: "JPEG", // output format
            quality: 1, // the jpeg compression quality, between 0 and 1
        });

        file = outputBuffer;
        fileMimeType = "image/jpeg";
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
                quality: 50,
                progressive: true,
            });
            file = await src.toBuffer();
            tempFileName = tempFileName.substr(0, tempFileName.lastIndexOf(".")) + ".jpg";
        } catch (e) {
            //Ignore, The original image file will be saved as it is.
        }
    }

    if (parentDir) {
        await createDirectories(parentDir);
        finalFileName = parentDir + "/" + tempFileName;
    } else {
        finalFileName = tempFileName;
    }
    try {
        await fs.writeFileSync(finalFileName, file);
        return finalFileName;
    } catch (e) {
        if (this.handlesError) {
            //To disable this: Call this method as addFile.call({handlesError:true})
            return {
                error: e,
            };
        } else {
            console.log("File write error:", e);
            return "";
        }
    }
};
// exports.removeFileById = async (parentDir, fileKey) => {
//     let fileName = fileKey.split("/").pop();
//     if (!fileName && !fileName.contains("default")) return false;
//     try {
//         const ext = await fs.existsSync(parentDir + "/" + fileName);
//         if (ext) {
//             await fs.unlinkSync(parentDir + "/" + fileName);
//         }
//         return true;
//     } catch (e) {
//         if (this.handlesError) {
//             //To disable this: Call this method as removeFileById.call({handlesError:true})
//             return {
//                 error: e,
//             };
//         } else {
//             console.log(e);
//             return false;
//         }
//     }
// };
exports.removeFileById = async (parentDir, fileKey) => {
    let fileName = fileKey.split("/").pop();
    if (!fileName || fileName.includes("default")) return false; // Corrected this line
    try {
        const ext = await fs.existsSync(parentDir + "/" + fileName);
        if (ext) {
            await fs.unlinkSync(parentDir + "/" + fileName);
        }
        return true;
    } catch (e) {
        if (this.handlesError) {
            // To disable this: Call this method as removeFileById.call({handlesError:true})
            return {
                error: e,
            };
        } else {
            console.log(e);
            return false;
        }
    }
};
exports.copyFile = async (src, dest) => {
    if (!src || !dest) return false;
    try {
        const ext = await fs.existsSync(src);
        if (ext) {
            await fs.copyFileSync(src, dest);
        }
        return true;
    } catch (e) {
        if (this.handlesError) {
            //To disable this: Call this method as removeFileById.call({handlesError:true})
            return {
                error: e,
            };
        } else {
            console.log(e);
            return false;
        }
    }
};
exports.getFile = (parentDir, fileKey) => {
    return new Promise(async (resolve, reject) => {
        try {
            let stream = await fs.readFileSync(parentDir + "/" + fileKey, "utf8");
            resolve(stream);
        } catch (e) {
            resolve();
        }
    });
};
exports.getUrl = (parentDir, key) => {
    if (key) return this.getBaseURL() + key;
    else return "";
};
exports.getBaseURL = () => {
    return Util.getBaseURL() + "/";
};

async function createDirectories(pathname) {
    const __dirname = path.resolve();
    pathname = pathname.replace(/^\.*\/|\/?[^\/]+\.[a-z]+|\/$/g, ""); // Remove leading directory markers, and remove ending /file-name.extension
    await fs.mkdirSync(
        path.resolve(__dirname, pathname),
        {
            recursive: true,
        },
        (e) => {
            if (e) {
                console.error("Directory created error: ", e);
            }
        }
    );
}

exports.createThumbnailSingle = async (image, folder, fileObj) => {
    let fileType = fileObj.mimetype.split("/").pop();
    if (fileType == "heic" || fileType == "heif") {
        const outputBuffer = await convert({
            buffer: image.buffer, // the HEIC file buffer
            format: "JPEG", // output format
            quality: 1, // the jpeg compression quality, between 0 and 1
        });
        image.buffer = outputBuffer;
        image.mimetype = "image/jpeg";
    }
    const thumbnailBuffer = await imageThumbnail(image.buffer, {
        width: 160,
        height: 90,
        jpegOptions: "jpg",
        percentage: 30,
    });
    let imageObject = {
        originalname: image.originalname,
        buffer: thumbnailBuffer,
        mimetype: image.mimetype,
        size: thumbnailBuffer.length,
    };
    let thumbnailKey = await this.addFile(folder, image.originalname, thumbnailBuffer, true, fileObj);
    return thumbnailKey;
};
