const express = require("express");
const DBController = require("./db/mongoose");
// const S3 = require("./storage/cms"); //use storage if not S3
const path = require("path"); //to show upload folder
const cors = require("cors");
const app = express();
const cron = require("node-cron");
const Util = require("./utils/util");
const CronController = require("./schedulers/CronController");
// const EmailUtil = require("./utils/EmailUtil");

app.use(cors());
app.use(express.urlencoded({extended: false, limit: "5gb", parameterLimit: 50000})); // To parse application/json
app.use(
    express.json({
        limit: "5gb",
    })
); // To parse application/x-www-form-urlencoded
app.use(require("./routes/adminRoutes"));
app.use(require('./routes/userRoutes'));
// app.use(require('./routes/investorRoutes'));

app.use("/uploads", express.static(path.join(__dirname, "../uploads"))); //to show image
app.use("/static_files", express.static(path.join(__dirname, "../static_files"))); //to show csv files

app.get("/", (req, res) => {
    // Require for Load Balancer - AWS
    res.sendStatus(200);
});
app.get("/robots.txt", function (req, res) {
    res.type("text/plain");
    res.send("User-agent: *\nDisallow: /");
});

DBController.initConnection(async () => {
    const httpServer = require("http").createServer(app);
    httpServer.listen(process.env.PORT, async function () {
        console.log("Server is running on", Util.getBaseURL());
        //This is used to find app usage time of every students
        // cron.schedule(
        //     "55 23 * * *",
        //     async () => {
        //         await CronController.studentAppUsage();
        //         await CronController.WeeklyAnalytics();
        //     },
        //     {
        //         scheduled: true,
        //         timezone: "Asia/Kolkata",
        //     }
        // );
    });
});
