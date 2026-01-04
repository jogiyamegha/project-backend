const {
    TranscribeService,
    defaultBucket
} = require('./metadata')

// Usage:
// convertAndSaveText('https://divineyou-dev.s3.ap-south-1.amazonaws.com/audio/affirmation.5a16eb94-7a96-43ab-9663-774037dc2d54.mp3','audio/affirmation.5a16eb94-7a96-43ab-9663-774037dc2d54_text.txt')

exports.convertAndSaveText = async (audioFileS3URL = "", textFileS3Key = "") => {
    if (audioFileS3URL && textFileS3Key) {
        try {
            await TranscribeService.startTranscriptionJob({
                TranscriptionJobName: "divine_you_" + new Date().getTime(),
                LanguageCode: "en-US",
                MediaFormat: "mp3",
                Media: {
                    MediaFileUri: audioFileS3URL,
                },
                OutputBucketName: defaultBucket,
                OutputKey: textFileS3Key,
            }).promise()
        } catch (e) {
            printError(e)
        }
    }
}
const printError = (err) => {
    console.log(err)
}