const {TableFields} = require("../utils/constants");
const Util = require("../utils/util");

/**
 * ----------------------------------------------------
 * Cron Job Functions
 * ----------------------------------------------------
 */

/**
 * https://crontab.guru/#*_*_*_*_*
 */

/**
 * Create daily logs for all active students who have not been deleted.
 */

exports.studentAppUsage = async () => {
    const listColleges = await CollegeService.listColleges().withId().execute();
    const collegeRecords = listColleges.records;
    if (!collegeRecords.length) return;

    let todayDateTime = new Date();
    todayDateTime.setDate(todayDateTime.getDate() + 1);

    for (let i = 0; i < collegeRecords.length; i++) {
        const collegeId = collegeRecords[i][TableFields.ID];
        const students = await StudentService.listStudents({reference: collegeId}).withName().execute();

        const studentsRecords = students.records;
        if (!studentsRecords.length) continue;

        for (let i = 0; i < studentsRecords.length; i++) {
            const studentId = studentsRecords[i][TableFields.ID];
            await AppUsageService.calculateTotalHours(studentId, collegeId);
        }
    }
};

exports.WeeklyAnalytics = async () => {
    const listColleges = await CollegeService.listColleges().withId().execute();
    const collegeRecords = listColleges.records;
    if (!collegeRecords.length) return;
    let todayDateTime = new Date();
    let fromDate = new Date(todayDateTime);
    fromDate.setHours(0, 0, 0, 0);
    let toDate = new Date(todayDateTime);
    toDate.setHours(23, 59, 59, 999);
    let todayDate = Util.removeTime(new Date());

    for (let i = 0; i < collegeRecords.length; i++) {
        const collegeId = collegeRecords[i][TableFields.ID];
        const students = await StudentService.listStudents({reference: collegeId})
        .withUniqueId()
        .withId()
        .withGraduationYear()
        .withDeleted()
        .withName()
        .execute();

        const studentsRecords = students.records;
        if (!studentsRecords.length) continue;

        for (let i = 0; i < studentsRecords.length; i++) {
            const studentId = studentsRecords[i][TableFields.ID];
            const graduationYear = studentsRecords[i][TableFields.graduationYear];
            const uniqueId = studentsRecords[i][TableFields.uniqueId];
            const isDelete = studentsRecords[i][TableFields.deleted];

            const loggedCase = await CaseService.cronCaseLisner(studentId, collegeId, fromDate, toDate);
            const loggedCaseTotalScore = await CaseService.cronCaseLisnerForScore(
                studentId,
                collegeId,
                fromDate,
                toDate
            );

            const flashAssesment = await FlashService.cronFlashLisner(studentId, collegeId, fromDate, toDate);
            const flashTotalScore = await FlashService.cronFlashLisnerForScore(studentId, collegeId, fromDate, toDate);

            if (loggedCase.length === 0 && flashAssesment.length === 0) {
                continue;
            }
            const dataToInsert = {
                [TableFields.studentDetails]: {
                    [TableFields.reference]: studentId,
                    [TableFields.graduationYear]: graduationYear,
                    [TableFields.uniqueId]: uniqueId,
                    [TableFields.deleted]: isDelete,
                },
                [TableFields.collegeReference]: collegeId,
                [TableFields.totalLoggedCases]: loggedCase.length > 0 ? loggedCase[0].totalLoggedCases : 0,
                [TableFields.totalFlashCards]: flashAssesment.length > 0 ? flashAssesment[0].totalFlashCards : 0,
                [TableFields.flashCardTotalScore]: flashTotalScore ? flashTotalScore : 0,
                [TableFields.loggedCaseTotalScore]: loggedCaseTotalScore ? loggedCaseTotalScore : 0,
                [TableFields.date]: todayDate,
            };
            try {
                await WeeklyAnalyticsService.insertData(dataToInsert);
            } catch (error) {
                console.error(`Error inserting data for student ${studentId}:`, error);
            }
        }
    }
};
