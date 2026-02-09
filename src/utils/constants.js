const UserTypes = (function () {
    function UserTypes() { }
    UserTypes.Admin = 1;
    UserTypes.Investor = 2;
    UserTypes.Consumer = 3;
    return UserTypes;
})();

const PropertyTypes = (function () {
    function PropertyTypes() { };
    PropertyTypes.HousingSociety = 1;
    PropertyTypes.ManufacturingUnit = 2;
    return PropertyTypes;
})();

const PlantStatus = (function () {
    function PlantStatus() { };
    PlantStatus.Submitted = 1;
    PlantStatus.Approved = 2;
    PlantStatus.Rejected = 3;

    return PlantStatus;
})();

const TransactionType = (function () {
    function TransactionType() { };
    TransactionType.BillPayment = 1;
    TransactionType.Return = 2;
    TransactionType.InvestoerReturn = 3;

    return TransactionType;
})();

const PaymentTypes = (function () {
    function PaymentTypes() { }
    PaymentTypes.ConsumerPayment = 1;
    PaymentTypes.InvestorPayment = 2;

    return PaymentTypes;
})();

const UserPaymentMethod = (function () {
    function UserPaymentMethod() { };
    UserPaymentMethod.Cash = 1;
    UserPaymentMethod.Online = 2;

    return UserPaymentMethod;
})();

const PaymentStatusTypes = (function () {
    function PaymentStatusTypes() { }
    PaymentStatusTypes.Pending = 1;
    PaymentStatusTypes.Processing = 2;
    PaymentStatusTypes.Completed = 3;
    PaymentStatusTypes.Failed = 4;
    PaymentStatusTypes.Refunded = 5;
    PaymentStatusTypes.Cancelled = 6;

    return PaymentStatusTypes;
})();

const TransactionStatus = (function () {
    function TransactionStatus() { };
    TransactionStatus.Pending = 1;
    TransactionStatus.Succssful = 2;
    TransactionStatus.Failed = 3;
    TransactionStatus.InProgress = 4;

    return TransactionStatus;
})();

const PayoutStatusTypes = (function () {
    function PayoutStatusTypes() { }
    PayoutStatusTypes.Pending = 1;
    PayoutStatusTypes.Processing = 2;
    PayoutStatusTypes.Completed = 3;
    PayoutStatusTypes.Failed = 4;
    PayoutStatusTypes.Cancelled = 5;

    return PayoutStatusTypes;
})();

const Months = (function Months() {
    function Months() { };
    Months.January = 1;
    Months.February = 2;
    Months.March = 3;
    Months.April = 4;
    Months.May = 5;
    Months.June = 6;
    Months.July = 7;
    Months.August = 8;
    Months.September = 9;
    Months.October = 10;
    Months.November = 11;
    Months.December = 12;

    return Months;
})()

const CmsTypes = (function () {
    function CmsTypes() { }
    CmsTypes.Aboutus = 1;
    CmsTypes.PrivacyPolicy = 2;
    CmsTypes.TermsConditions = 3;

    return CmsTypes;
})();

const RequiredFields = (function () {
    function RequiredFields() { }
    RequiredFields.degreeClass = "Degree Class";
    RequiredFields.grade = "Grade";
    RequiredFields.overallGrade = "OverallGrade";
    RequiredFields.averageScore = "Average Score";
    RequiredFields.uniqueId = "StudentID";
    RequiredFields.semester = "Semester";
    RequiredFields.name_ = "Name";
    RequiredFields.firstName = "FirstName";
    RequiredFields.lastName = "LastName";
    RequiredFields.email = "Email";
    RequiredFields.graduationYear = "GraduationYear";
    RequiredFields.specialty = "Specialty";
    RequiredFields.diagnosis = "Diagnosis";
    RequiredFields.questionType = "QuestionType";
    RequiredFields.question = "Question";
    RequiredFields.answer = "Answer";
    return RequiredFields;
})();

const Platforms = (function () {
    function Platforms() { }
    Platforms.Admin = 1;
    Platforms.Investor = 2;
    Platforms.Farmer = 3;
    Platforms.Android = 4;
    Platforms.iOS = 5;
    return Platforms;
})();

const FCMPlatformType = (function () {
    function type() { }
    type.Android = 1;
    type.iOS = 2;
    return type;
})();

