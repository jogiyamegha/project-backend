const PdfPrinter = require('pdfmake');
const path = require('path')
const { centeredLayout, applyVerticalAlignmentToCell } = require('./pdfCreatorTableCenterVerticalLayout');
const fonts = {
    ProximaNova: {
        normal: path.join(__dirname, '..', 'assets', 'fonts', 'ProximaNova-Light.otf'),
        bold: path.join(__dirname, '..', 'assets', 'fonts', 'ProximaNova-Bold.otf'),
        semibold: path.join(__dirname, '..', 'assets', 'fonts', 'ProximaNova-Semibold.otf'),
        italics: path.join(__dirname, '..', 'assets', 'fonts', 'ProximaNova-LightItalic.otf'),
        bolditalics: path.join(__dirname, '..', 'assets', 'fonts', 'ProximaNova-BoldIt.otf')
    },
    Semibold: {
        normal: path.join(__dirname, '..', 'assets', 'fonts', 'ProximaNova-Light.otf'),
        bold: path.join(__dirname, '..', 'assets', 'fonts', 'ProximaNova-Semibold.otf'),
        italics: path.join(__dirname, '..', 'assets', 'fonts', 'ProximaNova-LightItalic.otf'),
        bolditalics: path.join(__dirname, '..', 'assets', 'fonts', 'ProximaNova-BoldIt.otf')
    },
    FontSymbols: {
        normal: path.join(__dirname, '..', 'assets', 'fonts', 'ARIALUNI.TTF'),
        bold: path.join(__dirname, '..', 'assets', 'fonts', 'Arial-Unicode-Bold.ttf'),
        italics: path.join(__dirname, '..', 'assets', 'fonts', 'ARIALUNI.TTF'),
        bolditalics: path.join(__dirname, '..', 'assets', 'fonts', 'Arial-Unicode-Bold.ttf')
    }
};
const printer = new PdfPrinter(fonts);
const pageWidth = 612 //PT // from lib: 595.28
const pageHeight = 841.89  //PT
const pageLeftRightMargin = 40
const pageLeftRightMarginForNarrowMargin = 30
const pageTopBottomMargin = 60
exports.getPageDimensions = () => ({
    pageWidth,
    pageHeight,
    pageLeftRightMargin,
    pageTopBottomMargin
})

    exports.sendPDFFile = async function (res, contents = [], pageOrientation = "portrait", userNarrowWidth = false) {
        return new Promise((resolve, reason) => {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader("Content-Disposition", 'attachment;filename=file.pdf');
            var docDefinition = getDocDefinition(pageOrientation, userNarrowWidth);
            docDefinition.content = contents
            // docDefinition.footer = getInvoiceFooter()

            var pdfDoc = printer.createPdfKitDocument(docDefinition);

            pdfDoc.pipe(res)
            pdfDoc.on("end", () => {
                resolve(); // Return the generated PDF buffer
            })
            pdfDoc.on("error", error => reason(error))
            pdfDoc.end()
        })
    }

exports.generatePDFBuffer = async function (contents = [], pageOrientation = "portrait", userNarrowWidth = false) {
    return new Promise((resolve, reject) => {
        const docDefinition = getDocDefinition(pageOrientation, userNarrowWidth);
        docDefinition.content = contents;

        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const chunks = [];

        pdfDoc.on("data", (chunk) => chunks.push(chunk)); // Collect data chunks
        pdfDoc.on("end", () => {
            const pdfBuffer = Buffer.concat(chunks); // Combine chunks into a buffer
            resolve(pdfBuffer); // Return the buffer
        });
        pdfDoc.on("error", (error) => reject(error)); // Handle errors
        pdfDoc.end(); // Finalize the document
    });
};

