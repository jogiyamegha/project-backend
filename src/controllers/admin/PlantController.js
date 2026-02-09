const PlantService = require("../../db/services/PlantService");
const UserService = require('../../db/services/UserService');
const ServiceManager = require("../../db/serviceManager");
const { TableFields, ValidationMsgs, UserTypes, CounterSchemaType, PropertyTypes, PlantStatus } = require("../../utils/constants");
const ValidationError = require("../../utils/ValidationError");
const Email = require("../../emails/email");
const { Folders } = require("../../utils/metadata");
const { addFile, createThumbnailSingle, removeFileById } = require("../../utils/storage");
const CounterService = require("../../db/services/CounterService");
const Util = require("../../utils/util");
const PpaService = require("../../db/services/PpaService");
const BillService = require("../../db/services/BillService");

exports.addPlant = async (req) => {
    let reqBody = req.body;
    let providedFiles = req.file || null;
    return await parseAndValidatePlant(
        reqBody,
        undefined,
        providedFiles,
        false,
        async (updatedUserFields) => {
            return await PlantService.insertRecord(updatedUserFields);
        }
    );
};

exports.editPlant = async (req) => {
    let reqBody = req.body;
    let providedFile = req.file || null;
    const plantId = req.params[TableFields.ID];

    const plant = await PlantService.getUserById(plantId).withBasicInfo().execute();
    if (!plant) {
        throw new ValidationError(ValidationMsgs.RecordNotExists);
    }

    if (plant && plant[TableFields.deleted]) {
        throw new ValidationError(ValidationMsgs.RecordNotExists);
    }

    let plantObj = null;
    const response = await parseAndValidatePlant(
        reqBody,
        plant,
        providedFile,
        true,
        async (updatedFields) => {
            const record = await PlantService.updateRecord(plantId, updatedFields);
            plantObj = {
                [TableFields.plantUniqueName]: record[TableFields.plantUniqueName],
                [TableFields.propertyName]: record[TableFields.propertyAddress]?.[TableFields.propertyName],
                [TableFields.propertyType]: record[TableFields.propertyAddress]?.[TableFields.propertyType],
                [TableFields.address]: record[TableFields.propertyAddress]?.[TableFields.address],
                [TableFields.city]: record[TableFields.propertyAddress]?.[TableFields.city],
                [TableFields.userId]: record[TableFields.userDetails]?.[TableFields.userId],
                [TableFields.name_]: record[TableFields.userDetails]?.[TableFields.name_],
            }
            PpaService.updatePlantInfo(plantId, plantObj);
            BillService.updatePlantInfo(plantId, plantObj);
            return record;
        }
    )

    return response;
}

exports.listPlants = async (req) => {
    let result = await PlantService.listPlants({
        ...req.query,
    })
        .withBasicInfo()
        .withTimeStamps()
        .execute();
    return result
};

exports.plantInfo = async (req) => {
    const plantId = req.params[TableFields.ID];
    const plant = await PlantService.getUserById(plantId).withBasicInfo().execute();
    if (!plant) {
        throw new ValidationError(ValidationMsgs.RecordNotExists);
    }
    return plant;
}

exports.updatePlantStatus = async (req) => {
    const reqBody = req.body;
    const plantId = req.params[TableFields.ID];
    const reqUser = req.user;

    const plantExists = await PlantService.recordExists(plantId);
    if (!plantExists) {
        throw new ValidationError(ValidationMsgs.RecordNotExists);
    }
    return await PlantService.updatePlantStatus(plantId, reqBody[TableFields.plantStatus], reqUser, reqBody[TableFields.plantUniqueName], reqBody[TableFields.adminNote]);
}

