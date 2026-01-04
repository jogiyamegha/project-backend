const axios = require('axios');
const moment = require('moment');
const send = async (resp) => {
  axios
    .post(process.env.MS_TEAMS_WEBHOOK_URL, {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          contentUrl: null,
          content: {
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            body: [
              {
                type: 'TextBlock',
                text: `**Error Message:** ${resp}`,
                wrap: true,
              },
              {
                type: 'TextBlock',
                text: `**Timestamp (UTC):** ${moment
                  .utc()
                  .format('DD/MM/YYYY HH:mm:ss')}`,
                wrap: true,
              },
              {
                type: 'TextBlock',
                text: `**Timestamp (Local):** ${moment().format(
                  'DD/MM/YYYY HH:mm:ss'
                )}`,
                wrap: true,
              },
            ],
          },
        },
      ],
    })
    .then((res) => {
      // console.log(`statusCode: ${res.status}`)
      // console.log(res)
    })
    .catch((error) => {
      // console.error(error)
    });
};
module.exports = { send };