const InterfaceTypes = (function () {
    function InterfaceType() { }
    InterfaceType.Admin = {
        AdminWeb: "i1",
    };
    InterfaceType.Investor = {
        InvestorWeb: "i2",
    };
    InterfaceType.Consumer = {
        ConsumerApp: "i3",
    };
    return InterfaceType;
})();

const ValidationMsgs = (function () {
    function ValidationMsgs() { }
    ValidationMsgs.InvalidAuthToken = "Invalid auth token.";
    ValidationMsgs.ParametersError = "Invalid parameters.";
    ValidationMsgs.RecordNotFound = "Record not found!";
    ValidationMsgs.AccountAlreadyExists = "Registration has already been completed.";
    ValidationMsgs.AccountNotRegistered = "Account not registered!";
    ValidationMsgs.PasswordEmpty = "Password required!";
    ValidationMsgs.EmailInvalid = "Email is invalid.";
    ValidationMsgs.PhoneInvalid = "Contact no is invalid.";
    ValidationMsgs.PasswordInvalid = "Password is invalid.";
    ValidationMsgs.AuthFail = "Please authenticate!";
    ValidationMsgs.UnableToLogin = "Incorrect email and/or password.";
    ValidationMsgs.approvedFalse = "Your account is currently inactive. Please contact an administrator .";
    ValidationMsgs.investorIsDeleted = "We apologize, but we are unable to log you in as you have been removed by the admin.";
    ValidationMsgs.UserTypeEmpty = "User type required!";
    ValidationMsgs.NameEmpty = "Name required!";
    ValidationMsgs.EmailEmpty = "Email required!";
    ValidationMsgs.PhoneEmpty = "Contact number cannot be blank!";
    ValidationMsgs.PhoneCountryEmpty = "Country code cannot be blank!";
    ValidationMsgs.DuplicateEmail = "This email address is already in use!";
    ValidationMsgs.NewPasswordEmpty = "New password required!";
    ValidationMsgs.PassResetCodeEmpty = "Password reset code required!";
    ValidationMsgs.DuplicatePhone = "This contact number is already in use!";
    ValidationMsgs.InvalidPassResetCode = "Password reset code is invalid!";
    ValidationMsgs.UnableToForgotPassword = "User not active, unable to reset password.";
    ValidationMsgs.OldPasswordIncorrect = "Entered old password is incorrect.";
    ValidationMsgs.UniqueIdExist = "Student already exists with this unique id";
    ValidationMsgs.incorrectImage = "Incorrect Image!";
    ValidationMsgs.incorrectPDF = "Incorrect PDF!";
    ValidationMsgs.incorrectVideo = "Incorrect Video!";
    ValidationMsgs.incorrectImageVideosOrPDF = "Incorrect Format Image/Video/PDF!";
    ValidationMsgs.UnderMaintenance = "Oops! The app is currently undergoing maintenance. Please try again later!";
    ValidationMsgs.ForceUpdate = "Whoops! Please update the app to continue using it";
    ValidationMsgs.InvestorInactive = "Whoops! Investor account is inactive";
    ValidationMsgs.DuplicateData = "Duplicate Data Insert Error";
    ValidationMsgs.BulkWriteError = "No valid operations found.";
    ValidationMsgs.NotAllowed = "Not-allowed";
    ValidationMsgs.TarrifEmpty = 'Tarrif is required!';
    ValidationMsgs.PlantCapacityEmpty = 'Plant Capacity required';
    ValidationMsgs.GeneratedUnitsEmpty = 'Generated Units required!'
    ValidationMsgs.ConsumedUnitsEmpty = 'Consumed Units required!';
    ValidationMsgs.ExportedUnitsEmpty = 'Exported Units required';
    ValidationMsgs.InvestmentAmountEmpty = 'Investment Amount required';
    ValidationMsgs.PropertyNameEmpty = 'Property Name required';
    ValidationMsgs.PropertyTypeEmpty = 'Property Type required';
    ValidationMsgs.AddressEmpty = 'Address required';
    ValidationMsgs.UserAddressEmpty = 'Please enter your Permenent address';
    ValidationMsgs.CityEmpty = 'City required';
    ValidationMsgs.UserCityEmpty = "Please enter your city";
    ValidationMsgs.StateEmpty = 'State required';
    ValidationMsgs.PincodeEmpty = 'Pincode required';
    ValidationMsgs.UserPincodeEmpty = "Please enter your city's Pincode";
    ValidationMsgs.PpaNameEmpty = 'Ppa Name required';
    ValidationMsgs.BillImageEmpty = 'Bill required';
    ValidationMsgs.BillAmountEmpty = 'BillAmount required';
    ValidationMsgs.ExpectedYearsEmpty = 'Expected Years required';
    ValidationMsgs.StartDateEmpty = 'StartDate required';
    ValidationMsgs.PpaDocumentEmpty = 'PpaDocument required';
    ValidationMsgs.LeaseDocumentEmpty = 'LeaseDocument required';
    ValidationMsgs.UserIdEmpty = 'UserId required';
    ValidationMsgs.PlantExists = 'Plant already Exists';
    ValidationMsgs.RecordNotExists = 'Record Not Exists!';
    ValidationMsgs.PpaExists = 'Ppa Exists';
    ValidationMsgs.FileEmpty = "Please upload a file.";
    ValidationMsgs.PlantNotApproveToCreatePpa = 'Plant is Not Approved yet To Create Ppa, please check & approve first!'
    ValidationMsgs.PlantIdEmpty = 'Plant Id required';
    ValidationMsgs.PpaAlreadyCreatedForPlant = 'Ppa Already is created for this plant';
    ValidationMsgs.PpaIdEmpty = 'PpaId required';
    ValidationMsgs.BillingMonthEmpty = 'Billing month required'
    ValidationMsgs.BillingYearEmpty = 'Billing year required';
    ValidationMsgs.BillAlreadyGeneratedForMonthPpa = "Bill of this month is already generated for this PPA";
    ValidationMsgs.PlantUniqueNameEmpty = "Please enter Plant's Unique Name to approve";
    ValidationMsgs.InvalidPlantUniqueName = 'Please enter a valid Plant Unique Name, it allows only characters and numbers';
    ValidationMsgs.PpaNotSigned = 'PPA is not signed yet...'
    ValidationMsgs.ConsumerStripeAccountEmpty = "Customer Stripe account not found";
    ValidationMsgs.PaymentIntentIdEmpty = "Payment intent ID is required";
    return ValidationMsgs;
})();

