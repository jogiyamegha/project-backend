// const {S3, defaultBucket, DefaultFiles} = require("./storage/metadata");
const dateFormat = require("dateformat");
const PdfPrinter = require("pdfmake");
const path = require("path");
const fonts = {
    ProximaNova: {
        normal: path.join(__dirname, "..", "assets", "fonts", "ProximaNova-Light.otf"),
        bold: path.join(__dirname, "..", "assets", "fonts", "ProximaNova-Bold.otf"),
        semibold: path.join(__dirname, "..", "assets", "fonts", "ProximaNova-Semibold.otf"),
        italics: path.join(__dirname, "..", "assets", "fonts", "ProximaNova-LightItalic.otf"),
        bolditalics: path.join(__dirname, "..", "assets", "fonts", "ProximaNova-BoldIt.otf"),
    },
    Semibold: {
        normal: path.join(__dirname, "..", "assets", "fonts", "ProximaNova-Light.otf"),
        bold: path.join(__dirname, "..", "assets", "fonts", "ProximaNova-Semibold.otf"),
        italics: path.join(__dirname, "..", "assets", "fonts", "ProximaNova-LightItalic.otf"),
        bolditalics: path.join(__dirname, "..", "assets", "fonts", "ProximaNova-BoldIt.otf"),
    },
    FontSymbols: {
        normal: path.join(__dirname, "..", "assets", "fonts", "ARIALUNI.TTF"),
        bold: path.join(__dirname, "..", "assets", "fonts", "Arial-Unicode-Bold.ttf"),
        italics: path.join(__dirname, "..", "assets", "fonts", "ARIALUNI.TTF"),
        bolditalics: path.join(__dirname, "..", "assets", "fonts", "Arial-Unicode-Bold.ttf"),
    },
};
const printer = new PdfPrinter(fonts);
const pageWidth = 612; //PT // from lib: 595.28
const pageHeight = 841.89; //PT
const pageLeftRightMargin = 65;
const pageLeftRightMarginForNarrowMargin = 30;
const pageTopBottomMargin = 60;
exports.getPageDimensions = () => ({
    pageWidth,
    pageHeight,
    pageLeftRightMargin,
    pageTopBottomMargin,
});

