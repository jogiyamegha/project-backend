const {Polly,defaultBucket}=require('./metadata')

//Usage:
    // convertAndSaveAudio('Hello',Folders.AffirmationAudio+"/record_")
    // convertAndSaveAudio('Hello',Folders.AffirmationAudio+"/user_resp")
    // convertAndSaveAudio('Hello',Folders.AffirmationAudio+"/admin_resp")

exports.createAndSaveAudio=async (text='',s3FileLocationWithPrefixOfFileName="")=>{//example: text='Hello', s3FileLocationWithPrefixOfFileName='audio/abc' => output => audio/abc.auto_generated_file_name.mp3
    if(s3FileLocationWithPrefixOfFileName && text){
        try{
            var p=await Polly.startSpeechSynthesisTask({
                OutputFormat: "mp3",
                OutputS3BucketName: defaultBucket,
                Text: text,
                TextType: "text",
                VoiceId: "Joanna",
                SampleRate: "22050",
                OutputS3KeyPrefix:s3FileLocationWithPrefixOfFileName
            }).promise()
            let filePath=p.SynthesisTask.OutputUri
            return filePath.substring(filePath.indexOf(s3FileLocationWithPrefixOfFileName),filePath.length)
        }catch(e){
            printError(e)
        }
    }
}
const printError=(err)=>{
    console.log(err)
}