import React, { useState, useEffect } from 'react';
import * as Office from '@microsoft/office-js';

const EmailProcessor = () => {
  const [emailContent, setEmailContent] = useState({});
  const [processedData, setProcessedData] = useState([]);
  const [copyText, setCopyText] = useState('');

  useEffect(() => {
    Office.initialize = () => {
      // Initialize Office API
    };
  }, []);

  const getEmailContent = async () => {
    try {
      const item = Office.context.mailbox.item;
      const subject = item.subject;
      const body = await item.body.getAsync(Office.CoercionType.Text);
      const bodySplit = body.value.split('****');
      const draft = bodySplit[0].trim();
      const thread = bodySplit[1] ? bodySplit[1].replace('****', '').trim() : '';
      const emailData = {
        subject,
        draft,
        thread,
      };
      setEmailContent(emailData);
    } catch (error) {
      console.error('Error retrieving email content', error);
    }
  };

  const sendToOpenAI = async () => {
    try {
      const apiKey = process.env.REACT_APP_OPENAPI_KEY;
      const apiUrl = 'https://api.openai.com/v1/chat/completions';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          "model": "gpt-4-32k",
          "temperature": 0.5,
          "messages": [
            {
                "role": "system",
                "content": `
                    You are an AI assistant specializing in generating clean, professional email drafts.
                    You will receive input from your user in the following format:

                    {
                        \"subject\": \"Email Subject\",
                        \"draft\": \"User's Draft\",
                        \"thread\": \"Email Thread\"
                    }

                    The <User's Draft> may be in the form of a bulleted list of short responses or a full draft of a response.
                    The <Email Thread> may be empty; if so, the <User's Draft> is a new email, not responding to an <Email Thread>.

                    Apply the following cleaning tasks to ONLY the <User's Draft> input:
                    1. Evaluate whether the <User's Draft> responds adequately to all points in the <Email Thread>.
                      a. Pay closest attention to the most recent ('top') email in the <Email Thread>;
                      b. Do NOT respond to historical emails prior to the most recent.
                      c. IGNORE this instruction if the <Email Thread> is empty.
                    2. Evaluate the <User's Draft> for word choice, grammar, tonality, and \"framing\".
                      a. \"Framing\" will mean any other general considerations related to professional email convention.
                    3. Look for any instances of text like \"(gpt: I don't know the capital of Missouri)\"; remove them
                      a. Replace such instances with an appropriate answer if you know it (e.g. "The capital of Missouri is Jefferson City.")
                      b. If you do not have an appropriate answer, simply remove the reference without further action.
                    4. Conceive of a professionaly drafted, complete email, incorporating all of <User's Draft>'s substantive points.
                      a. Your response should be written in full-sentence prose, in paragraph form, and should AVOID using a bulleted list format.
                    5. Return ONLY a JSON object with the following format:
                    {
                        \"responsiveness\": [\"list of responsiveness errors\"],
                        \"tone\": [\"list of tonality suggestions\"],
                        \"wordchoice\": [\"list of word choice and grammar errors\"],
                        \"framing\": [\"list of framing changes\"],
                        \"replacements\": [\"list of instances of (gpt: request for assistance) you replaced, and whether you knew or not\"],
                        \"draft\": \"your draft - please include newlines as appropriate - do not send it as one line\"
                    }
                    SAY NOTHING ELSE. NOT A SINGLE WORD.

                    Begin now by requesting the expected inputs in the prescribed format:

                `
            },
            {
                "role": "assistant",
                "content": `
                    Please provide me with the Email Subject, your draft, and the Email Thread you'd like me to review.
                    Please use the following format:
                    {
                        \"subject\": \"Email Subject\",
                        \"draft\": \"User's Draft\",
                        \"thread\": \"Email Thread\"
                    }
                `
            },
            {
                "role": "user",
                "content": JSON.stringify(emailContent)
            }
          ]
        }),
      });

      if (response.ok) {
        const data = await response.json();
        processResponse(data);
      } else {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending data to OpenAI API', error);
    }
  };

  const processResponse = (data) => {
    const processed = data.choices[0].text.trim();
    const parsedData = JSON.parse(processed);
  
    setProcessedData(parsedData);
    setCopyText(parsedData.draft);
  };
  

  return (
    <div>
      <h3>Process Email Content</h3>
      <p>
        Welcome to DraftCraftAI. This tool is in Beta.
        Click below to begin.
      </p>
      <button onClick={async () => { await getEmailContent(); sendToOpenAI(); }}>
        Clarify
      </button>


      <h3>Processed Data</h3>
      {Object.keys(processedData).map((key, index) => {
          if (key !== 'draft') {
              return (
              <div key={index}>
                  <h4>{key}</h4>
                  <ul>
                  {processedData[key].map((item, i) => (
                      <li key={i}>{item}</li>
                  ))}
                  </ul>
              </div>
              );
          }
          return null;
      })}

      <h3>Copy Text</h3>
      <textarea
        value={copyText}
        readOnly
        style={{ width: '100%', minHeight: '100px' }}
      />
    </div>
  );
};

export default EmailProcessor;
