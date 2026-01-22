const {TableFields} = require("./constants");
const Util = require("./util");
// const stripe = require("stripe")(process.env.STRIPE_SEC_KEY);
const stripeTest = require("stripe")(process.env.STRIPE_SEC_KEY_TEST);

class StripeManager {
    static get stripe() {
        return stripeTest;
    }

    static get stripeTest() {
        return stripeTest;
    }

    static async getStripeMethod(methodId) {
        return await this.stripe.paymentMethods.retrieve(methodId);
    }

    static async getBussinessAccountBalance() {
        const balance = await stripeTest.balance.retrieve();
        const available = balance.available.map((entry) => {
            return {
                currency: entry.currency,
                amount: entry.amount / 100, // convert cents to normal value
                sourceTypes: entry.source_types,
            };
        });

        const pending = balance.pending.map((entry) => {
            return {
                currency: entry.currency,
                amount: entry.amount / 100,
                sourceTypes: entry.source_types,
            };
        });

        return {
            available,
            pending,
        };
    }
    static listReversals = async (transferId) => {
        return await stripeTest.transfers.listReversals(transferId);
    };

    static getBalance = async () => {
        return await stripeTest.balance.retrieve();
    };

    static createCheckoutSession = async (customerId, priceId, subscriptionDays) => {
        let sessionData = {
            customer: customerId,
            payment_method_types: ["card"],
            mode: "subscription",
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            allow_promotion_codes: true,
            success_url: `${process.env.HOST_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.HOST_URL}/subscription`,
        };

        if (subscriptionDays) {
            sessionData.subscription_data = {
                trial_period_days: subscriptionDays,
            };
        }

        return await stripeTest.checkout.sessions.create(sessionData);
    };

    static getConnectBankAccountDetails = async (connectAccountId) => {
        return await stripeTest.accounts.listExternalAccounts(connectAccountId, {
            object: "bank_account",
        });
    };

