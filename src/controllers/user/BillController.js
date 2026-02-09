const { MongoUtil } = require('../../db/mongoose');
const BillService = require('../../db/services/BillService');
const { TableFields, ValidationMsgs, TableNames, UserTypes } = require('../../utils/constants');
const ValidationError = require('../../utils/ValidationError');
const Util = require('../../utils/util');
const PpaService = require('../../db/services/PpaService');

exports.payBillCash = async (req) => {
    const billId = req.params[TableFields.ID];
    const billExists = await BillService.recordExists(billId);
    if (!billExists) {
        throw new ValidationError(ValidationMsgs.RecordNotExists);
    }
    return await BillService.requestCashPayment(billId);
};

exports.listMyBills = async (req) => {
    const user = req.user;
    return await BillService.listBills({
        ...req.query,
        userId: user[TableFields.ID]
    }).withBasicInfo().withTimeStamps().execute()
}
