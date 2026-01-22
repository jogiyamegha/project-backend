const Payment = require("../models/payment");
const {StripeManager} = require("../../utils/stripeManager");
const {TableFields, PaymentStatusTypes, PaymentTypes, ValidationMsgs} = require("../../utils/constants");
const ValidationError = require("../../utils/ValidationError");
const Util = require("../../utils/util");
const {User} = require("../models/user");
const Payout = require("../models/payout");
const BillService = require("./BillService");
const UserService = require("./UserService");

class PaymentService {
    // Create a new payment record
    static async createPayment(paymentData) {
        const payment = new Payment(paymentData);
        return await payment.save();
    }

    static async updatePaymentStatus(paymentId, status, additionalData = {}) {
        const updateData = {
            [TableFields.paymentStatus]: status,
            [TableFields._updatedAt]: new Date(),
            ...additionalData,
        };

        return await Payment.findByIdAndUpdate(paymentId, updateData, {new: true});
    }

    // Create customer payment intent for mobile apps
   
    static async createCustomerPaymentIntent(billId, customerId, options = {}) {
        try {
            // Get customer for Stripe customer ID
            const customer = await UserService.getUserById(customerId).withBasicInfo().execute();
            if (!customer || !customer[TableFields.stripeCustomerId]) {
                throw new ValidationError(ValidationMsgs.ConsumerStripeAccountEmpty);
            }

            let billData = await BillService.getUserById(billId).withBasicInfo().execute();
            if (!billData) {
                throw new ValidationError(ValidationMsgs.RecordNotFound);
            }
            let netAmount = billData[TableFields.totalAmount];
            
            // Create payment record
            const paymentData = {
                [TableFields.userReference]: customer,
                [TableFields.billReference]: billId,
                [TableFields.paymentType]: PaymentTypes.ConsumerPayment,
                [TableFields.amount]: netAmount,
                [TableFields.paymentStatus]: PaymentStatusTypes.Pending,
                [TableFields.stripeCustomerId]: customer[TableFields.stripeCustomerId],
                [TableFields.metadata]: {
                    billId: billId,
                },
            };

            const payment = await this.createPayment(paymentData);
            console.log("🚀 ~ PaymentService ~ createCustomerPaymentIntent ~ payment:", payment);
            // Create Stripe payment intent
            const paymentIntent = await StripeManager.createBookingPaymentIntent(
                customer[TableFields.stripeCustomerId],
                netAmount,
                { paymentId: payment._id.toString(), billReference: billId, userReference: customerId.toString() },
                options,
                billId
            );
            console.log("🚀 ~ PaymentService ~ createCustomerPaymentIntent ~ paymentIntent:", paymentIntent);

            //Update payment with payment intent ID
            await this.updatePaymentStatus(payment._id, PaymentStatusTypes.Pending, {
                [TableFields.stripePaymentIntentId]: paymentIntent.id,
            });
            // await Delivery.findByIdAndUpdate(deliveryId, {
            //     $set: {
            //         [`${TableFields.fareDetails}.${TableFields.paymentIntentId}`]: paymentIntent.id,
            //     },
            // });

            return {
                payment,
                paymentIntent: {
                    id: paymentIntent.id,
                    clientSecret: paymentIntent.client_secret,
                    status: paymentIntent.status,
                    amount: paymentIntent.amount,
                    currency: paymentIntent.currency,
                },
                // Include publishable key for mobile SDK
                publishableKey: StripeManager.getPublishKey(),
            };
        } catch (error) {
            console.error("Error creating payment intent:", error);
            throw new ValidationError(error.message || ValidationMsgs.PaymentFailed);
        }
    }

    static confirmPaymentIntent = async (paymentIntentId, paymentMethodId = null) => {
        try {
            const paymentIntent = await StripeManager.confirmPaymentIntent(paymentIntentId);
            console.log(paymentIntent);
            
            // If successful, process the payment
            // if (paymentIntent.status === "succeeded") {
            //     return await this.processPaymentIntentSuccess(paymentIntentId);
            // }
            return {
                paymentIntent: {
                    id: paymentIntent.id,
                    status: paymentIntent.status,
                    nextAction: paymentIntent.next_action,
                },
                requiresAction: paymentIntent.status === 'requires_action',
            }
        } catch (error) {
            console.error("Error confirming payment intent:", error);
            throw new ValidationError(error.message || "Failed to confirm payment");
        }
    }

