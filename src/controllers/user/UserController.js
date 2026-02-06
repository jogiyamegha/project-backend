const { TableFields, ValidationMsgs } = require("../../utils/constants");
const ValidationError = require("../../utils/ValidationError");
const PaymentService = require('../../db/services/PaymentService');
const BillService = require('../../db/services/BillService');
const UserService = require("../../db/services/UserService");
const { StripeManager } = require("../../utils/stripeManager");

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
    const updatedFields = req.body;

    // Safety check to prevent changing sensitive fields via profile update
    delete updatedFields[TableFields.password];
    delete updatedFields[TableFields.tokens];
    delete updatedFields[TableFields.userType];
    delete updatedFields[TableFields.email]; // Typically email shouldn't be changed here

    await UserService.updateRecord(userId, updatedFields);
    return await UserService.getUserById(userId).withBasicInfo().execute();
};