const ResponseMessages = (function () {
    function ResponseMessages() { }
    ResponseMessages.Ok = "Ok";
    ResponseMessages.NotFound = "Data not found!";
    ResponseMessages.signInSuccess = "Sign In successfully!";
    ResponseMessages.signOutSuccess = "Sign Out successfully!";
    return ResponseMessages;
})();

const GeneralMessages = (function () {
    function GeneralMessages() { }
    GeneralMessages.forgotPasswordEmailSubject = "Reset your password";
    GeneralMessages.invitationEmailSubject = "Your OnWard Education Account is Ready!";
    GeneralMessages.PlantInfo = "Plant Added";
    return GeneralMessages;
})();

const TableNames = (function () {
    function TableNames() { }
    TableNames.Admin = "admins";
    TableNames.Bill = 'bills';
    TableNames.Cms = "cms";
    TableNames.Counter = 'counter';
    TableNames.Investment = 'investments';
    TableNames.InvestorReturn = 'irnvestoreturns';
    TableNames.Plant = 'plants';
    TableNames.Ppa = 'ppas';
    TableNames.User = 'users';
    TableNames.Payment = 'payments';
    TableNames.Payout = 'payouts';
    TableNames.Wallet = 'wallets';
    TableNames.WalletTransaction = 'wallettransactions'
    return TableNames;
})();

const AuthTypes = (function () {
    function types() { }
    types.Admin = 1;
    types.Investor = 2;
    types.Consumer = 3;
    return types;
})();

const InquiryTypes = (function () {
    function types() { }
    types.investor = "investor";
    types.farmer = "farmer";
    types.investorGuest = "investorGuest";
    types.farmerGuest = "farmerGuest";
    return types;
})();

const CounterSchemaType = (function () {
    function types() { }
    types.Plant = "ct1"; //ct=counter type
    types.Ppa = "ct2"; //ct=counter type
    return types;
})();

