const User=require('../../db/models/user')
const {
    TableFields
} = require('../constants')
const jwt = require('jsonwebtoken')
const admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.cert(require('./' + process.env.FCM_JSON_FILE_NAME))
});
exports.getFirebaseAdmin = () => admin
exports.sendNotification = async function (message, type, ...token) {
    if (token.length == 0) return
    return await triggerNotification.call(this, createObject(this[TableFields.metadata], message, type), token)
}
exports.sendNotificationWithTitle = async function (message, type, title, ...token) {
    if (token.length == 0) return
    return await triggerNotification.call(this, createObject(this[TableFields.metadata], message, type, title), token)
}
async function triggerNotification(messageObj, token = []) {
    if (token.length > 1) {
        token = token.filter(function (item, index, inputArray) {
            return inputArray.indexOf(item) == index;
        });
    }
    if (token.length == 1) {
        messageObj.token = token[0]
        try {
            let response = await admin.messaging().send(messageObj)
            console.log(response)
            if (this.needResponse) {
                return response
            }
        } catch (e) {
            let mErrorCode = e.code.toLocaleLowerCase()
            console.log(mErrorCode)
            if (mErrorCode == 'messaging/invalid-registration-token') {
                handleInvalidTokens(token[0])
            } else if (mErrorCode == 'messaging/registration-token-not-registered') {
                handleInvalidTokens(token[0])
            }
            // console.log(e);
            if (this.needResponse) {
                return JSON.stringify(e)
            }
        }
    } else if (token.length > 1) {
        messageObj.tokens = token
        try {
            let response = await admin.messaging().sendMulticast(messageObj)
            let invalidTokens = []
            response.responses.forEach((a, i) => {
                
                if (a.error) {
                    console.log(a.error)
                    let mErrorCode = a.error.code.toLocaleLowerCase()
                    if (mErrorCode == 'messaging/invalid-registration-token') {
                        invalidTokens.push(token[i])
                    } else if (mErrorCode == 'messaging/registration-token-not-registered') {
                        invalidTokens.push(token[i])
                    }
                }
            })
            console.log(response)
            handleInvalidTokens(...invalidTokens)
            if (this.needResponse) {
                return response
            }
        } catch (e) {
            // console.log(e);
            if (this.needResponse) {
                return JSON.stringify(e)
            }
        }
    }
}

function createObject(metadata, message, type, title = "Divine You") {
    let messageObj = {
        data: {
            type: type + "",
            ...(metadata ? JSON.parse(JSON.stringify(metadata)) : {})
        },
        "android": {
            "notification": {
                "sound": "default",
                "channelId": 'divineyou',
            }
        },
        "apns": {
            "payload": {
                "aps": {
                    "sound": "default"
                }
            }
        }
    }
    if (message) {
        messageObj.notification = {}
        messageObj.notification['title'] = title
        messageObj.notification['body'] = message
    }
    return messageObj
}
async function handleInvalidTokens(...tokens) { //TODO: manage invalida tokes later
    console.log(tokens)
    if(tokens.length>0){
        await User.updateMany({
            [TableFields.fcmTokens+"."+TableFields.token]: {$in: tokens}
        },{
            $pull: {
                [TableFields.fcmTokens]:{[TableFields.token]: {$in: tokens}}
            }
        })
    }
}