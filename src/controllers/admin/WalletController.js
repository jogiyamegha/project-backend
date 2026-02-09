const WalletService = require("../../db/services/WalletService");
const WalletTransactionService = require("../../db/services/WalletTransactionService");
const { TableFields, ValidationMsgs, TableNames, UserTypes, TransactionType, TransactionStatus } = require("../../utils/constants");
const ValidationError = require("../../utils/ValidationError");

exports.approveDeposit = async (req) => {
    const transactionId = req.params[TableFields.ID];
    const admin = req.user;
    const adminNote = req.body[TableFields.note]; // adminNote

    const transaction = await WalletTransactionService.getUserById(transactionId).withBasicInfo().execute();
    if (!transaction) {
        throw new ValidationError("Transaction not found");
    }

    if (transaction[TableFields.transactionStatus] !== TransactionStatus.Pending) {
        throw new ValidationError("Transaction is not pending");
    }

    // Update Transaction Status
    await WalletTransactionService.updateStatus(transactionId, TransactionStatus.Succssful, admin[TableFields.ID], adminNote);

    // Update Wallet Balance
    const userId = transaction[TableFields.fromUserDetail][TableFields.userId];
    const wallet = await WalletService.getUserById(userId).withBasicInfo().execute();

    // If wallet doesn't exist (should not happen if created on request), create it
    let currentBalance = 0;
    if (wallet) {
        currentBalance = wallet[TableFields.balance] || 0;
        await WalletService.updateRecord(userId, {
            [TableFields.balance]: currentBalance + transaction[TableFields.transactionAmount]
        });
    } else {
        // Create wallet if missing
        await WalletService.insertRecord({
            [TableFields.ID]: userId,
            [TableFields.balance]: transaction[TableFields.transactionAmount]
        });
    }

    return { message: "Deposit approved successfully" };
};


exports.listTransactions = async (req) => {
    return await WalletTransactionService.listTransactions({
        ...req.query
    }).withBasicInfo().withTimeStamps().execute();
};