const TableFields = (function () {
    function TableFields() { }
    TableFields.ID = "_id";
    TableFields.userId = "userId";
    TableFields.name_ = "name";
    TableFields.userType = "userType";
    TableFields.stripeCustomerId = "stripeCustomerId";
    TableFields.phoneCountry = "phoneCountry";
    TableFields.phone = "phone";
    TableFields.platform = "platform";
    TableFields.passwordResetToken = "passwordResetToken";
    TableFields.fcmTokens = "fcmTokens";
    TableFields.token = "token";
    TableFields.email = "email";
    TableFields.password = "password";
    TableFields.tokens = "tokens";
    TableFields.interface = "interface";
    TableFields.isActive = "isActive";
    TableFields.deleted = "deleted";
    TableFields.userDeleted = "userDeleted";
    TableFields.plantDeleted = "plantDeleted";
    TableFields.ppaDeleted = "ppaDeleted";
    TableFields.ppaDetail = 'ppaDetail';
    TableFields.profilePicture = 'profilePicture';
    TableFields.ppaUniqueId = 'ppaUniqueId';
    TableFields.ppaName = 'ppaName';
    TableFields.ppaId = 'ppaId';
    TableFields.plantId = 'plantId';
    TableFields.tarrif = "tarrif";
    TableFields.plantCapacity = "plantCapacity";
    TableFields.billingMonth = "billingMonth";
    TableFields.billingYear = "billingYear";
    TableFields.generatedUnits = "generatedUnits";
    TableFields.consumedUnits = 'consumedUnits';
    TableFields.exportedUnits = 'exportedUnits';
    TableFields.totalAmount = 'totalAmount';
    TableFields.isPaid = 'isPaid';
    TableFields.userPaymentMethod = 'userPaymentMethod';
    TableFields.paymentRefId = 'paymentRefId';
    TableFields.paymentDate = 'paymentDate';
    TableFields.paymentIntentId = 'paymentIntentId';
    TableFields.paymentMethodId = 'paymentMethodId';
    TableFields.paymentMethodTypes = 'paymentMethodTypes';
    TableFields.paymentReleased = 'paymentReleased';
    TableFields.paymentReleasedAt = 'paymentReleasedAt';
    TableFields.paymentReceived = 'paymentReceived';
    TableFields.paymentReceivedAt = 'paymentReceivedAt';
    TableFields.type = 'type';
    TableFields.investorDetails = 'investorDetails';
    TableFields.investorId = 'investorId';
    TableFields.investmentAmount = 'investmentAmount';
    TableFields.plantCapacityReserved = 'plantCapacityReserved';
    TableFields.investmentPercent = 'investmentPercent';
    TableFields.investmentDetail = 'investmentDetail';
    TableFields.investmentId = 'investmentId';
    TableFields.billDetail = 'billDetail';
    TableFields.billId = 'billId';
    TableFields.returnAmount = 'returnAmount';
    TableFields.plantUniqueName = 'plantUniqueName';
    TableFields.userDetails = 'userDetails';
    TableFields.propertyAddress = 'propertyAddress';
    TableFields.propertyName = 'propertyName';
    TableFields.propertyType = 'propertyType';
    TableFields.address = 'address';
    TableFields.city = 'city';
    TableFields.state = 'state';
    TableFields.pincode = 'pincode';
    TableFields.roofArea = 'roofArea';
    TableFields.billAmount = 'billAmount';
    TableFields.billImage = 'billImage';
    TableFields.electricityRate = 'electricityRate';
    TableFields.plantStatus = 'plantStatus';
    TableFields.approvedBy = 'approvedBy';
    TableFields.approvedOn = 'approvedOn';
    TableFields.rejectedBy = 'rejectedBy';
    TableFields.rejectedOn = 'rejectedOn';
    TableFields.rejectionReason = 'rejectionReason';
    TableFields.plantDetail = 'plantDetail';
    TableFields.expectedYears = 'expectedYears';
    TableFields.endDate = 'endDate';
    TableFields.startDate = 'startDate';
    TableFields.ppaDocument = 'ppaDocument';
    TableFields.leaseDocument = 'leaseDocument';
    TableFields.isSigned = 'isSigned';
    TableFields.value = 'value';
    TableFields.plantUniqueId = "plantUniqueId";
    TableFields.signedAt = 'signedAt';
    TableFields.addressDetail = 'addressDetail';
    TableFields.balance = 'balance';
    TableFields.depositedAmount = 'depositedAmount';
    TableFields.withdrawalAmount = 'withdrawalAmount';
    TableFields.totalInvestedAmount = 'totalInvestedAmount';
    TableFields.totalReturn = 'totalReturn';
    TableFields.fromUserDetail = 'fromUserDetail';
    TableFields.walletId = 'walletId';
    TableFields.toUserDetail = 'toUserDetail';
    TableFields.transactionType = 'transactionType';
    TableFields.transactionAmount = 'transactionAmount';
    TableFields.transactionId = 'transactionId';
    TableFields.transactionStatus = 'transactionStatus';
    TableFields.bankReferenceId = 'bankReferenceId';
    TableFields.note = 'note';
    TableFields.billReference = 'billReference';
    TableFields.userReference = 'userReference';
    TableFields.paymentType = 'paymentType';
    TableFields.amount = 'amount';
    TableFields.currency = 'currency';
    TableFields.payoutStatus = 'payoutStatus';
    TableFields.stripePayoutId = 'stripePayoutId';
    TableFields.stripeAccountId = 'stripeAccountId';
    TableFields.payoutDate = 'payoutDate';
    TableFields.paymentStatus = 'paymentStatus';
    TableFields.stripeConsumerId = 'stripeConsumerId';
    TableFields.stripePaymentIntentId = 'stripePaymentIntentId';
    TableFields.stripePayoutId = 'stripePayoutId';
    TableFields.paymentMethod = 'paymentMethod';
    TableFields.paymentDate = 'paymentDate';
    TableFields.failureReason = 'failureReason';
    TableFields.metadata = 'metadata';
    TableFields.stripeTransferId = 'stripeTransferId';
    TableFields.stripePaymentIntentId = 'stripePaymentIntentId';
    TableFields.processedAt = 'processedAt';
    TableFields.processedBy = 'processedBy';
    TableFields._createdAt = "createdAt";
    TableFields._updatedAt = "updatedAt";
    TableFields._deletedAt = "_deletedAt";
    TableFields.authType = "authType";
    TableFields.uniqueId = "uniqueId";
    TableFields.description = "description";
    TableFields.iOSVersion = "iOSVersion";
    TableFields.androidVersion = "androidVersion";
    TableFields.iOSUnderMaintenance = "iOSUnderMaintenance";
    TableFields.androidUnderMaintenance = "androidUnderMaintenance";
    TableFields.iOSForceUpdate = "iOSForceUpdate";
    TableFields.androidForceUpdate = "androidForceUpdate";
    TableFields.adminNote = "adminNote";
    return TableFields;
})();

