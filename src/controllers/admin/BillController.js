const { MongoUtil } = require('../../db/mongoose');
const BillService = require('../../db/services/BillService');
const { TableFields, ValidationMsgs, TableNames, UserTypes } = require('../../utils/constants');
const ValidationError = require('../../utils/ValidationError');
const Util = require('../../utils/util');
const PpaService = require('../../db/services/PpaService');

exports.generateBill = async (req) => {
    const reqBody = req.body;
    const ppaId = reqBody[TableFields.ppaId];
    const billingMonth = reqBody[TableFields.billingMonth];
    const billingYear = reqBody[TableFields.billingYear];

    if(!ppaId) {
        throw new ValidationError(ValidationMsgs.PpaIdEmpty)
    }
    if(!billingMonth) {
        throw new ValidationError(ValidationMsgs.BillingMonthEmpty)
    }
    if(!billingYear) {
        throw new ValidationError(ValidationMsgs.BillingYearEmpty)
    }

    const billExists = await BillService.existForMonthPpaId(ppaId, billingMonth, billingYear) 
    if(billExists) {
        throw new ValidationError(ValidationMsgs.BillAlreadyGeneratedForMonthPpa)
    }
    let data = await parseAndValidateBill(
        reqBody,
        undefined,
        false,
        async(updatedField) => {
            return await BillService.insertRecord(updatedField);
        }
    )
    return data;
}
 
exports.listBills = async (req) => {
    return await BillService.listBills({
        ...req.query
    }).withBasicInfo().execute()
}

async function parseAndValidateBill(
    reqBody,
    existingBill = {},
    update = false,
    onValidationCompleted = async (updatedUserFields) => {}
) {

    const ppaId = reqBody[TableFields.ppaId];

    if (isFieldEmpty(ppaId, existingBill[`${TableFields.ppaDetail}.${TableFields.ppaId}`])) {
        throw new ValidationError(ValidationMsgs.PpaIdEmpty);
    }
    if (isFieldEmpty(reqBody[TableFields.billingMonth], existingBill[TableFields.billingMonth])) {
        throw new ValidationError(ValidationMsgs.BillingMonthEmpty);
    }
    if (isFieldEmpty(reqBody[TableFields.billingYear], existingBill[TableFields.billingYear])) {
        throw new ValidationError(ValidationMsgs.BillingYearEmpty);
    }
    if (isFieldEmpty(reqBody[TableFields.generatedUnits], existingBill[TableFields.generatedUnits])) {
        throw new ValidationError(ValidationMsgs.GeneratedUnitsEmpty);
    }
    if (isFieldEmpty(reqBody[TableFields.consumedUnits], existingBill[TableFields.consumedUnits])) {
        throw new ValidationError(ValidationMsgs.ConsumedUnitsEmpty);
    } 
    if (isFieldEmpty(reqBody[TableFields.exportedUnits], existingBill[TableFields.exportedUnits])) {
        throw new ValidationError(ValidationMsgs.ExportedUnitsEmpty);
    }

    const ppaInfo = await PpaService.getUserById(ppaId).withBasicInfo().execute();
    const totalAmount = reqBody[TableFields.consumedUnits] * ppaInfo?.[TableFields.tarrif]
    try {
        let response = await onValidationCompleted({
            [TableFields.ppaDetail] : {
                [TableFields.ppaId] : ppaId,
                [TableFields.plantId]: ppaInfo?.[TableFields.plantId],
                [TableFields.userId]: ppaInfo?.[TableFields.plantDetail]?.[TableFields.userId],
                [TableFields.tarrif]: ppaInfo?.[TableFields.tarrif],
                [TableFields.plantCapacity]: ppaInfo?.[TableFields.plantCapacity],
            },
            [TableFields.billingMonth] : reqBody[TableFields.billingMonth],
            [TableFields.billingYear] : reqBody[TableFields.billingYear],
            [TableFields.generatedUnits] : reqBody[TableFields.generatedUnits],
            [TableFields.consumedUnits] : reqBody[TableFields.consumedUnits],
            [TableFields.exportedUnits] : reqBody[TableFields.exportedUnits],
            [TableFields.totalAmount] : totalAmount || 0,
        })
        return response;
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