function getDocDefinition(pageOrientation, userNarrowWidth = false) {
    let pageOrientationVar = 'portrait'
    if (pageOrientation == 'landscape') {
        pageOrientationVar = 'landscape'
    }

    return {
        pageSize: 'A4',
        pageOrientation: pageOrientationVar,
        content: [],
        defaultStyle: {
            font: 'ProximaNova'
        },
        styles: {
            header: {
                fontSize: 12,
                bold: true,
            },
            header2: {
                fontSize: 18,
                bold: true,
                alignment: 'center',
                color: '#5014D0'
            },
            subHeader: {
                fontSize: 11,
                color: 'gray',
                font: "Semibold",
            },
            subHeader3: {
                fontSize: 14,
                alignment: 'left',
                color: '#0d831e',
                bold: true,
                font: 'Semibold'
            },
            headerOtherTitle: {
                fontSize: 18,
                bold: true,
                alignment: 'center',
                marginTop: 5
            },
            center2: {
                alignment: 'center',
                margin: [0, 5, 0, 0]
            },
            leftSideHeader: {
                alignment: 'left',
                height: 20,
                width: 20
            },
            sideHeader: {
                alignment: 'right',
                fontSize: 16,
                bold: true,
            },
            gray12Right: {
                alignment: 'right',
                fontSize: 12,
                bold: true,
                color: 'gray',
            },
            rightData: {
                fontSize: 10,
                alignment: 'right',
                font: "Semibold",
                bold: true,
                margin: [0, 0, 0, 0],
            },
            columnData: {
                fontSize: 9,
                alignment: 'center',
                font: "Semibold",
                bold: true,
                color: "gray",
                margin: [0, 6, 0, 0],
            },
            columnHeader: {
                fontSize: 10,
                bold: true,
                alignment: 'center',
                borderRadius: [8, 8, 0, 0],
            },
            column: {
                alignment: 'center', // Center align the content within each column
                margin: [0, 10, 0, 10], // Add vertical margin to create separation
                fillColor: "#F9F9F9",
            },
            mergedColumn: {
                fontSize: 9,
                bold: true,
                alignment: 'left',
                margin: [0, 10],
            },
            tableHeader: {
                fontSize: 9,
                bold: true,
                alignment: 'left',
                margin: [0, 10],
            },
            tableHeader2: {
                fontSize: 12,
                bold: true,
                alignment: 'left',
                margin: [0, 10],
            },
            tableHeader3: {
                fontSize: 12,
                alignment: 'center',
                font: 'Semibold',
                bold: true
            },
            tableData: {
                fontSize: 9,
                alignment: 'left',
                margin: [0, 10],
                font: "Semibold",
            },
            tableData3: {
                fontSize: 12,
                alignment: 'center',
                font: "Semibold",
            },
            tableData4: {
                fontSize: 12,
                alignment: 'center',
                font: "Semibold",
                color: 'red'
            },
            // Font Size
            fs9: {
                fontSize: 9,
            },
            fs10: {
                fontSize: 10,
            },
            fs11: {
                fontSize: 11,
            },
            fs12: {
                fontSize: 12,
            },
            fs24: {
                fontSize: 24,
            },
            // Alignments
            leftAlignment: {
                alignment: "left"
            },
            rightAlignment: {
                alignment: "right"
            },
            centerAlignment: {
                alignment: "center"
            },
            justifyAlignment: {
                alignment: "justify"
            },
            bottomAlignment: {
                alignment: "bottom"
            },
            // Margins
            mr10: {
                marginRight: 10,
            },
            mr40: {
                marginRight: 40,
            },
            ml40: {
                marginLeft: 40,
            },
            ml10: {
                marginLeft: 10,
            },
            mt10: {
                marginTop: 10,
            },
            mt8: {
                marginTop: 8,
            },
            mt5: {
                marginTop: 5,
            },
            mt20: {
                marginTop: 20,
            },
            mtn13: {
                marginTop: -13,
            },
            mtn8: {
                marginTop: -8,
            },
            mtn5: {
                marginTop: -5,
            },
            mb8: {
                marginBottom: 8
            },
            mb10: {
                marginBottom: 10
            },
            bold: {
                bold: true
            },
            semiBoldFonts: {
                fonts: "Semibold"
            },
            fontPrimary: {
                color: "#1a74e5"
            },
            fontSecondary: {
                color: "#0d831e"
            },
            lineHeight1P5: {
                lineHeight: 1.5
            },
            absolutePosition: {
                absolutePosition: { x: 1000, y: 780 }
            }
        },
        // pageMargins: [userNarrowWidth ? pageLeftRightMarginForNarrowMargin : pageLeftRightMargin, pageTopBottomMargin, userNarrowWidth ? pageLeftRightMarginForNarrowMargin : pageLeftRightMargin, pageTopBottomMargin]
    }
}

exports.getTableLayout = function (tableBody = [], contentLength) {

    const columnWidths = Array(tableBody[0].length)
        .fill(100 / tableBody[0].length + "%")
        .map((width, index) => (index === 0 ? "*" : "auto"));

    const tableDefinition = {
        table: {
            headerRows: 1,
            widths: contentLength.widths ? contentLength.widths : columnWidths,
            dontBreakRows: true,
            body: tableBody,
        },
        layout: {
            hLineWidth: function (i, node) {
                return (i === 0 || i === node.table.body.length) ? 1 : 1;
            },
            vLineWidth: function (i, node) {
                return (i === 0 || i === node.table.widths.length) ? 1 : 0;
            },
            hLineColor: function (i, node) {
                return '#E9E9E9';
            },
            vLineColor: function (i, node) {
                return '#E9E9E9';
            },
            hLineStyle: function (i, node) {
                if (i === 0 || i === node.table.body.length) {
                    return null;
                }
                return { solid: { length: 10, space: 4 } };
            },
            vLineStyle: function (i, node) {
                if (i === 0 || i === node.table.widths.length) {
                    return null;
                }
                return { solid: { length: 4 } };
            },
            fillColor: function (i, node) {
                if (i == 0) return null
                if (i > contentLength) return null
                return i % 2 === 0 ? '#e5f6de' : null; // Light green color for even rows
            },
        },
    };
    return tableDefinition;
}

