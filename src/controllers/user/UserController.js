const { TableFields, ValidationMsgs } = require("../../utils/constants");
const ValidationError = require("../../utils/ValidationError");
const PaymentService = require('../../db/services/PaymentService');
const BillService = require('../../db/services/BillService');
const UserService = require("../../db/services/UserService");
const { StripeManager } = require("../../utils/stripeManager");

// Payment Intent Methods for mobile Apps
exports.createPaymentIntent = async (req) => {
    const consumerId = req.user[TableFields.ID];
    const { billId, options = {}} = req.body;

    if (!billId) {
        throw new ValidationError('Missing required payment parameters');
    }

    try {
        const result = await PaymentService.createConsumerPaymentIntent(billId, consumerId, options);
        console.log("result",result);
        await BillService.updateBillStatus(billId, { [TableFields.paymentIntentId]: result.paymentIntent.id} );
        return {
            success: true,
            message: 'Payment intent created successfully',
            data: result
        }
    } catch (error) {
        throw new ValidationError(error.message || 'Failed to create payment intent');
    }
}

exports.paymentInitiate = async (req) => {
    const reqUser = req.user;
    const userId = reqUser[TableFields.ID];

    const user = await UserService.getUserById(userId).withBasicInfo().execute();

    const stripeConsumer = await StripeManager.createConsumer(
        user[TableFields.name_],
        user[TableFields.email],
        user[TableFields.phone],
        user[TableFields.phoneCountry],
    )
    console.log("stripeConsumer",stripeConsumer);

    await UserService.updateRecord(user[TableFields.ID], {
        [TableFields.stripeAccountId] : stripeConsumer.id
    })
}