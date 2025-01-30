import Elysia from "elysia";
import { slackInfoSchema } from "../../util/bot.request.schema";
import { bolt } from "../../slack-bolt";

export const AppList2 = new Elysia().post(
  "/app2",
  async ({ body, headers, params, query }) => {
    console.log("app2");
    bolt.command("/application2", async ({ ack, payload, say }) => {
      await ack();
      console.log("payload,", payload.text);
      const selectedAction = payload.text; // Contains the user input or selected value
      await say(`You selected the action: ${selectedAction}`);
    });
    return "ok";
  },
  {
    body: { ...slackInfoSchema },
  }
);
