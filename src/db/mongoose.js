const mongoose = require("mongoose");
mongoose.connection.on("connected", () => {
    console.log("Database Connection Established");
});
mongoose.connection.on("reconnected", () => {
    console.log("Database Connection Reestablished");
});
mongoose.connection.on("disconnected", () => {
    console.log("Database Connection Disconnected");
});
mongoose.connection.on("close", () => {
    console.log("Database Connection Closed");
});
mongoose.connection.on("error", (error) => {
    console.log("Database ERROR: " + error);
});

class MongoUtil {
    static newObjectId() {
        return new mongoose.Types.ObjectId();
    }

    static toObjectId(stringId) {
        return new mongoose.Types.ObjectId(stringId);
    }

    static isValidObjectID(id) {
        return mongoose.isValidObjectId(id);
    }
}

const initConnection = (callback) => {
    let options = {};
    if (process.env.isProduction == true || process.env.isProduction == "true") {
        // options = {
        //     useNewUrlParser: true,
        //     keepAlive: true,
        //     autoIndex: false, // Don't build indexes
        //     maxPoolSize: 10, // Maintain up to 10 socket connections
        //     serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        //     socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        //     authSource: "admin",
        //     user: "admin",
        //     pass: "admin456",
        // }
    }
    mongoose.connect(process.env.DB_URL);
    // mongoose.set("debug", true);
    var db = mongoose.connection;
    db.once("open", function () {
        callback();
    });
};
module.exports = {
    initConnection,
    mongoose,
    MongoUtil,
};
