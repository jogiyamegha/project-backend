const fetch = require("axios");
const {UserTypes, TableFields} = require("../constants");
const Util = require("../utils");
const stripe = require("stripe")(process.env.STRIPE_SEC_KEY);
const IncomingWebhook = require("../../utils/webhook/IncomingWebhook");
const stripeConnectAccountWebhookEndpointSecret =
    process.env.STRIPE_WEBHOOK_SECRET || "whsec_Are4jeUtgY3bNLyEXntzPNrXWatYB5U3";
let countryCodeJSON = {
    1: "US",
    30: "GR",
    31: "NL",
    32: "BE",
    33: "FR",
    34: "ES",
    36: "HU",
    39: "IT",
    40: "RO",
    41: "CH",
    43: "AT",
    44: "GB",
    45: "DK",
    46: "SE",
    48: "PL",
    49: "DE",
    52: "MX",
    60: "MY",
    65: "SG",
    66: "TH",
    81: "JP",
    86: "HK",
    350: "GI",
    351: "PT",
    352: "LU",
    353: "IE",
    356: "MT",
    357: "CY",
    358: "FI",
    359: "BG",
    370: "LT",
    371: "LV",
    372: "EE",
    385: "HR",
    386: "SI",
    420: "CZ",
    421: "SK",
    423: "LI",
    852: "HK",
    // '971': 'AE',
    974: "QA",
    975: "BT",
    976: "MN",
    977: "NP",
    993: "TM",
    994: "AZ",
    995: "GE",
    996: "KG",
    998: "UZ",
    1242: "BS",
    1246: "BB",
    1264: "AI",
    1268: "AG",
    1284: "VG",
    1340: "VI",
    1441: "BM",
    1473: "GD",
    1649: "TC",
    1664: "MS",
    1670: "MP",
    1671: "GU",
    1684: "AS",
    1758: "LC",
    1767: "DM",
    1784: "VC",
    1849: "DO",
    1868: "TT",
    1869: "KN",
    1876: "JM",
    1939: "PR",
};
class StripeManager {
    static createdAccounts = [];
    static createPayeeAccount = async (userId, userName, userEmail, countryCode) => {
        const country = countryCodeJSON[countryCode]; // Get the country code from your JSON
        let tempData = {
            name: userName,
            user: userId.toString(),
            email: userEmail,
        };
        console.log("userId", tempData);
        if (!country) {
            throw new Error("Invalid country code");
        }
        // for (const val in [1]) {
        try {
            return await stripe.accounts.create({
                type: "express",
                country: country,
                capabilities: {
                    card_payments: {requested: true},
                    transfers: {requested: true},
                },
                business_type: "individual",
                business_profile: {
                    product_description: "Lorem Ipsum",
                },
                email: userEmail,
                metadata: tempData,
            });
        } catch (error) {
            console.log(error);
            await IncomingWebhook.send(error, "Stripe");
            console.log(error);
        }
    };
    static deletePayeeAccount = async (accountId) => {
        if (accountId) {
            return await stripe.accounts.del(accountId);
        }
    };
    static retrieveBankAccount = async (accountID, externalBankId) => {
        return await stripe.accounts.retrieveExternalAccount(accountID, externalBankId);
    };
    static deleteBankAccount = async (accountID, externalBankId) => {
        return await stripe.accounts.deleteExternalAccount(accountID, externalBankId);
    };
    static generateAccountLink = async (accountID, return_url) => {
        return await stripe.accountLinks
        .create({
            type: "account_onboarding",
            account: accountID,
            refresh_url: return_url,
            return_url: return_url,
        })
        .then((link) => {
            return link.url;
        });
    };
    static verifyWebhookSign(reqBody, sig) {
        try {
            return stripe.webhooks.constructEvent(reqBody, sig, "whsec_Are4jeUtgY3bNLyEXntzPNrXWatYB5U3");
        } catch (error) {
            try {
                return stripe.webhooks.constructEvent(reqBody, sig, "whsec_8VQ5MW5CQ9Iu9EEgUXf8oVO8LmcShleR");
            } catch (error) {
                console.log(error);
                throw error;
            }
        }
    }
    static getInfoById = async (accountId) => {
        return await stripe.accounts.retrieve(accountId);
    };
    static getAvailableBalance = async (accountId) => {
        //TODO: Config this or delete this?
        return await stripe.balance.retrieve({
            stripeAccount: accountId,
        });
    };
    static createCheckoutSession = async (
        eventId,
        eventTitle,
        eventDescription,
        reservationId,
        price,
        guestId,
        guest,
        hostId,
        type
    ) => {
        return await stripe.checkout.sessions.create({
            success_url: "https://akhie.imperoserver.in/api/success?" + reservationId,
            client_reference_id: reservationId,
            line_items: [
                {
                    price_data: {
                        currency: "eur",
                        product_data: {name: eventTitle, description: eventDescription},
                        unit_amount: (price * 100).toFixed(0),
                    },
                    quantity: guest,
                },
                // {
                //   price_data: {
                //     currency: 'eur',
                //     product_data: {name: 'Processing Fees'},
                //     unit_amount: parseInt(
                //       parseInt((price*guest*100).toFixed(0))*0.035,
                //     ).toFixed(0),
                //   },
                //   quantity: 1,
                // },
            ],
            metadata: {
                hostId: hostId.toString(),
                guestId: guestId.toString(),
                guest: guest.toString(),
                eventId: eventId.toString(),
                type: JSON.stringify(type),
            },
            // payment_method_types: ['promptpay'],
            mode: "payment",
            // automatic_payment_methods: { enabled: true },
        });
    };
    static refund = async (pendingIntent, accountId) => {
        return await stripe.refunds.create(
            {
                payment_intent: pendingIntent,
            },
            {
                stripeAccount: accountId,
            }
        );
    };
    static listSavedCards = async (customerId, limit = 20, lastItemId) => {
        return await stripe.paymentMethods.list({
            customer: customerId,
            type: "card",
            limit: limit,
            ...(lastItemId ? {starting_after: lastItemId} : {}),
        });
    };
    static transferAmount = async (accountId, amount, hostId, eventId) => {
        console.log("accountId, amount, hostId, eventId", accountId, amount, hostId, eventId);
        amount = Math.round(amount * 100, 2);
        // if (amount < 1) {

        return await stripe.transfers.create({
            amount: amount,
            currency: "eur",
            destination: accountId,
            metadata: {
                hostId: hostId.toString(),
                eventId: eventId.toString(),
            },
        });
        // } else {
        //   console.log("in else")
        //   return await stripe.transfers.create({
        //     amount: amount * 100,
        //     currency: 'eur',
        //     destination: accountId,
        //     metadata: {
        //       hostId: hostId.toString(),
        //       eventId: eventId.toString()
        //     },
        //   })
        // }
    };
    static getBalance = async () => {
        const balance = await stripe.balance.retrieve();
        return balance;
    };
    static retrievePaymentData = async (paymentIntentId) => {
        return await stripe.paymentIntents.retrieve(paymentIntentId);
    };
    static createRefund = async (paymentIntentId, amount) => {
        const originalNumber = amount + 0.28;
        const integerValue = Math.floor(originalNumber * 1000);
        const resultAfterMultiplication = integerValue * 100;
        return await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: (amount * 100).toFixed(0),
            // // amount:(amount*100).toFixed(0)+  parseInt(
            // //   parseInt((amount*100).toFixed(0))*0.035,
            // // ).toFixed(0),
            // amount:resultAfterMultiplication.toString()
            // refund_application_fee:true
        });
    };
    static getStripDisableReasonText = (disabled_reason = "") => {
        switch (disabled_reason) {
            case "requirements.past_due":
                return "Additional verification information is required to enable payout or charge capabilities on this account";
            case "requirements.pending_verification":
                return "Stripe is currently verifying information on the connected account.";
            case "listed":
                return "Account might be on a prohibited persons or companies list (Stripe will investigate and either reject or reinstate the account appropriately)";
            case "platform_paused":
                return "platform_paused";
            case "rejected.fraud":
                return "Account is rejected due to suspected fraud or illegal activity";
            case "rejected.listed":
                return "Account is rejected because it’s on a third-party prohibited persons or companies list (such as financial services provider or government).";
            case "rejected.terms_of_service":
                return "Account is rejected due to suspected terms of service violations.";
            case "rejected.other":
                return "Account is rejected for another reason.";
            case "under_review":
                return "Account is under review by Stripe.";
            case "other":
                return "Account isn’t rejected but is disabled for another reason while being reviewed";
        }
        //return undefined
    };
    static getPublishKey() {
        return process.env.STRIPE_PUB_KEY;
    }
    static getAvailableDateRangeObject = async () => {
        let transactionReportObj = await stripe.reporting.reportTypes.retrieve(
            "connected_account_balance_change_from_activity.itemized.2"
        );
        let payoutsReportObj = await stripe.reporting.reportTypes.retrieve("connected_account_payouts.itemized.2");
        return {
            transaction: {
                data_available_start: new Date(transactionReportObj.data_available_start * 1000),
                data_available_end: new Date(transactionReportObj.data_available_end * 1000),
            },
            payouts: {
                data_available_start: new Date(payoutsReportObj.data_available_start * 1000),
                data_available_end: new Date(payoutsReportObj.data_available_end * 1000),
            },
        };
    };
    static requestTransactionReport = async (stripeAccountId, fromDate, toDate) => {
        let reportRun = await stripe.reporting.reportRuns.create({
            report_type: "connected_account_balance_change_from_activity.itemized.2",
            parameters: {
                interval_start: fromDate,
                interval_end: toDate,
                connected_account: stripeAccountId,
                columns: Object.keys({
                    created_utc: "Time at which the balance transaction was created",
                    available_on_utc:
                        "The date the balance transaction’s net funds will become available in the Stripe balance",
                    currency: "gross, fee and net are defined in this currency",
                    gross: "Gross amount of the transaction",
                    fee: "Fees paid for this transaction",
                    net: "Net amount of the transaction",
                    reporting_category: "charge, refund, etc.",
                    description:
                        "An arbitrary string attached to the balance transaction. Often useful for displaying to users",
                    customer_facing_amount:
                        "For transactions associated with charges or refunds, the amount of the original charge or refund.",
                    customer_facing_currency: "For transactions associated with charges or refunds",
                    payment_intent_id: "The unique ID of the related Payment Intent, if any.",
                    payment_method_type: "The type of payment method used in the related payment.",
                    card_brand: "Card brand, if applicable.",
                    card_funding: "Card funding type, if applicable.",
                    card_country: "Two-letter ISO code representing the country of the card",
                    statement_descriptor:
                        "The dynamic statement descriptor or suffix specified when the related charge was created.",
                    dispute_reason: "Reason given by cardholder for dispute.",
                    connected_account: "Unique identifier for the Stripe account associated with this line",
                    "payment_metadata[invoiceID]": "metadata sent from our end",
                    [`payment_metadata[${TableFields.completedBy}]`]: "user from our system who has paid the amount",
                }),
            },
        });
        return reportRun.id;
    };
    static requestPayoutReport = async (stripeAccountId, fromDate, toDate) => {
        const reportRun = await stripe.reporting.reportRuns.create({
            report_type: "connected_account_payouts.itemized.2",
            parameters: {
                interval_start: fromDate,
                interval_end: toDate,
                connected_account: stripeAccountId,
                columns: Object.keys({
                    payout_id: "The Stripe object to which this transaction is related.",
                    effective_at_utc:
                        "For automatic payouts, this is the date we expect funds to arrive in your bank account. For manual payouts, this is the date the payout was initiated. In both cases, it’s the date the paid-out funds are deducted from your Stripe balance. All dates in UTC.",
                    currency: "Three-letter ISO code for the currency in which gross, fee and net are defined.",
                    gross: "Gross amount of the transaction. Expressed in major units of the currency (e.g. dollars for USD, yen for JPY).",
                    fee: "Fees paid for this transaction. Expressed in major units of the currency (e.g. dollars for USD, yen for JPY).",
                    net: "Net amount of the transaction. Expressed in major units of the currency (e.g. dollars for USD, yen for JPY).",
                    reporting_category:
                        "Reporting Category is a new categorization of balance transactions, meant to improve on the current type field.",
                    payout_expected_arrival_date:
                        "Date the payout is scheduled to arrive in the bank. This factors in delays like weekends or bank holidays. Dates in UTC.",
                    payout_status:
                        "Current status of the payout (paid, pending, in_transit, canceled or failed). A payout will be pending until it is submitted to the bank, at which point it becomes in_transit. It will then change to paid if the transaction goes through. If it does not go through successfully, its status will change to failed or canceled.",
                    payout_reversed_at:
                        "Typically this field will be empty. However, if the payout’s status is canceled or failed, this field will reflect the time at which it entered that status.",
                    payout_type: "Can be bank_account or card.",
                    payout_description:
                        "An arbitrary string attached to the payout. Often useful for displaying to users.",
                    payout_destination_id: "ID of the bank account or card the payout was sent to.",
                    connected_account: "Unique identifier for the Stripe account associated with this line.",
                }),
            },
        });
        return reportRun.id;
    };
    static retrieveTransactionReport = async (requestId) => {
        return await stripe.reporting.reportRuns.retrieve(requestId);
    };
    static downloadStripeReport = async (url) => {
        let report = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Basic ${Buffer.from(String(process.env.STRIPE_SEC_KEY)).toString("base64")}`,
            },
        }).then((a) => a.text());
        return report;
    };
}
module.exports = {
    StripeManager,
};