const ResponseStatus = (function () {
    function ResponseStatus() { }
    ResponseStatus.Failed = 0;
    ResponseStatus.Success = 200;
    ResponseStatus.BadRequest = 400;
    ResponseStatus.Unauthorized = 401;
    ResponseStatus.NotFound = 404;
    ResponseStatus.UpgradeRequired = 426;
    ResponseStatus.AccountDeactivated = 3001;
    ResponseStatus.InternalServerError = 500;
    ResponseStatus.ServiceUnavailable = 503;
    return ResponseStatus;
})();
const DefaultConfigTypes = (function () {
    function types() { }
    types.studentAppSettings = "appSettings"; //default configuration type
    types.defaultCaseQuestions = "defaultQuestions";
    return types;
})();

const ApiResponseCode = (function () {
    function ApiResponseCode() { }
    ApiResponseCode.ClientOrServerError = 400;
    ApiResponseCode.ResponseSuccess = 200;
    ApiResponseCode.AuthError = 401;
    ApiResponseCode.UnderMaintenance = 503; //Service Unavailable
    ApiResponseCode.ForceUpdate = 409; //Version Control
    return ApiResponseCode;
})();

const ResponseFields = (function () {
    function ResponseFields() { }
    ResponseFields.status = "status";
    ResponseFields.message = "message";
    ResponseFields.result = "result";
    return ResponseFields;
})();

module.exports = {
    ValidationMsgs,
    TableNames,
    TableFields,
    ResponseStatus,
    ResponseFields,
    ResponseMessages,
    UserTypes,
    PropertyTypes,
    PlantStatus,
    TransactionType,
    PaymentTypes,
    UserPaymentMethod,
    PaymentStatusTypes,
    TransactionStatus,
    PayoutStatusTypes,
    Months,
    Platforms,
    InterfaceTypes,
    AuthTypes,
    FCMPlatformType,
    GeneralMessages,
    ApiResponseCode,
    DefaultConfigTypes,
    CounterSchemaType,
    CmsTypes,
    RequiredFields,
};
