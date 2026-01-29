const Handlebars = require("handlebars");
const {GeneralMessages} = require("../utils/constants");
const path = require("path");
const fs = require("fs");
const customViewsDirPath = path.join(__dirname, "../templates");
const nodemailer = require("nodemailer");

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

exports.sendCollegeInvitationEmail = async (name, emailId, password) => {
    const invitationTemplate = fs
    .readFileSync(path.join(customViewsDirPath, "college", "college_invitation.hbs"))
    .toString();
    let data = {
        name: name,
        password: password,
        email: emailId,
    };
    const template = Handlebars.compile(invitationTemplate);
    try {
        await sendEmail(emailId, GeneralMessages.invitationEmailSubject, template(data));
    } catch (e) {
        console.log(e);
    }
};

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

async function sendEmail(receiverEmail, subject, htmlBodyContents, fromAddress = "Samran") {
    let transporter = getTransportInfo();
    let mailOptions = {
        from: fromAddress,
        to: receiverEmail,
        subject: subject,
        html: htmlBodyContents,
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
