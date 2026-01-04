exports.NotificationKind = (function () {
    function K() {}
    K.addGratitude = {
        type: 1,
        message: "What are you grateful for today?",
        generate: function () {
            return {
                type: this.type,
                message: this.message
            }
        }
    }
    K.sendMotivation = {
        type: 2,
        generate: function (message) {
            return {
                type: this.type,
                message: message,
            }
        }
    }
    K.sendExpiredSubscriptionMotivation = {
        type: 3,
        generate: function (message) {
            return {
                type: this.type,
                message: message,
            }
        }
    }
    K.sendNotification = {
        type: 4,
        generate: function (message) {
            return {
                type: this.type,
                message: message,
            }
        }
    }
    return K;
}())