exports.createdPDF = async function (res, contents = [], pageOrientation = "portrait", userNarrowWidth = false) {
    return new Promise((resolve, reason) => {
        var docDefinition = getDocDefination(pageOrientation, userNarrowWidth);
        docDefinition.content = contents;
        var pdfDoc = printer.createPdfKitDocument(docDefinition);
        pdfDoc.pipe(res);
        pdfDoc.on("end", () => resolve());
        pdfDoc.on("error", (error) => reason(error));
        pdfDoc.end();
    });
};
exports.getTitleHeader = function (
    headerText,
    periodFromTime,
    periodToTime,
    generatedOnTime,
    otherTitle = [],
    pageOrientation = "portrait",
    logo = undefined
) {
    return [
        ...(logo == undefined
            ? [
                  {
                      image: path.join(__dirname, "..", "assets", "teachkloud.png"),
                      width: 150,
                      alignment: "left",
                      margin: [-pageLeftRightMargin + 30, -pageTopBottomMargin + 30, 0, 0],
                  },
              ]
            : logo == 1
            ? []
            : [logo]),
        {text: (logo == 1 ? "" : "\n") + headerText, style: "header"},
        generatedOnTime ? {text: "Generated on " + generatedOnTime, style: "center"} : "",
        periodFromTime ? {text: "Period: " + periodFromTime + " to " + periodToTime, style: "center"} : "",
        ...otherTitle,
        {text: "\n\n"},
        {
            table: {
                headerRows: 1,
                widths: "100%",
                body: [[""]],
            },
            layout: {
                hLineWidth: function (i, node) {
                    return 0.4;
                },
                paddingLeft: function (i, node) {
                    return 0;
                },
                paddingRight: function (i, node) {
                    return 0;
                },
                paddingTop: function (i, node) {
                    return 0;
                },
                paddingBottom: function (i, node) {
                    return 0;
                },
            },
        },
        // {canvas: [ { type: 'line', x1: 0, y1: 0, x2: pageOrientation=="landscape"?pageHeight-(2*pageLeftRightMargin):pageWidth-(2*pageLeftRightMargin), y2: 0, lineWidth: 0.5 }]},
    ];
};
exports.getInvoiceTitleHeader = function (contentsBetweenLogoAndLine = []) {
    return [
        {
            image: path.join(__dirname, "..", "assets", "teachkloud.png"),
            width: 70,
            alignment: "right",
            margin: [0, -pageTopBottomMargin + 10, 0, 0],
        },
        {text: "\n"},
        ...contentsBetweenLogoAndLine,
        {
            table: {
                headerRows: 1,
                widths: "100%",
                body: [[""]],
            },
            layout: {
                hLineWidth: function (i, node) {
                    return 0.4;
                },
                paddingLeft: function (i, node) {
                    return 0;
                },
                paddingRight: function (i, node) {
                    return 0;
                },
                paddingTop: function (i, node) {
                    return 0;
                },
                paddingBottom: function (i, node) {
                    return 0;
                },
            },
        },
        // {canvas: [ { type: 'line', x1: 0, y1: 0, x2: pageWidth-(2*pageLeftRightMarginForNarrowMargin)-17, y2: 0, lineWidth: 0.5 }]}
    ];
};
exports.getCenterTableFormat = function (defaultBorder = false, topMargin = 10) {
    return {
        table: {
            body: [[]],
        },
        layout: {
            defaultBorder: defaultBorder,
        },
        margin: [0, topMargin, 0, 0],
    };
};
exports.getImageFitValueFromTableColumns = function (column) {
    if (column == 0) return pageWidth;
    let val = (pageWidth - 2 * pageLeftRightMargin - 60) / column;
    return {width: val, height: val};
};
function getDocDefination(pageOrientation, userNarrowWidth = false) {
    let pageOrientationVar = "portrait";
    if (pageOrientation == "landscape") {
        pageOrientationVar = "landscape";
    }

    return {
        pageSize: "A4",
        pageOrientation: pageOrientationVar,
        content: [],
        defaultStyle: {
            font: "ProximaNova",
        },
        styles: {
            header: {
                fontSize: 18,
                bold: true,
                alignment: "center",
                color: "#0b5394",
            },
            headerLightBlack: {
                fontSize: 18,
                bold: true,
                font: "Semibold",
                alignment: "center",
                color: "#555555",
            },
            headerLeft: {
                fontSize: 14,
                font: "Semibold",
                color: "#0b5394",
                bold: true,
                margin: [0, 6, 0, 3],
            },
            headerLeftGreen: {
                fontSize: 12,
                font: "Semibold",
                color: "#0fa05b",
                bold: true,
                margin: [0, 6, 0, 3],
            },
            contentGreen: {
                fontSize: 12,
                font: "Semibold",
                bold: true,
                color: "#0fa05b",
            },
            contentRed: {
                fontSize: 12,
                font: "Semibold",
                bold: true,
                color: "#cc0000",
            },
            headerblack: {
                fontSize: 12,
                font: "Semibold",
                bold: true,
            },
            headerBlackMargin: {
                fontSize: 12,
                font: "Semibold",
                bold: true,
                margin: [1, 3, 1, 3],
            },
            headerBlackCenterSmall: {
                fontSize: 7,
                font: "Semibold",
                bold: true,
                alignment: "center",
                margin: [0, 5, 0, 5],
            },
            centerSmall: {
                fontSize: 7,
                alignment: "center",
                margin: [0, 5, 0, 5],
            },
            childName: {
                fontSize: 16,
                bold: true,
                color: "#555555",
            },
            contentblack: {
                fontSize: 12,
                color: "#000000",
            },
            contentBlackMargin: {
                fontSize: 12,
                color: "#000000",
                margin: [1, 3, 1, 3],
            },
            contentLightBlack: {
                fontSize: 11,
                bold: true,
                font: "Semibold",
                color: "#555555",
            },
            contentLightBlackNormal: {
                fontSize: 11,
                // bold:true,
                // font: 'Semibold',
                // color: '#555555'
            },
            center: {
                alignment: "center",
                margin: [0, 5, 0, 0],
            },
            line: {
                alignment: "center",
                margin: [0, 15, 0, 0],
            },
        },
        pageMargins: [
            userNarrowWidth ? pageLeftRightMarginForNarrowMargin : pageLeftRightMargin,
            pageTopBottomMargin,
            userNarrowWidth ? pageLeftRightMarginForNarrowMargin : pageLeftRightMargin,
            pageTopBottomMargin,
        ],
    };
}
exports.getHeader = function (headerText) {
    return {text: "\n\n" + headerText, style: "headerLeft"};
};
exports.getHeaderGreen = function (headerText) {
    return {text: "\n\n" + headerText, style: "headerLeftGreen"};
};
exports.getContentGreen = function (contentText, forSymbol = false) {
    if (forSymbol) {
        return {text: contentText, style: "contentGreen", font: "FontSymbols"};
    }
    return {text: contentText, style: "contentGreen"};
};
exports.getContentRed = function (contentText, forSymbol = false) {
    if (forSymbol) {
        return {text: contentText, style: "contentRed", font: "FontSymbols"};
    }
    return {text: contentText, style: "contentRed"};
};
exports.getKeyValuePair = function (keyValueObject) {
    let contents = [];
    for (a in keyValueObject) {
        contents.push({
            text: [
                {text: a + " ", style: "headerblack"},
                {text: keyValueObject[a], style: "contentblack"},
            ],
        });
        contents.push({text: "", margin: [0, 2, 0, 0]});
    }
    return contents;
};
exports.formatKeyValue = function (key, val) {
    return {
        text: [
            {text: key + " ", style: "headerblack"},
            {text: val, style: "contentblack"},
        ],
    };
};