    static getPaymentTransactionList(filter = {}) {
        return new ProjectionBuilders(async function () {
            let limit = filter.limit || 0;
            let skip = filter.skip || 0;
            let sortKey = filter.sortKey || TableFields._createdAt;
            let sortOrder = filter.sortOrder || -1;
            let needCount = Util.parseBoolean(filter.needCount);
            let searchTerm = filter.searchTerm;
            let searchQuery = {};

            if (searchTerm) {
                const searchConditions = [
                    {
                        [`${TableFields.host}.${TableFields.name_}`]: {
                            $regex: Util.wrapWithRegexQry(searchTerm),
                            $options: "i",
                        },
                    },
                ];

                // Add combined name search for full name queries
                const searchWords = searchTerm.trim().split(/\s+/);
                if (searchWords.length > 1) {
                    const escapedWords = searchWords.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
                    const combinedNamePattern = escapedWords.join("\\s+");

                    searchConditions.push({
                        $expr: {
                            $regexMatch: {
                                input: {
                                    $concat: [
                                        {
                                            $ifNull: [`$${TableFields.driver}.${TableFields.firstName}`, ""],
                                        },
                                        " ",
                                        {
                                            $ifNull: [`$${TableFields.driver}.${TableFields.lastName}`, ""],
                                        },
                                    ],
                                },
                                regex: combinedNamePattern,
                                options: "i",
                            },
                        },
                    });

                    // Also add reverse order (last name first)
                    searchConditions.push({
                        $expr: {
                            $regexMatch: {
                                input: {
                                    $concat: [
                                        {
                                            $ifNull: [`$${TableFields.driver}.${TableFields.lastName}`, ""],
                                        },
                                        " ",
                                        {
                                            $ifNull: [`$${TableFields.driver}.${TableFields.firstName}`, ""],
                                        },
                                    ],
                                },
                                regex: combinedNamePattern,
                                options: "i",
                            },
                        },
                    });
                }

                searchQuery = {
                    $or: searchConditions,
                };
            }

            if (filter.startDate) {
                const startDate = new Date(filter.startDate);
                startDate.setHours(0, 0, 0, 0);
                searchQuery[TableFields._createdAt] = {
                    ...searchQuery[TableFields._createdAt],
                    $gte: startDate,
                };
            }

            if (filter.payoutStatus) {
                searchQuery = {
                    ...searchQuery,
                    [TableFields.payoutStatus]: filter.payoutStatus,
                };
            }
            if (filter.endDate) {
                const endDate = new Date(filter.endDate);
                endDate.setHours(23, 59, 59, 999);
                searchQuery[TableFields._createdAt] = {
                    ...searchQuery[TableFields._createdAt],
                    $lte: endDate,
                };
            }

            let populateFields = this.populate;
            let projectionFields = {
                ...this,
            };
            delete projectionFields.populate;
            return await Promise.all([
                needCount ? Payout.countDocuments(searchQuery) : undefined,
                Payout.find(searchQuery, projectionFields)
                .limit(parseInt(limit))
                .skip(parseInt(skip))
                .sort({[sortKey]: parseInt(sortOrder)})
                .populate(populateFields),
            ]).then(([total, records]) => {
                return {total, records};
            });
        });
    }

    // Confirm payment intent from mobile app
    static async confirmPaymentIntent(paymentIntentId, paymentMethodId = null) {
        try {
            // Confirm the payment intent
            const paymentIntent = await StripeManager.confirmPaymentIntent(paymentIntentId);

            // If successful, process the payment
            // if (paymentIntent.status === "succeeded") {
            //     return await this.processPaymentIntentSuccess(paymentIntentId);
            // }

            return {
                // success: false,
                paymentIntent: {
                    id: paymentIntent.id,
                    status: paymentIntent.status,
                    nextAction: paymentIntent.next_action,
                },
                requiresAction: paymentIntent.status === "requires_action",
            };
        } catch (error) {
            console.error("Error confirming payment intent:", error);
            throw new ValidationError(error.message || "Failed to confirm payment");
        }
    }

    // Process driver payout from payment object (for automatic processing)
    static async processDriverPayoutFromPayment(payment) {
        try {
            // Default commission settings (you can make these configurable)
            const defaultCommissionType = CommissionTypes.Percentage;
            const defaultCommissionValue = 10; // 10% commission

            return await this.processDriverPayout(
                payment[TableFields.deliveryReference],
                payment._id,
                payment[TableFields.driverReference],
                null, // No admin ID for automatic processing
                defaultCommissionType,
                defaultCommissionValue
            );
        } catch (error) {
            console.error("Error processing driver payout from payment:", error);
            throw new ValidationError(error.message || "Failed to process driver payout");
        }
    }

