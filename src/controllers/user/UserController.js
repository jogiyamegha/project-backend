const { TableFields, ValidationMsgs } = require("../../utils/constants");
const ValidationError = require("../../utils/ValidationError");
const PaymentService = require('../../db/services/PaymentService');
const BillService = require('../../db/services/BillService');
const UserService = require("../../db/services/UserService");
const { StripeManager } = require("../../utils/stripeManager");
const { addFile, Folders } = require("../../utils/storage");

// Payment Intent Methods for mobile Apps
exports.createPaymentIntent = async (req) => {
    const customerId = req.user[TableFields.ID];
    const { billId, options = {} } = req.body;

    if (!billId) {
        throw new ValidationError('Missing required payment parameters');
    }

    try {
        const result = await PaymentService.createCustomerPaymentIntent(billId, customerId, options);
        await BillService.updateBillStatus(billId, { [TableFields.paymentIntentId]: result.paymentIntent.id });
        return {
            success: true,
            message: 'Payment intent created successfully',
            data: result
        }
    } catch (error) {
        throw new ValidationError(error.message || 'Failed to create payment intent');
    }
}

exports.confirmPaymentIntent = async (req) => {
    const { paymentIntentId, paymentMethodId } = req.body;

    if (!paymentIntentId) {
        throw new ValidationError(ValidationMsgs.PaymentIntentIdEmpty)
    }
    try {
        const result = await PaymentService.confirmPaymentIntent(paymentIntentId, paymentMethodId);
        console.log("result", result);
        return {
            success: result.success,
            message: result.success ? "Payment confirmed successfully" : "Payment requires additional action",
            data: result,
        }
    } catch (error) {
        console.error("Error confirming payment intent:", error);
        throw new ValidationError(error.message || "Failed to confirm payment");
    }
}

exports.updateProfile = async (req) => {
    const userId = req.user[TableFields.ID];
    const reqBody = req.body;
    const profilePicture = req.file || null;

    const user = await UserService.getUserById(userId).withBasicInfo().execute();
    if(!user) {
        throw new ValidationError(ValidationMsgs.RecordNotExists);
    }

    return await parseAndValidateUser(
        reqBody,
        user,
        profilePicture,
        true,
        async (updatedUserProfile) => {
            return await UserService.updateUserRecord(userId, updatedUserProfile)
        }
    )

    // // Safety check to prevent changing sensitive fields via profile update
    // delete updatedFields[TableFields.password];
    // delete updatedFields[TableFields.tokens];
    // delete updatedFields[TableFields.userType];
    // delete updatedFields[TableFields.email]; // Typically email shouldn't be changed here

    // await UserService.updateRecord(userId, updatedFields);
    // return await UserService.getUserById(userId).withBasicInfo().execute();
};

async function parseAndValidateUser(
    reqBody,
    existingUser = {},
    providedFile,
    update = false,
    onValidationCompleted = async (updatedUserFields) => {}
) {

    if (isFieldEmpty(reqBody[TableFields.name_], existingUser?.[TableFields.name_])) {
        throw new ValidationError(ValidationMsgs.NameEmpty);
    } 
    if (isFieldEmpty(reqBody[TableFields.phoneCountry], existingUser?.[TableFields.phoneCountry])) {
        throw new ValidationError(ValidationMsgs.PhoneCountryEmpty);
    } 
    if (isFieldEmpty(reqBody[TableFields.phone], existingUser?.[TableFields.phone])) {
        throw new ValidationError(ValidationMsgs.PhoneEmpty);
    } 
    if (isFieldEmpty(reqBody[TableFields.userType], existingUser?.[TableFields.userType])) {
        throw new ValidationError(ValidationMsgs.UserTypeEmpty);
    }
    if (isFieldEmpty(reqBody[TableFields.address], existingUser?.[TableFields.addressDetail]?.[TableFields.address])) {
        throw new ValidationError(ValidationMsgs.UserAddressEmpty)
    }
    if (isFieldEmpty(reqBody[TableFields.city], existingUser?.[TableFields.addressDetail]?.[TableFields.city])) {
        throw new ValidationError(ValidationMsgs.UserCityEmpty)
    }
    if (isFieldEmpty(reqBody[TableFields.pincode], existingUser?.[TableFields.addressDetail]?.[TableFields.pincode])) {
        throw new ValidationError(ValidationMsgs.UserPincodeEmpty)
    }
   
    const existingImageKey = existingUser[TableFields.profilePicture];
    let persistedImageKey = existingImageKey;

    try {
        if (providedFile) {
            let newImageKey = await addFile(
                Folders.ProfilePicture,
                providedFile.originalname,
                providedFile.buffer,
                true,
                providedFile
            );
            persistedImageKey = newImageKey;
        }

        if (update === true) {
            let updatedFields = {};
            updatedFields = {
                [TableFields.profilePicture]: persistedImageKey ?? existingUser?.[TableFields.profilePicture],
                [TableFields.name_]: reqBody[TableFields.name_] ?? existingUser[TableFields.name_],
                [TableFields.phoneCountry]: reqBody[TableFields.phoneCountry] ?? existingUser[TableFields.phoneCountry],
                [TableFields.phone]: reqBody[TableFields.phone] ?? existingUser[TableFields.phone],
                [TableFields.addressDetail]: {    
                    [TableFields.address]: reqBody[TableFields.address] ?? existingUser[TableFields.addressDetail]?.[TableFields.address],
                    [TableFields.pincode]: reqBody[TableFields.pincode] ?? existingUser[TableFields.addressDetail]?.[TableFields.pincode],
                    [TableFields.city]: reqBody[TableFields.city] ?? existingUser[TableFields.addressDetail]?.[TableFields.city],
                },
            }; 
            return await onValidationCompleted(updatedFields);
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