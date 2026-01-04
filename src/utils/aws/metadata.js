const AWS = require('aws-sdk');
AWS.config.update({region:process.env.AWS_REGION});

const Folders = (function () {
    function Folders() {}
    Folders.UserImages="users"
    Folders.AffirmationAudio="affirmation/audio"
    return Folders;
}())

const DefaultFiles = (function () {
    function DefaultFiles() {}
    DefaultFiles.UserImg="default/images/user.png"
    return DefaultFiles;
}())

const S3=new AWS.S3()
const Lambda=new AWS.Lambda()
const Polly=new AWS.Polly()
const TranscribeService=new AWS.TranscribeService()
const defaultS3Bucket=process.env.S3_BUCKET_NAME

module.exports={
    defaultBucket: defaultS3Bucket,
    S3,
    Folders,
    DefaultFiles,
    Lambda,
    Polly,
    TranscribeService
}