    static createDeliveryPaymentSession = async (customerId, amount, deliveryId, offerId, metadata = {}) => {
        const sessionData = {
            customer: customerId,
            payment_method_types: ["card"],
            mode: "payment",
            line_items: [
                {
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: "Delivery Service",
                            description: `Delivery payment for order #${deliveryId}`,
                        },
                        unit_amount: Math.round(amount * 100),
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.HOST_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&delivery_id=${deliveryId}`,
            cancel_url: `${process.env.HOST_URL}/payment/cancel?delivery_id=${deliveryId}`,
            metadata: {
                deliveryId,
                offerId,
                ...metadata,
            },
        };
        console.log("🚀 ~ StripeManager ~ sessionData:", sessionData);

        return await stripeTest.checkout.sessions.create(sessionData);
    };

    // Create payment intent for mobile apps
    static createBookingPaymentIntent = async (customerId, amount, metadata = {}, options = {}, bookingId) => {
        const {
            currency = "inr",
            paymentMethodTypes = ["card"],
            captureMethod = "automatic",
            confirmationMethod = "automatic",
        } = options;

        const paymentIntentData = {
            customer: customerId,
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency,
            payment_method_types: paymentMethodTypes,
            capture_method: captureMethod,
            confirmation_method: confirmationMethod,
            description: `Booking payment for  #${bookingId}`,
            metadata: {
                ...metadata,
            },
        };

        console.log("🚀 ~ StripeManager ~ createDeliveryPaymentIntent ~ paymentIntentData:", paymentIntentData);

        return await stripeTest.paymentIntents.create(paymentIntentData);
    };

    // Confirm payment intent (for manual confirmation)
    static confirmPaymentIntent = async (paymentIntentId, paymentMethodId = null) => {
        const confirmData = {};
        console.log("confirmData",confirmData);
        console.log("paymentMethodId",paymentMethodId);

        if (paymentMethodId) {
            confirmData.payment_method = paymentMethodId;
        }
        //      The below code is only for testing purpouse of intent
        return await stripeTest.paymentIntents.confirm(paymentIntentId, {
            payment_method_data: {
                type: "card",
                card: {
                    token: "tok_visa",
                },
            },
        });

        // return;

        // return await stripeTest.paymentIntents.confirm(paymentIntentId); //"error": "You cannot confirm this PaymentIntent because it's missing a payment method. To confirm the PaymentIntent with cus_Tpz6Qq139auoXz, specify a payment method attached to this customer along with the customer ID."
    }; 

    // Update payment intent
    static updatePaymentIntent = async (paymentIntentId, updateData) => {
        return await stripeTest.paymentIntents.update(paymentIntentId, updateData);
    };

    // Cancel payment intent
    static cancelPaymentIntent = async (paymentIntentId, cancellationReason = "requested_by_customer") => {
        return await stripeTest.paymentIntents.cancel(paymentIntentId, {
            cancellation_reason: cancellationReason,
        });
    };

    // Create customer for payment processing
    static createCustomer = async (name, email, phone = null, phoneCountry = null) => {
        const customerData = {
            name: name,
            email: email,
        };

        if (phone && phoneCountry) {
            const phoneE164 = formatPhoneE164(phoneCountry, phone);

            customerData.phone = phoneE164;
        }

        return await stripeTest.customers.create(customerData);
    };

    // Create connected account for driver payouts
    static createConnectedAccount = async (userData) => {
        const phoneE164 = formatPhoneE164(userData[TableFields.phoneCountry], userData[TableFields.phone]);
        const accountData = {
            type: "express",
            country: "IE",
            email: userData.email,
            capabilities: {
                transfers: {requested: true},
                card_payments: {requested: true},
            },
            business_type: "individual",
            individual: {
                first_name: userData.firstName,
                last_name: userData.lastName,
                email: userData.email,
                phone: phoneE164,
            },
        };

        const account = await stripeTest.accounts.create(accountData);

        // const accountLink = await stripeTest.accountLinks.create({
        //     account: account.id, // <-- use account.id here
        //     refresh_url: "https://goggle.com/reauth",
        //     return_url: "https://goggle.com/success",
        //     type: "account_onboarding",
        // });

        return account;
    };

    // Create transfer to driver's connected account
    static createTransfer = async (connectedAccountId, amount, currency = "eur", metadata = {}) => {
        console.log("🚀 ~ StripeManager ~ metadata:", metadata);
        const transferData = {
            amount,
            currency: currency,
            destination: connectedAccountId,
            metadata: metadata,
        };

        let transfer = await stripeTest.transfers.create(transferData);
        return transfer;
    };

    // Create payout to driver's connected account (legacy method)
    static createPayout = async (connectedAccountId, amount, currency = "eur", metadata = {}) => {
        return await this.createTransfer(connectedAccountId, amount, currency, metadata);
    };

    // Get payment intent details
    static getPaymentIntent = async (paymentIntentId) => {
        return await stripeTest.paymentIntents.retrieve(paymentIntentId);
    };

    // Get checkout session details
    static getCheckoutSession = async (sessionId) => {
        return await stripeTest.checkout.sessions.retrieve(sessionId);
    };

    // Get connected account details
    static getConnectedAccount = async (accountId) => {
        return await stripeTest.accounts.retrieve(accountId);
    };

    // Create account link for driver onboarding
    static createAccountLink = async (accountId, refreshUrl, returnUrl) => {
        return await stripeTest.accountLinks.create({
            account: accountId,
            refresh_url: refreshUrl,
            return_url: returnUrl,
            type: "account_onboarding",
        });
    };

    // Get account balance
    static getAccountBalance = async (accountId) => {
        return await stripeTest.balance.retrieve({
            stripeAccount: accountId,
        });
    };

    // Refund payment
    static createRefund = async (paymentIntentId, amount = null, reason = "requested_by_customer") => {
        console.log("🚀 ~ StripeManager ~ amount:", amount);
        const refundData = {
            payment_intent: paymentIntentId,
            reason: reason,
        };

        if (amount) {
            refundData.amount = Math.round(amount * 100); //covert into cents
            console.log("🚀 ~ StripeManager ~ amount:", Math.round(amount * 100));
            // refundData.amount = amount;
        }
        console.log("🚀 ~ StripeManager ~ refundData:", refundData);

        return await stripeTest.refunds.create(refundData);
    };

    // Get transfer details
    static getTransfer = async (transferId) => {
        return await stripeTest.transfers.retrieve(transferId);
    };

    // Get transfer details (alias for consistency)
    static getTransferDetails = async (transferId) => {
        return await this.getTransfer(transferId);
    };

    // List transfers for an account
    static listTransfers = async (accountId, limit = 10) => {
        return await stripeTest.transfers.list({
            destination: accountId,
            limit: limit,
        });
    };

    // List account transfers with pagination options
    static listAccountTransfers = async (accountId, options = {}) => {
        const {limit = 10, starting_after} = options;
        const params = {
            destination: accountId,
            limit: limit,
        };

        if (starting_after) {
            params.starting_after = starting_after;
        }

        return await stripeTest.transfers.list(params);
    };

    // Update connected account
    static updateConnectedAccount = async (accountId, updateData) => {
        return await stripeTest.accounts.update(accountId, updateData);
    };

    // Create login link for connected account
    static createLoginLink = async (accountId) => {
        return await stripeTest.accounts.createLoginLink(accountId);
    };

    // Verify webhook signature
    static verifyWebhookSignature = (payload, signature, secret) => {
        return stripeTest.webhooks.constructEvent(payload, signature, secret);
    };

    // Update customer
    static updateCustomer = async (customerId, updateFields) => {
        return await stripeTest.customers.update(customerId, updateFields);
    };

    // Delete customer
    static deleteCustomer = async (customerId) => {
        return await stripeTest.customers.del(customerId);
    };

    // Delete customer (test mode)
    static deleteCustomerTest = async (customerId) => {
        return await stripeTest.customers.del(customerId);
    };

    static deleteConnectedDriver = async (driverAccountId) => {
        return await await stripe.accounts.del(driverAccountId);
    };

    // Get all products (existing method)
    static getAllProducts = async () => {
        const products = await stripeTest.products.list();
        const prices = await stripeTest.prices.list();
        return products.data.map((product) => {
            const associatedPrices = prices.data.filter((price) => price.product == product.id);
            return {
                productId: product.id,
                productName: product.name,
                description: product.description,
                prices: associatedPrices.map((price) => ({
                    priceId: price.id,
                    currency: price.currency,
                    unitAmount: price.unit_amount,
                    interval: price.recurring.interval,
                    isFreeTrial: price.recurring.interval == "month",
                    ...(price.recurring.interval === "month" && {
                        freeTrialDays: parseInt(process.env.FREE_TRIAL_DAYS, 10) || 5,
                    }),
                })),
            };
        });
    };

    // Get monthly plan ID (existing method)
    static getMonthlyPlanId = async () => {
        const products = await StripeManager.getAllProducts();
        return products.flatMap((product) => product.prices.filter((price) => price.isFreeTrial))[0].priceId;
    };

    // Get annual plan ID (existing method)
    static getAnnualPlanId = async () => {
        const products = await StripeManager.getAllProducts();
        return products.flatMap((product) => product.prices.filter((price) => !price.isFreeTrial))[0].priceId;
    };

    // Get subscription details (existing method)
    static getSubscriptionDetails = async (subscriptionId) => {
        return await stripeTest.subscriptions.retrieve(subscriptionId);
    };

    // Cancel subscription (existing method)
    static cancelSubscription = async (subscriptionId) => {
        return await stripeTest.subscriptions.cancel(subscriptionId);
    };

    // Get invoice data (existing method)
    static getInvoiceData = async (invoiceId) => {
        return await stripeTest.invoices.retrieve(invoiceId);
    };

    // Get all payment intents (existing method)
    static getAllPaymentIntents = async () => {
        return await stripeTest.paymentIntents.list();
    };

    // Get charge details (existing method)
    static getChargeDetails = async (chargeId) => {
        return await stripeTest.charges.retrieve(chargeId);
    };

    // Get balance transaction (existing method)
    static getBalanceTransaction = async (balance_transaction) => {
        return await stripeTest.balanceTransactions.retrieve(balance_transaction);
    };

    // Get billing portal (existing method)
    static getBillingPortal = async (userId, return_url) => {
        return await stripeTest.billingPortal.sessions.create({
            customer: userId,
            return_url: return_url,
        });
    };

    // List saved cards (existing method)
    static listSavedCards = async (customerId, limit = 20, lastItemId) => {
        const response = await stripeTest.paymentMethods.list({
            customer: customerId,
            type: "card",
            limit: limit,
            ...(lastItemId ? {starting_after: lastItemId} : {}),
        });

        const uniqueCards = response.data.reduce((acc, card) => {
            if (!acc.some((existingCard) => existingCard.card.fingerprint === card.card.fingerprint)) {
                acc.push(card);
            }
            return acc;
        }, []);

        return {
            ...response,
            data: uniqueCards,
        };
    };

    // Get customer details (existing method)
    static getCustomerDetails = async (customerId) => {
        return await stripeTest.customers.retrieve(customerId);
    };

    // Get publishable key
    static getPublishKey() {
        return process.env.STRIPE_PUB_KEY;
    }

    // Calculate commission
    static calculateCommission = (amount, commissionType, commissionValue) => {
        if (commissionType === 1) {
            // Percentage
            return (amount * commissionValue) / 100;
        } else if (commissionType === 2) {
            // Fixed
            return Math.min(commissionValue, amount);
        }
        return 0;
    };

    // Calculate net amount after commission
    static calculateNetAmount = (amount, commissionAmount) => {
        return Math.max(0, amount - commissionAmount);
    };
}

function formatPhoneE164(phoneCountry, phone) {
    if (!phoneCountry || !phone) return null;
    return `+${phoneCountry}${phone}`;
}

module.exports = {
    StripeManager,
};