    // Process payment success (called by webhook)
    static async processPaymentSuccess(sessionId) {
        try {
            // Get checkout session from Stripe
            const session = await StripeManager.getCheckoutSession(sessionId);

            // Find payment by session ID
            const payment = await Payment.findOne({
                [TableFields.checkoutSessionId]: sessionId,
            });

            if (!payment) {
                throw new ValidationError("Payment not found for session");
            }

            // Update payment status and details
            const updateData = {
                [TableFields.paymentStatus]: PaymentStatusTypes.Completed,
                [TableFields.stripePaymentIntentId]: session.payment_intent,
                [TableFields.paymentDate]: new Date(),
                [TableFields.paymentMethod]: session.payment_method_types?.[0] || "card",
            };

            const updatedPayment = await this.updatePaymentStatus(
                payment._id,
                PaymentStatusTypes.Completed,
                updateData
            );

            // Add to driver's pending earnings
            await this.addToDriverPendingEarnings(payment[TableFields.driverReference], payment[TableFields.amount]);

            // Update delivery payment received flag
            await this.updateDeliveryPaymentReceived(payment[TableFields.deliveryReference]);

            return updatedPayment;
        } catch (error) {
            throw new ValidationError(error.message || ValidationMsgs.PaymentFailed);
        }
    }

    static updateHostBankdetailStatus = async (accountId) => {
        let host = await Host.findOne({[TableFields.stripeAccountId]: accountId});
        const stripeInstance = StripeManager.stripeTest;

        if (host) {
            const account = await stripeInstance.accounts.retrieve(accountId);
            const canReceivePayouts = account.details_submitted && account.charges_enabled && account.payouts_enabled;

            await host.updateOne({[TableFields.fillBankDetails]: canReceivePayouts});
            //active host charger and parking hub
            await ChargingStation.updateMany(
                {[`${TableFields.host}.${TableFields.reference}`]: host[TableFields.ID]},
                {
                    $set: {
                        [TableFields.isActiveByAdmin]: true,
                    },
                }
            );
            await ParkingSpace.updateMany(
                {[`${TableFields.host}.${TableFields.reference}`]: host[TableFields.ID]},
                {
                    $set: {
                        [TableFields.isActiveByAdmin]: true,
                    },
                }
            );
        }
    };

    // Add amount to driver's pending earnings - UPDATED FOR DIRECT PAYOUTS
    static async addToDriverPendingEarnings(driverId, amount) {
        await Driver.findByIdAndUpdate(driverId, {
            $inc: {
                [`${TableFields.earnings}.${TableFields.pendingEarnings}`]: amount,
            },
            [TableFields._updatedAt]: new Date(),
        });
    }

    // Update delivery payment received flag
    static async updateDeliveryPaymentReceived(deliveryId) {
        const Delivery = require("../models/delivery");
        await Delivery.findByIdAndUpdate(deliveryId, {
            [`${TableFields.fareDetails}.${TableFields.paymentReceived}`]: true,
            [TableFields._updatedAt]: new Date(),
        });
    }

    // Create payout record
    static async createPayout(payoutData) {
        const payout = new Payout(payoutData);
        return await payout.save();
    }

    // Get payout by ID
    static async getPayoutById(payoutId, projection = null) {
        // const projectionBuilder = new ProjectionBuilder();
        // if (projection) projectionBuilder.addFields(projection);

        return await Payout.findById(payoutId)
        // .select(projectionBuilder.build())
        .populate("deliveryReference")
        .populate("paymentReference")
        .populate("driverReference")
        .populate("processedBy");
    }

    // Get payouts by driver
    static async getPayoutsByDriver(driverId, projection = null) {
        // const projectionBuilder = new ProjectionBuilder();
        // if (projection) projectionBuilder.addFields(projection);

        return await Payout.find({[TableFields.driverReference]: driverId})
        // .select(projectionBuilder.build())
        .populate("deliveryReference")
        .populate("paymentReference")
        .sort({[TableFields._createdAt]: -1});
    }

    // Get payouts by delivery
    static async getPayoutsByDelivery(deliveryId, projection = null) {
        // const projectionBuilder = new ProjectionBuilder();
        // if (projection) projectionBuilder.addFields(projection);

        return await Payout.find({[TableFields.deliveryReference]: deliveryId})
        // .select(projectionBuilder.build())
        .populate("paymentReference")
        .populate("driverReference")
        .populate("processedBy")
        .sort({[TableFields._createdAt]: -1});
    }

    // Update payout status
    static async updatePayoutStatus(payoutId, status, additionalData = {}) {
        const updateData = {
            [TableFields.payoutStatus]: status,
            [TableFields._updatedAt]: new Date(),
            ...additionalData,
        };

        return await Payout.findByIdAndUpdate(payoutId, updateData, {new: true});
    }

