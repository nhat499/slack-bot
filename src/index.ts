import Elysia, { t } from "elysia";
import { sendBotMessage } from "./slack.service";
import { slackInfoSchema } from "./util/bot.request.schema";
import { handleError } from "./util/error.handlers";
import crypto from "crypto";
import swagger from "@elysiajs/swagger";
import { v1 } from "./v1";
import { bolt } from "./slack-bolt";
import { ReceiverEvent } from "@slack/bolt";
import { env } from "../env.config";
import axios from "axios";

const router = new Elysia().onError(handleError);

router.post(
  "/hc",
  async ({ body, headers }) => {
    console.log("hc");
    console.log(body);
    console.log(headers);
    await sendBotMessage(body, "healthy");
    return "ok";
  },
  {
    body: slackInfoSchema,
  }
);

router.post("/example", async ({ body, headers }) => {
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

// SOCKET MODE

// Bolt does this automatically
// HTTP MODE
// router.post(
//   "/slack/:challenge",
//   ({ params, set, body }) => {
//     set.status = 200;
//     return { challenge: body.challenge };
//   },
//   {
//     params: t.Object({
//       challenge: t.String(),
//     }),
//     body: t.Object({
//       token: t.String(),
//       challenge: t.String(),
//       type: t.String(),
//     }),
//   }
// );

router.use(v1);

//===========================================================//

export type Router = typeof router;

//===========================================================//

router.listen(5000);
console.log(
  `🦊 Elysia is running at ${router.server?.hostname}:${router.server?.port}`
);
