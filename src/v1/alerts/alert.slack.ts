import Elysia, { t } from "elysia";
import { AlertPriority } from "../../util/on-call-schedule/get.on.call.schedule";
import { bolt } from "../../slack-bolt";

export const alertsPost = new Elysia().post(
  "/slack",
  async ({ body, set }) => {
    const {
      slackChannelId,
      applicationId,
      description,
      priority,
      projectId,
      ticketName,
    } = body;

    // post alert message
    const alert = await bolt.client.chat.postMessage({
      channel: slackChannelId,
      text: `[ALERT] ${priority}\n${applicationId}\n${projectId}\n${ticketName}\n${description}\n`,
    });
    const alertMessageTs = alert.message?.ts;
    if (!alert.message || !alertMessageTs)
      return { error: "Error sending message" };
    set.status = 200;
    return alert.message;
  },
  {
    body: t.Object({
      slackChannelId: t.String({ description: "The slack channel id" }),
      priority: t.Enum(AlertPriority, {
        description: "The priority of the alert",
      }),
      applicationId: t.String({ description: "The application id" }),
      projectId: t.String({ description: "The project identifier" }),
      ticketName: t.String({ description: "The name of the ticket" }),
      description: t.String({ description: "Description of the alert" }),
    }),
  }
);
