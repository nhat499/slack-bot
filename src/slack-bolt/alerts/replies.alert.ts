import { App, subtype } from "@slack/bolt";
import { cloudCoreApi } from "../../ticket.system.service";
import { AppPermission } from "../../../app.config";
import { env } from "../../../env.config";

export const repliesAlert = (bolt: App) => {
  bolt.message(async ({ message, say, client, body, event }) => {
    if (!("text" in message && message.text)) return;
    if (
      message.type === "message" &&
      message.user &&
      message.ts &&
      message.text
    ) {
      // get replies threads
      const replies = await client.conversations.replies({
        channel: body.event.channel,
        ts: message.ts,
      });
      if (!replies.messages || !replies.messages[0].thread_ts) return;
      const parents = await client.conversations.replies({
        channel: body.event.channel,
        ts: replies.messages[0].thread_ts,
      });
      if (
        parents.messages &&
        parents.messages[0].text?.startsWith("[ALERT]") &&
        parents.messages[1].text?.startsWith("*Ticket Created*")
      ) {
        const ticketInfo = parents.messages[1].text.split("\n&gt;*");
        const [
          _title,
          Application,
          ApplicationId,
          Project,
          ProjectId,
          Ticket,
          TicketId,
          Description,
        ] = ticketInfo;
        // add comment to tickets
        const { data } = await cloudCoreApi.POST(
          "/api/v1/projects/{project}/comments/",
          {
            params: {
              header: {
                "x-app-id": ApplicationId.split(":* ")[1],
                "x-app-secret": AppPermission[ApplicationId.split(":* ")[1]],
              },
              path: {
                project: ProjectId.split(":* ")[1],
              },
            },
            body: {
              ticketId: TicketId.split(":* ")[1],
              message: `${message.text}`,
              authorId: env.SLACK_USER_ID,
            },
          }
        );
        if (!data) {
          client.chat.postEphemeral({
            user: message.user,
            channel: body.event.channel,
            thread_ts: message.ts,
            text: `Comment not created. Cloud Core Error`,
          });
        }
      }
    }
  });
};
