import { SlackInfo } from "./util/bot.request.schema";
import { bolt } from "../src/slack-bolt";

export const sendBotMessage = async (slackInfo: SlackInfo, message: string) => {
  await bolt.client.chat.postMessage({
    channel: slackInfo.channel_id,
    text: message,
  });
};
