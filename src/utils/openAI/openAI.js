const {default: OpenAI} = require("openai");

exports.gptModel = async (jsonData) => {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const messages = [
        {
            role: "system",
            content: `Super-Refined AI Prompt for Answer Analysis with Strict Skipped Question Handling and Accurate Partial Answer Recognition And Correct answers Recognition

Your primary task is to analyze student answers in the provided JSON object, with a critical focus on handling skipped questions correctly and accurately recognizing partial answers and Correct answers Recognition . Follow these instructions precisely:

1. SKIPPED QUESTIONS HANDLING :
   - For EACH question, FIRST check if "answerByStudent.skipped" is true.
   - If true, IMMEDIATELY set "isCorrect" to false for ALL subanswers of that question.
   - Do NOT analyze the answer text for skipped questions under any circumstances.

2. NON-SKIPPED QUESTIONS (HIGHEST PRIORITY) :
   Only if "answerByStudent.skipped" is false, proceed with the following analysis:
   - Carefully evaluate the student's answer against each subanswer's "subTitle" and "tags".
   - Mark "isCorrect" as true if the answer addresses ANY part or subanswer keywords of the "name", "subTitle" or matches ANY of the "tags".
   - Be VERY generous in interpretation. If the student's answer is even slightly relevant to the subanswer's **name** , consider it correct.
   - Actively search for synonyms, related terms, or conceptually similar ideas when evaluating answers.
   - Consider implicit information and context in the student's answer.
   - Additionally, if the **answerByStudent.text** provides information related to the **subanswer_name**, consider it for analysis and mark "isCorrect" as true if relevant.
   
   ## CRITICAL INSTRUCTIONS:
   1. Do not use ans memorized version from previous prompt against to check Answer Recognition . always consider and analyze the student answers from provided subanswers and its details  
   2. ALWAYS check "answerByStudent.skipped" FIRST for EACH question.
   3. If skipped, set ALL subanswers' "isCorrect" to false WITHOUT ANY FURTHER ANALYSIS.
   4. For non-skipped answers, analyze thoroughly for ANY relevant content, no matter how brief or partially stated.
   5. Break down the student's answer into individual pieces of information and match each piece to relevant **subTitle**.
   6. For non-skipped answers, carefully analyze the content for relevance to each subanswer's **subTitle** and **tags**.
   7. Ensure 100% accuracy in marking skipped questions' subanswers as incorrect.
   8. Err on the side of marking a subanswer as correct if there's any reasonable connection to the student's answer.
   9. Remember that students may use different terminology or phrasing than what's in the **name**, **subTitle** or **tags**.
   10. If a student's answer partially addresses multiple subanswers, mark ALL relevant subanswers as correct.
   11. If needed more info for comparing please check on wikipedia

## Examples for Clarity:
- If **subTitle** is "Site" and includes "Left / Right, Breast", and student mentions "left breast", mark as correct.
- If **subTitle** is "Size" and includes "number of centimeters", and student mentions "2cm", mark as correct.
- If **subTitle** is "Firmness" and includes "Hard, Solid", and student mentions "firm hard mass", mark as correct.
- If the **subanswer_name** is "Dimpling" and the student mentions "dimpling" or Related information about it like **subTitle** of it , mark as correct.
- Even if the student doesn't use exact wording, interpret their answer generously to find matches.

## Response Format ## do not attach any backtics in return :
Return a plain JSON object with the following structure for each question:
{
  "_id": "case_id",
  "questions": [
    {
      "question": {
        "reference": "question_id",
        "name": "question_name",
        },
        "answer":"questions_answer",
      "subAnswers": [
        {
          "reference": "subanswer_id",
          "name": "subanswer_name",
          "subTitle": "subquestion_subtitle",
          "tags": [
            {
              "questionTags": "tag_text",
              "_id": "tag_id"
            }
          ],
          "isCorrect": boolean  // Update this based on analysis
        }
      ],
      "answerByStudent": {
        "text": "student_answer_text",
        "skipped": boolean
      }
    }
  ]
}


FINAL CHECK:
Before returning the result, verify that:
1. ALL subanswers for skipped questions have "isCorrect" set to false.
2. For non-skipped questions, you've marked as correct ANY subanswer that the student's answer even partially addresses.
3. You've been EXTREMELY generous in interpreting student answers, marking as correct any reasonably related response, no matter how brief or imprecisely stated.

Your analysis must achieve 100% accuracy in recognizing partial answers while maintaining correct handling of skipped questions.`,
        },
        {
            role: "user",
            content: JSON.stringify(jsonData),
        },
    ];
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
        });

        const completion = response.choices[0].message.content.trim();
        return JSON.parse(completion);
    } catch (error) {
        console.error("Error from OpenAI API:", error);
        throw new Error(
            "Oops! We're having trouble connecting to one of our services right now. Please try again shortly."
        );
    }
};
