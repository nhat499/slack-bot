import twilio, { twiml } from "twilio";
import { env } from "../../../env.config";

const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export const twilioCall = async (phone: string) => {
  const message = `Hello, this is a call from the cloud core alert system. 
  You have an alert that needs your attention. 
  Please check the slack channel for more information.`;
  const call = await client.calls.create({
    to: phone,
    from: env.TWILIO_PHONE_NUMBER,
    twiml: `<Response>
        <Say>${message}</Say>
        </Response>`,
    // can set call to check for the following
    // statusCallback:
    // "https://r5g48530-5000.usw2.devtunnels.ms/twilio/callCompleted",
    // statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
    statusCallbackMethod: "POST",
  });

  console.log("CALlID: ", call.sid);
  console.log("CALL:", call);
};
