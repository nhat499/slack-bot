import { App, subtype } from "@slack/bolt";
import { cloudCoreApi } from "../../util/ticket.system";
import { AppPermission } from "../../../app.config";
import { env } from "../../../env.config";
import { TicketMetaData } from "../../v1/alerts/alert.post.create.ticket";

export const repliesAlert = (bolt: App) => {
  bolt.message(async ({ message, say, client, body, event }) => {
    if (!("text" in message && message.text)) return;
    const user = message.user;
    if (message.type === "message" && user && message.ts && message.text) {
      const postCommentStatus = (not: string) => {
        client.chat.postEphemeral({
          user: user,
          channel: body.event.channel,
          thread_ts: message.ts,
          text: `Comment ${not} created on Cloud Core.`,
        });
      };

      // get replies threads
      const replies = await client.conversations.replies({
        channel: body.event.channel,
        ts: message.ts,
      });

      if (!replies.messages || !replies.messages[0].thread_ts) return;
      const parents = await client.conversations.replies({
        channel: body.event.channel,
        include_all_metadata: true,
        ts: replies.messages[0].thread_ts,
      });

      if (
        parents.messages &&
        parents.messages[0].metadata?.event_type === "TICKET_INFO"
      ) {
        let ticketInfo = parents.messages[0].metadata;
        let ticketData = ticketInfo.event_payload as TicketMetaData | undefined;
        if (!ticketData) {
          postCommentStatus("not");
          return;
        }
        const { applicationId, projectId, ticketId } = ticketData;

        // add comment to tickets
        const { data } = await cloudCoreApi.POST(
          "/api/v1/projects/{project}/comments/",
          {
            params: {
              header: {
                "x-app-id": applicationId as string,
                "x-app-secret": AppPermission[applicationId],
              },
              path: {
                project: projectId,
              },
            },
            body: {
              ticketId: ticketId,
              message: `${message.text}`,
              authorId: env.SLACK_USER_ID,
            },
          }
        );

        if (!data) {
          console.log("!data");
          postCommentStatus("not");
        }
        postCommentStatus("");
      } else {
        postCommentStatus("not");
      }
    }
  });
};
