const Handlebars = require("handlebars");
const {GeneralMessages} = require("../utils/constants");
const path = require("path");
const fs = require("fs");
const customViewsDirPath = path.join(__dirname, "../templates");
const nodemailer = require("nodemailer");
const Util = require("../utils/util");

exports.sendForgotPasswordEmail = async (code, emailId, name) => {
    const resetPasswordTemplate = fs
    .readFileSync(path.join(customViewsDirPath, "user", "forgot_password.hbs"))
    .toString();
    let data = {
        code: code,
        name: name,
    };
    const template = Handlebars.compile(resetPasswordTemplate);
    try {
        await sendEmail(emailId, GeneralMessages.forgotPasswordEmailSubject, template(data));
    } catch (e) {
        console.log(e);
    }
};

exports.sentPlantForm = async (email, emailData, fileBuffer) => {
    const userPlantTemplate = fs
        .readFileSync(path.join(customViewsDirPath, "user", "plant.hbs"))
        .toString();
    const template = Handlebars.compile(userPlantTemplate);
    try {
        const date = Util.formatToDdMmYyyyWithTime()
        const attachments = [
            {
                filename: `User_Added_Plant_${date}.pdf`,
                content: fileBuffer,
                contentType: "application/pdf",
            }
        ]
        const data = { date, emailData }
        const subject = GeneralMessages.PlantInfo + " | " + date
        console.log("attachments",attachments);
        await sendEmail(email, subject, template(data), attachments);
    } catch (e) {
        console.log(e);
    }
}

exports.sendStudentInvitationEmail = async (name, emailId, code) => {
    const invitationTemplate = fs
    .readFileSync(path.join(customViewsDirPath, "student", "student_invitation.hbs"))
    .toString();
    let data = {
        name: name,
        code: code,
        email: emailId,
    };
    const template = Handlebars.compile(invitationTemplate);
    try {
        await sendEmail(emailId, GeneralMessages.invitationEmailSubjectStudent, template(data));
    } catch (e) {
        console.log(e);
    }
};

exports.sendCollegeResetCode = async (name, emailId, code) => {
    const resetPasswordTemplate = fs
    .readFileSync(path.join(customViewsDirPath, "college", "forgot_password.hbs"))
    .toString();
    let data = {
        name: name,
        code: code,
    };
    const template = Handlebars.compile(resetPasswordTemplate);
    try {
        await sendEmail(emailId, GeneralMessages.forgotPasswordEmailSubject, template(data));
    } catch (e) {
        console.log(e);
    }
};

function createHyperLinkTag(title, url) {
    return `<a href="${url}">${title}</a>`;
}

async function sendEmail(receiverEmail, subject, htmlBodyContents, attachments = [], fromAddress = "Samran") {
    let transporter = getTransportInfo();
    let mailOptions = {
        from: fromAddress,
        to: receiverEmail,
        subject: subject,
        html: htmlBodyContents,
        attachments: attachments,
    };
    // if (process.env.disableEmail == true || process.env.disableEmail == "true") {
    //     return;
    // }
    await transporter.sendMail(mailOptions);
}
function getTransportInfo() {
    return nodemailer.createTransport({
        host: process.env.SMTP_SERVER,
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER, //smtpUsername
            pass: process.env.SMTP_PASS, //smtpPassword
        },
    });
}
