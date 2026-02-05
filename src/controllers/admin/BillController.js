const { MongoUtil } = require('../../db/mongoose');
const BillService = require('../../db/services/BillService');
const { TableFields, ValidationMsgs, TableNames, UserTypes, UserPaymentMethod, Months } = require('../../utils/constants');
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
    const ppa = await PpaService.getUserById(ppaId).withSigned().execute();
    if(!ppa?.[TableFields.isSigned]) {
        throw new ValidationError(ValidationMsgs.PpaNotSigned)
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
 
exports.editBill = async (req) => {
    const reqBody = req.body;
    const billId = req.params[TableFields.ID];

    const existingBill = await BillService.getUserById(billId).withBasicInfo().execute();
    if (!existingBill) {
        throw new ValidationError(ValidationMsgs.RecordNotExists);
    }

    if (existingBill && existingBill[TableFields.deleted]) {
        throw new ValidationError(ValidationMsgs.RecordNotExists);
    }

    const response = await parseAndValidateBill(
        reqBody, 
        existingBill,
        true,
        async (updatedFields) => {
            const record = await BillService.updateRecord(billId, updatedFields);
            return record;
        }
    )

    return response;
}

exports.listBills = async (req) => {
    return await BillService.listBills({
        ...req.query
    }).withBasicInfo().execute()
}

exports.billInfo = async (req) => {
    return await BillService.getUserById(req.params[TableFields.ID]).withBasicInfo().execute();
}

exports.updateCashPayment = async (req) => {
    const billId = req.params[TableFields.ID];
    console.log(billId);
    if(!billId) {
        throw new ValidationError('Parameter not getting')
    }
    const billInfo = await BillService.recordExists(billId);
    if (!billInfo) {
        throw new ValidationError(ValidationMsgs.RecordNotExists);
    }
    return await BillService.updateCashPayment(billId);
}

exports.downloadBillReport = async (req, res) => {
    try {
        let filter = { ...req.query };

        const allBills = await BillService.listBills(filter)
            .withBasicInfo()
            .execute();
        
        const UserPaymentMethodLabel = (type) => {
            switch (type) {
                case UserPaymentMethod.Cash:
                    return "Cash Payment";
                case UserPaymentMethod.Online:
                    return "Online Payment";
                default:
                    return "-";
            }
        };
        const BillingMonthLabel = (type) => {
            switch (type) {
                case Months.January:
                    return "January";
                case Months.February:
                    return "February";
                case Months.March:
                    return "March";
                case Months.April:
                    return "April";
                case Months.May:
                    return "May";
                case Months.June:
                    return "June";
                case Months.July:
                    return "July";
                case Months.August:
                    return "August";
                case Months.September:
                    return "September";
                case Months.October:
                    return "October";
                case Months.November:
                    return "November";
                case Months.December:
                    return "December";
                default:
                    return "-";
            }
        };
        
        const resultData = [];

        for (const bill of allBills.records) {
            resultData.push({
                "PPA's UniqueId" : bill?.[TableFields.ppaDetail]?.[TableFields.ppaUniqueId],
                "PPA's Name" : bill?.[TableFields.ppaDetail]?.[TableFields.ppaName],
                "Plant's UniqueId" : bill?.[TableFields.ppaDetail]?.[TableFields.plantUniqueId],
                "Plant's Name" : bill?.[TableFields.ppaDetail]?.[TableFields.plantUniqueName],
                "Tarrif" : bill?.[TableFields.ppaDetail]?.[TableFields.tarrif],
                "Plant's Capacity" : bill?.[TableFields.ppaDetail]?.[TableFields.plantCapacity],
                "Billing Month" : BillingMonthLabel(bill?.[TableFields.billingMonth]),
                "Billing Year" : bill?.[TableFields.billingYear],
                "Generated Units" : bill?.[TableFields.generatedUnits],
                "Consumed Units" : bill?.[TableFields.consumedUnits],
                "Exported Units" : bill?.[TableFields.exportedUnits],
                "Total Amount" : bill?.[TableFields.totalAmount],
                "Is Paid?" : bill?.[TableFields.isPaid],
                "User Payment Method" : UserPaymentMethodLabel(bill?.[TableFields.userPaymentMethod] || 'payment not done yet'),
                "Payment Date" : bill?.[TableFields.isPaid] === true ? Util.formatToDdMmYyyyWithTime(bill?.[TableFields.paymentDate]) : 'payment not done yet',
            })
        }
        const columns = [
            { width: 20 }, 
            { width: 10 }, 
            { width: 10 }, 
            { width: 20 }, 
            { width: 15 }, 
            { width: 30 }, 
            { width: 10 }, 
            { width: 15 }, 
            { width: 15 }, 
            { width: 15 }, 
            { width: 15 }, 
            { width: 15 }, 
            { width: 10 }, 
            { width: 25 }, 
            { width: 35 }, 
        ];

        const sheetName = "Bill Report";
        const fileName = `bill_report_${new Date()
        .toISOString()
        .split("T")[0]}.xlsx`;

        Util.exportToExcel(res, resultData, columns, sheetName, fileName);
        return;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

exports.deleteBill = async (req) => {
    const billId = req.params[TableFields.ID];
    const bill = await BillService.getUserById(billId).withBasicInfo().execute();
    if (!bill || bill[TableFields.deleted] == true) {
        throw new ValidationError(ValidationMsgs.RecordNotExists);
    }
    await BillService.updateDelete(billId);
}

async function parseAndValidateBill(
    reqBody,
    existingBill = {},
    update = false,
    onValidationCompleted = async (updatedUserFields) => {}
) {

    const ppaId = reqBody[TableFields.ppaId];

    if (isFieldEmpty(ppaId, existingBill?.[TableFields.ppaDetail]?.[TableFields.ppaId])) {
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
        if (update === true) {
            let updatedFields = {
                [TableFields.generatedUnits] : reqBody[TableFields.generatedUnits] ?? existingBill[TableFields.generatedUnits],
                [TableFields.consumedUnits] : reqBody[TableFields.consumedUnits] ?? existingBill[TableFields.consumedUnits],
                [TableFields.exportedUnits] : reqBody[TableFields.exportedUnits] ?? existingBill[TableFields.exportedUnits],
            }
            return await onValidationCompleted(updatedFields);
        } else {
            let response = await onValidationCompleted({
                [TableFields.ppaDetail] : {
                    [TableFields.ppaId] : ppaId,
                    [TableFields.plantId]: ppaInfo?.[TableFields.plantDetail]?.[TableFields.plantId],
                    [TableFields.userId]: ppaInfo?.[TableFields.plantDetail]?.[TableFields.userId],
                    [TableFields.ppaUniqueId]: ppaInfo?.[TableFields.ppaUniqueId],
                    [TableFields.ppaName]: ppaInfo?.[TableFields.ppaName],
                    [TableFields.plantUniqueId]: ppaInfo?.[TableFields.plantDetail]?.[TableFields.plantUniqueId],
                    [TableFields.plantUniqueName]: ppaInfo?.[TableFields.plantDetail]?.[TableFields.plantUniqueName],
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