    // Process driver payout (admin action) - UPDATED FOR DIRECT PAYOUTS
    static async processDriverPayout(
        deliveryId,
        paymentId,
        driverId,
        adminId,
        commissionType = CommissionTypes.Percentage,
        commissionValue = 10
    ) {
        try {
            // Get payment details
            const payment = await Payment.findById(paymentId);
            if (!payment) {
                throw new ValidationError("Payment not found");
            }

            // Calculate commission and net amount
            const grossAmount = payment[TableFields.amount];
            const commissionAmount = StripeManager.calculateCommission(grossAmount, commissionType, commissionValue);
            const netAmount = StripeManager.calculateNetAmount(grossAmount, commissionAmount);

            // COMMENTED: Connected Account Flow
            // const driver = await Driver.findById(driverId);
            // if (!driver || !driver[TableFields.stripeAccountId]) {
            //     throw new ValidationError("Driver Stripe account not found");
            // }

            // NEW: Direct Payout Flow
            return await DirectPayoutService.processDirectPayout(paymentId, driverId, netAmount, adminId);
        } catch (error) {
            throw new ValidationError(error.message || ValidationMsgs.PayoutFailed);
        }
    }

    // Update driver earnings after successful payout
    static async updateDriverEarningsAfterPayout(driverId, payoutAmount, deliveryId) {
        const driver = await Driver.findById(driverId);
        if (!driver) {
            throw new ValidationError(ValidationMsgs.DriverNotFound);
        }

        const currentPending = driver[TableFields.earnings]?.[TableFields.pendingEarnings] || 0;
        const newPending = Math.max(0, currentPending - payoutAmount);

        // Add to payout history
        const payoutHistoryEntry = {
            [TableFields.deliveryReference]: deliveryId,
            [TableFields.amount]: payoutAmount,
            [TableFields.payoutDate]: new Date(),
            [TableFields.status]: PayoutStatusTypes.Completed,
        };

        await Driver.findByIdAndUpdate(driverId, {
            [`${TableFields.earnings}.${TableFields.pendingEarnings}`]: newPending,
            $inc: {
                [`${TableFields.earnings}.${TableFields.totalEarnings}`]: payoutAmount,
            },
            $push: {
                [`${TableFields.earnings}.${TableFields.payoutHistory}`]: payoutHistoryEntry,
            },
        });
    }

    // Get driver earnings
    static async getDriverEarnings(driverId) {
        const driver = await Driver.findById(driverId).select(
            `${TableFields.earnings} ${TableFields.firstName} ${TableFields.lastName}`
        );

        if (!driver) {
            throw new ValidationError(ValidationMsgs.DriverNotFound);
        }

        return (
            driver[TableFields.earnings] || {
                [TableFields.pendingEarnings]: 0,
                [TableFields.totalEarnings]: 0,
                [TableFields.payoutHistory]: [],
            }
        );
    }

    // COMMENTED: Connected Account Flow - Replaced with Direct Payouts
    // static async createDriverStripeAccount(driverId) {
    //     const driver = await Driver.findById(driverId);
    //     if (!driver) {
    //         throw new ValidationError("Driver not found");
    //     }

    //     if (driver[TableFields.stripeAccountId]) {
    //         return { id: driver[TableFields.stripeAccountId] };
    //     }

    //     const driverData = {
    //         firstName: driver[TableFields.firstName],
    //         lastName: driver[TableFields.lastName],
    //         email: driver[TableFields.email],
    //         phone: driver[TableFields.phone],
    //     };

    //     const account = await StripeManager.createConnectedAccount(driverData);

    //     await Driver.findByIdAndUpdate(driverId, {
    //         [TableFields.stripeAccountId]: account.id,
    //     });

    //     return account;
    // }

    // COMMENTED: Connected Account Flow - Replaced with Direct Payouts
    // static async createDriverAccountLink(driverId, refreshUrl, returnUrl) {
    //     const driver = await Driver.findById(driverId);
    //     if (!driver || !driver[TableFields.stripeAccountId]) {
    //         throw new ValidationError("Driver Stripe account not found");
    //         }

    //     const accountLink = await StripeManager.createAccountLink(
    //         driver[TableFields.stripeAccountId],
    //         refreshUrl,
    //         returnUrl,
    //     );

    //     return accountLink;
    // }

    // Get payment history for delivery
    static async getPaymentHistory(deliveryId) {
        const payments = await this.getPaymentsByDelivery(deliveryId);
        const payouts = await this.getPayoutsByDelivery(deliveryId);

        return {
            payments,
            payouts,
        };
    }