exports.getTitleHeader = function (headerText, periodFromTime, periodToTime, generatedOnTime, otherTitle = [], logo = undefined) {
    return [
        { text: headerText, style: 'header2' },
        { text: (logo ? '\n\n' : '') },
        ...logo ? [logo] : [],
        ...otherTitle,
        generatedOnTime ? { text: 'Generated on ' + generatedOnTime, style: 'center2' } : "",
        periodFromTime ? { text: 'Period: ' + periodFromTime + " to " + periodToTime, style: 'center2' } : "",
        { text: '\n\n' },
        {
            table: {
                headerRows: 1,
                widths: '100%',
                body: [
                    ['']
                ]
            },
            layout: {
                hLineWidth: function (i, node) {
                    return 0.0;
                },
                paddingLeft: function (i, node) { return 0; },
                paddingRight: function (i, node) { return 0; },
                paddingTop: function (i, node) { return 0; },
                paddingBottom: function (i, node) { return 0; },
            }
        }
        // {canvas: [ { type: 'line', x1: 0, y1: 0, x2: pageOrientation=="landscape"?pageHeight-(2*pageLeftRightMargin):pageWidth-(2*pageLeftRightMargin), y2: 0, lineWidth: 0.5 }]},
    ]
}

exports.getOneLineBreak = function () {
    return {
        text: "\n"
    }
}

exports.getTwoLineBreak = function () {
    return {
        text: "\n\n"
    }
}

exports.getTableLayout2 = function (header, rows = [], tableProperties = {}) {
    return {
        table: {
            widths: '*',
            dontBreakRows: true,
            body: [
                ...header ? [header] : [],
                ...rows
            ],
            ...tableProperties
        },
        layout: {
            hLineWidth: function (i, node) {
                return (i === 0 || i === node.table.body.length) ? 1 : 1;
            },
            vLineWidth: function (i, node) {
                return (i === 0 || i === node.table.widths.length) ? 1 : 1;
            },
            hLineColor: function (i, node) {
                return '#000000';
            },
            vLineColor: function (i, node) {
                return '#000000';
            },
            paddingTop: function (i, node) {
                applyVerticalAlignmentToCell(i, node)
                return 5;
            },
            paddingRight: () => 5,
            paddingLeft: () => 5,
            paddingBottom: () => 5,
        }
    }
}

exports.getHeaderWithLogo = function (content = [], logoHeight = 40.5, logoWidth = 116.25) {
    const leftSidebar = [];
    content.map((val, index) => {
        leftSidebar.push({
            image: val.image,
            width: logoWidth,  // Set the width of the image
            height: logoHeight,
        });
        leftSidebar.push({ text: "\n\n" });
    })
    return {
        columns: [
            {
                width: '100%',
                stack: leftSidebar
            }
        ],
    }
}

const getTableRowLayout = function (content = []) {
    const columns = content.length
    const columnWidths = Array(columns).fill(100 / columns + "%");
    const body = content.map((record) => ({
        stack: [
            { ...record, text: record.header, style: 'columnSideHeader' },
            { ...record, text: record.data, style: record.style },
        ],
        style: 'row',
    }));
    return {
        table: {
            widths: columnWidths,
            columnGap: 20,
            body: [body]
        },
        layout: {
            hLineWidth: function (i, node) {
                return (i === 0 || i === node.table.body.length) ? 0 : 0;
            },
            vLineWidth: function (i, node) {
                return (i === 0 || i === node.table.widths.length) ? 0 : 2;
            },
            hLineColor: function (i, node) {
                return 'white';
            },
            vLineColor: function (i, node) {
                return 'white';
            },
            hLineStyle: function (i, node) {
                if (i === 0 || i === node.table.body.length) {
                    return null;
                }
                return { solid: { length: 10, space: 4 } };
            },
            vLineStyle: function (i, node) {
                if (i === 0 || i === node.table.widths.length) {
                    return null;
                }
                return { solid: { length: 4 } };
            },

        }
    }
}

exports.getTableCenterLayout = centeredLayout
exports.applyVerticalAlignmentToCell = applyVerticalAlignmentToCell
exports.getTableRowLayout = getTableRowLayout