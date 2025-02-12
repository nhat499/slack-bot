import Elysia from "elysia";
import { env } from "../../env.config";
import crypto from "crypto";
import axios from "axios";

export const vTest = new Elysia().group("/vtest", (app) => {
  app.post("/example", async ({ body, headers }) => {
    // console.log(body);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    // Correctly access raw body from request
    const rawBody = JSON.stringify(body); // Raw body

    // Create the base string: v0:<timestamp>:<rawBody>
    const baseString = `v0:${timestamp}:${rawBody}`;

    // Calculate the signature
    const signature = `v0=${crypto
      .createHmac("sha256", env.SLACK_SIGNING_SECRET)
      .update(baseString)
      .digest("hex")}`;

    try {
      const result = await axios.post(
        "https://r5g48530-5020.usw2.devtunnels.ms/slack/events",
        body,
        {
          headers: {
            "X-Slack-Request-Timestamp": timestamp,
            "X-Slack-Signature": signature,
          },
        }
      );
      console.log("I am axios result:", result.data);
      return { data: result.data };
    } catch (error) {
      console.error("Error in axios request:", error);
      return { error: error.message };
    }
  });

  return app;
});