    // Get payment by Stripe payment intent ID
    static async getPaymentByStripePaymentIntentId(paymentIntentId) {
        return await Payment.findOne({
            [TableFields.stripePaymentIntentId]: paymentIntentId,
        });
    }

    // Get payout by Stripe transfer ID
    static async getPayoutByStripeTransferId(transferId) {
        return await Payout.findOne({
            [TableFields.stripePayoutId]: transferId,
        });
    }

    // Get payouts by status with pagination
    static async getPayoutsByStatus(status, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        return await Payout.find({[TableFields.payoutStatus]: status})
        .populate("deliveryReference")
        .populate("driverReference")
        .populate("processedBy")
        .sort({[TableFields._createdAt]: -1})
        .skip(skip)
        .limit(limit);
    }

    // Get all payments with filters
    static async getAllPayments(status = null, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const filter = status ? {[TableFields.paymentStatus]: status} : {};

        return await Payment.find(filter)
        .populate("deliveryReference")
        .populate("customerReference")
        .populate("driverReference")
        .sort({[TableFields._createdAt]: -1})
        .skip(skip)
        .limit(limit);
    }

    // Get all payouts with filters
    static async getAllPayouts(status = null, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const filter = status ? {[TableFields.payoutStatus]: status} : {};

        return await Payout.find(filter)
        .populate("deliveryReference")
        .populate("driverReference")
        .populate("processedBy")
        .sort({[TableFields._createdAt]: -1})
        .skip(skip)
        .limit(limit);
    }

    // Get payment statistics
    static async getPaymentStatistics(startDate = null, endDate = null) {
        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);

        const filter = Object.keys(dateFilter).length > 0 ? {[TableFields._createdAt]: dateFilter} : {};

        const [paymentStats, payoutStats] = await Promise.all([
            Payment.aggregate([
                {$match: filter},
                {
                    $group: {
                        _id: "$paymentStatus",
                        totalAmount: {$sum: "$amount"},
                        count: {$sum: 1},
                    },
                },
            ]),
            Payout.aggregate([
                {$match: filter},
                {
                    $group: {
                        _id: "$payoutStatus",
                        totalAmount: {$sum: "$netAmount"},
                        totalCommission: {$sum: "$commissionAmount"},
                        count: {$sum: 1},
                    },
                },
            ]),
        ]);

        return {
            payments: paymentStats,
            payouts: payoutStats,
        };
    }

    // Refund payment
    static async refundPayment(paymentId, reason) {
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            throw new ValidationError("Payment not found");
        }

        if (!payment[TableFields.stripePaymentIntentId]) {
            throw new ValidationError("No Stripe payment intent found");
        }

        // Create refund in Stripe
        const refund = await StripeManager.createRefund(
            payment[TableFields.stripePaymentIntentId],
            null, // null means full refund
            reason
        );

        // Update payment status
        await this.updatePaymentStatus(paymentId, PaymentStatusTypes.Refunded, {
            [TableFields.refundReason]: reason,
        });

        return refund;
    }
}

const ProjectionBuilders = class {
    constructor(methodToExecute) {
        const projection = {};
        this.withBasicInfo = () => {
            projection[TableFields.ID] = 1;
            projection[TableFields.deliveryReference] = 1;
            projection[TableFields.grossAmount] = 1;
            projection[TableFields.currency] = 1;
            projection[TableFields.payoutStatus] = 1;
            projection[TableFields.payoutDate] = 1;
            projection[TableFields.driver] = 1;
            projection[TableFields.deliveryId] = 1;
            projection[TableFields.netAmount] = 1;
            projection[TableFields.spotLightPrice] = 1;
            projection[TableFields.insuranceCommission] = 1;
            projection[TableFields.commissionAmount] = 1;

            return this;
        };
        this.withTimeStamps = () => {
            projection[TableFields._createdAt] = 1;
            projection[TableFields._updatedAt] = 1;
            return this;
        };
        this.withPayout = () => {
            projection[TableFields.bookingReference] = 1;
            projection[TableFields.stripeTransferId] = 1;
            projection[TableFields.stripePaymentIntentId] = 1;
            projection[TableFields.hostAmount] = 1;
            projection[TableFields.currency] = 1;
            projection[TableFields.payoutStatus] = 1;
            projection[TableFields.payoutDate] = 1;
            projection[TableFields.host] = 1;
            projection[TableFields.bookingId] = 1;
            return this;
        };
        this.execute = async () => {
            return await methodToExecute.call(projection);
        };
    }
};

module.exports = PaymentService;
