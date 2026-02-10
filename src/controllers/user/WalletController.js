const WalletService = require("../../db/services/WalletService");
const WalletTransactionService = require("../../db/services/WalletTransactionService");
const { TableFields, ValidationMsgs, TableNames, UserTypes, TransactionType, TransactionStatus } = require("../../utils/constants");
const ValidationError = require("../../utils/ValidationError");
const CounterService = require("../../db/services/CounterService");

exports.requestDeposit = async (req) => {
    const reqBody = req.body;
    const user = req.user;
    const userId = user[TableFields.ID];
    const amount = reqBody[TableFields.amount];

    if (!amount || amount <= 0) {
        throw new ValidationError("Invalid amount");
    }

    // Ensure wallet exists for user, if not create one
    let wallet = await WalletService.getUserById(userId).withId().execute();
    if (!wallet) {
        wallet = await WalletService.insertRecord({
            [TableFields.ID]: userId,
            [TableFields.userDetails]: {
                [TableFields.userId]: userId,
                [TableFields.userType]: user[TableFields.userType],
                [TableFields.name_]: user[TableFields.name_]
            },
            [TableFields.balance]: 0
        });
    }

    const transaction = await WalletTransactionService.insertRecord({
        [TableFields.fromUserDetail]: {
            [TableFields.walletId]: wallet[TableFields.ID],
            [TableFields.userDetails]: {
                [TableFields.userId]: userId,
                [TableFields.userType]: user[TableFields.userType],
                [TableFields.name_]: user[TableFields.name_]
            }
        },
        [TableFields.transactionType]: TransactionType.WalletDeposit,
        [TableFields.transactionAmount]: amount,
        [TableFields.transactionStatus]: TransactionStatus.Pending,
        [TableFields.description]: reqBody[TableFields.description] || "Wallet Deposit Request",
        [TableFields.bankReferenceId]: reqBody[TableFields.bankReferenceId], // Optional
        [TableFields.transactionId]: `TXN-${Date.now()}`
    });

    return transaction;
};

exports.listTransactions = async (req) => {
    const user = req.user;
    return await WalletTransactionService.listTransactions({
        ...req.query,
        userId: user[TableFields.ID]
    }).withBasicInfo().withTimeStamps().execute();
};

exports.getWalletBalance = async (req) => {
    const user = req.user;
    const wallet = await WalletService.getUserById(user[TableFields.ID]).withBasicInfo().execute();
    return wallet || { balance: 0 };
}