exports.downloadPlantReport = async (req, res) => {
    try {
        let filter = { ...req.query };

        const allPlants = await PlantService.listPlants(filter)
            .withBasicInfo()
            .execute();

        const resultData = [];
        const UserTypeLabel = (type) => {
            switch (type) {
                case UserTypes.Admin:
                    return "Admin";
                case UserTypes.Investor:
                    return "Investor";
                case UserTypes.Consumer:
                    return "Consumer";
                default:
                    return "-";
            }
        };
        const PropertyTypeLabel = (type) => {
            switch (type) {
                case PropertyTypes.HousingSociety:
                    return "Housing Society";
                case PropertyTypes.ManufacturingUnit:
                    return "Manufacturing Unit";
                default:
                    return "-";
            }
        };
        const PlantStatusLabel = (type) => {
            switch (type) {
                case PlantStatus.Submitted:
                    return "Submitted";
                case PlantStatus.Approved:
                    return "Approved";
                case PlantStatus.Rejected:
                    return "Rejected";
                default:
                    return "-";
            }
        };

        for (const plant of allPlants.records) {
            resultData.push({
                "Plant's UniqueId": plant?.[TableFields.plantUniqueId],
                "Plant's Name": plant?.[TableFields.plantUniqueName],
                "User Name": plant?.[TableFields.userDetails]?.[TableFields.name_],
                "User Type": UserTypeLabel(plant?.[TableFields.userDetails]?.[TableFields.userType]),
                "Property Name": plant?.[TableFields.propertyAddress]?.[TableFields.propertyName],
                "Property Type": PropertyTypeLabel(plant?.[TableFields.propertyAddress]?.[TableFields.propertyType]),
                "Property Address": plant?.[TableFields.propertyAddress]?.[TableFields.address],
                "City": plant?.[TableFields.propertyAddress]?.[TableFields.city],
                "Pincode": plant?.[TableFields.propertyAddress]?.[TableFields.pincode],
                "State": plant?.[TableFields.propertyAddress]?.[TableFields.state],
                "RoofArea": plant?.[TableFields.propertyAddress]?.[TableFields.roofArea],
                "Bill Amount": plant?.[TableFields.propertyAddress]?.[TableFields.billAmount],
                "Electricity rate": plant?.[TableFields.propertyAddress]?.[TableFields.electricityRate],
                "Plant Status": PlantStatusLabel(plant?.[TableFields.plantStatus]),
            })
        } const columns = [
            { width: 25 },
            { width: 10 },
            { width: 20 },
            { width: 20 },
            { width: 15 },
            { width: 30 },
            { width: 15 },
            { width: 10 },
            { width: 10 },
            { width: 10 },
            { width: 25 },
            { width: 15 },
            { width: 15 },
        ];

        const sheetName = "Plant Report";
        const fileName = `plant_report_${new Date()
            .toISOString()
            .split("T")[0]}.xlsx`;

        Util.exportToExcel(res, resultData, columns, sheetName, fileName);
        console.log("shduhdudh");


        return;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

exports.deletePlant = async (req) => {
    const plantId = req.params[TableFields.ID];
    const plant = await PlantService.getUserById(plantId).withBasicInfo().execute();
    if (!plant || plant[TableFields.deleted] == true) {
        throw new ValidationError(ValidationMsgs.RecordNotExists);
    }
    await PlantService.updateDelete(plantId);
    await PpaService.updatePlantDeleted(plantId);
}

async function parseAndValidatePlant(
    reqBody,
    existingPlant = {},
    providedFile,
    update = false,
    onValidationCompleted = async (updatedUserFields) => { }
) {
    const plantUniqueId = await CounterService.consumeSingleKey(CounterSchemaType.Plant);

    if (isFieldEmpty(reqBody[TableFields.userId], existingPlant?.[TableFields.userDetails]?.[TableFields.userId])) {
        throw new ValidationError(ValidationMsgs.UserIdEmpty);
    }
    if (isFieldEmpty(reqBody[TableFields.propertyType], existingPlant?.[TableFields.propertyAddress]?.[TableFields.propertyType])) {
        throw new ValidationError(ValidationMsgs.PropertyTypeEmpty);
    }
    if (isFieldEmpty(reqBody[TableFields.address], existingPlant?.[TableFields.propertyAddress]?.[TableFields.address])) {
        throw new ValidationError(ValidationMsgs.AddressEmpty);
    }
    if (isFieldEmpty(reqBody[TableFields.state], existingPlant?.[TableFields.propertyAddress]?.[TableFields.state])) {
        throw new ValidationError(ValidationMsgs.StateEmpty);
    }
    if (isFieldEmpty(reqBody[TableFields.city], existingPlant?.[TableFields.propertyAddress]?.[TableFields.city])) {
        throw new ValidationError(ValidationMsgs.CityEmpty);
    }
    if (isFieldEmpty(reqBody[TableFields.pincode], existingPlant?.[TableFields.propertyAddress]?.[TableFields.pincode])) {
        throw new ValidationError(ValidationMsgs.PincodeEmpty);
    }
    if (isFieldEmpty(reqBody[TableFields.billAmount], existingPlant?.[TableFields.propertyAddress]?.[TableFields.billAmount])) {
        throw new ValidationError(ValidationMsgs.BillAmountEmpty);
    }

    const userInfo = await UserService.getUserById(reqBody[TableFields.userId]).withBasicInfo().execute();

    const existingImageKey = existingPlant[`${TableFields.propertyAddress}.${TableFields.billImage}`];
    let persistedImageKey = existingImageKey;
    console.log("shdushd", existingImageKey);
    console.log("bdsjhdusdhudh", persistedImageKey);
    console.log(providedFile);

    try {
        if (providedFile) {
            let newImageKey = await addFile(
                Folders.BillImage,
                providedFile.originalname,
                providedFile.buffer,
                true,
                providedFile
            );
            console.log(newImageKey);
            persistedImageKey = newImageKey;
        }

        if (update === true) {
            let updatedFields = {};
            if (reqBody[TableFields.userId]) {
                const newUserInfo = await UserService.getUserById(reqBody[TableFields.userId]).withBasicInfo().execute();

                if (newUserInfo == null) {
                    throw new ValidationError(ValidationMsgs.RecordNotExists);
                }

                updatedFields[TableFields.userDetails] = {
                    [TableFields.userId]: reqBody[TableFields.userId],
                    [TableFields.name_]: newUserInfo[TableFields.name_],
                    [TableFields.userType]: newUserInfo[TableFields.userType]
                }
            }

            updatedFields = {
                ...updatedFields,
                [TableFields.plantUniqueName]: reqBody[TableFields.plantUniqueName] ?? existingPlant[TableFields.plantUniqueName],
                [TableFields.propertyAddress]: {
                    [TableFields.propertyName]: reqBody[TableFields.propertyName] ?? existingPlant[TableFields.propertyAddress]?.[TableFields.propertyName],
                    [TableFields.propertyType]: reqBody[TableFields.propertyType] ?? existingPlant[TableFields.propertyAddress]?.[TableFields.propertyType],
                    [TableFields.address]: reqBody[TableFields.address] ?? existingPlant[TableFields.propertyAddress]?.[TableFields.address],
                    [TableFields.city]: reqBody[TableFields.city] ?? existingPlant[TableFields.propertyAddress]?.[TableFields.city],
                    [TableFields.state]: reqBody[TableFields.state] ?? existingPlant[TableFields.propertyAddress]?.[TableFields.state],
                    [TableFields.pincode]: reqBody[TableFields.pincode] ?? existingPlant[TableFields.propertyAddress]?.[TableFields.pincode],
                    [TableFields.roofArea]: reqBody[TableFields.roofArea] ?? existingPlant[TableFields.propertyAddress]?.[TableFields.roofArea],
                    [TableFields.billAmount]: reqBody[TableFields.billAmount] ?? existingPlant[TableFields.propertyAddress]?.[TableFields.billAmount],
                    [TableFields.billImage]: persistedImageKey ?? reqBody[TableFields.billImage] ?? existingPlant[TableFields.propertyAddress]?.[TableFields.billImage],
                    [TableFields.electricityRate]: reqBody[TableFields.electricityRate] ?? existingPlant[TableFields.propertyAddress]?.[TableFields.electricityRate],
                },
                // [TableFields.plantStatus]:  reqBody[TableFields.plantStatus] ?? existingPlant[TableFields.plantStatus],
            };
            return await onValidationCompleted(updatedFields);
        } else {
            let response = await onValidationCompleted({
                [TableFields.plantUniqueId]: plantUniqueId,
                [`${TableFields.userDetails}.${TableFields.userId}`]: userInfo[TableFields.ID],
                [`${TableFields.userDetails}.${TableFields.userType}`]: userInfo[TableFields.userType],
                [`${TableFields.userDetails}.${TableFields.name_}`]: userInfo[TableFields.name_],
                [`${TableFields.userDetails}.${TableFields.deleted}`]: userInfo[TableFields.deleted],
                [`${TableFields.propertyAddress}.${TableFields.propertyName}`]: reqBody[TableFields.propertyName] || null,
                [`${TableFields.propertyAddress}.${TableFields.propertyType}`]: reqBody[TableFields.propertyType],
                [`${TableFields.propertyAddress}.${TableFields.address}`]: reqBody[TableFields.address],
                [`${TableFields.propertyAddress}.${TableFields.city}`]: reqBody[TableFields.city],
                [`${TableFields.propertyAddress}.${TableFields.state}`]: reqBody[TableFields.state],
                [`${TableFields.propertyAddress}.${TableFields.pincode}`]: reqBody[TableFields.pincode],
                [`${TableFields.propertyAddress}.${TableFields.roofArea}`]: reqBody[TableFields.roofArea],
                [`${TableFields.propertyAddress}.${TableFields.billAmount}`]: reqBody[TableFields.billAmount],
                [`${TableFields.propertyAddress}.${TableFields.billImage}`]: persistedImageKey,
                [`${TableFields.propertyAddress}.${TableFields.electricityRate}`]: reqBody[TableFields.electricityRate] || 0,
            });

            return response;
        }
    } catch (error) {
        throw error;
    }
}

function isFieldEmpty(providedField, existingField) {
    if (providedField != undefined) {
        if (providedField) {
            return false;
        }
    } else if (existingField) {
        return false;
    }
    return true;
}

async function getUserDashboard(userId, token) {
    return {
        user: await CollegeService.getUserById(userId).withBasicInfo().execute(),
        token: token || undefined,
    };
}
