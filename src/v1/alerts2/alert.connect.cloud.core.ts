import Elysia, { t } from "elysia";
import { bolt } from "../../slack-bolt";
import { cloudCoreApi } from "../../util/ticket.system";
import { AppPermission } from "../../../app.config";
import { alertText } from "./alert.post.message";
import { ALERT_LABEL } from "./alert.tag";

export const alertConnectCloudCore = new Elysia().post(
  "/connectCloudCore",
  async ({ body, set }) => {
    const { applicationId, projectId, ticketId, alertTs, alertChannelId } =
      body;

    // get replies threads
    const replies = await bolt.client.conversations.history({
      limit: 1,
      channel: alertChannelId,
      oldest: alertTs,
      include_all_metadata: true,
      inclusive: true,
    });

    const message = replies.messages?.[0];

    if (!message || !message.text) {
      set.status = 400;
      return {
        error: "Message not found",
      };
    }

    if (message.metadata?.event_type === "TICKET_INFO") {
      return "already connected with cloud core";
    }

    // get ticket info
    const { data, error } = await cloudCoreApi.GET(
      "/api/v1/projects/{project}/tickets/{ticket}",
      {
        params: {
          header: {
            "x-app-id": applicationId,
            "x-app-secret": AppPermission[applicationId],
          },
          path: {
            project: projectId,
            ticket: ticketId,
          },
        },
      }
    );

    if (!data || !data.description || error) {
      set.status = 400;
      return {
        error: "Ticket not found",
      };
    }

    await bolt.client.chat.update({
      channel: alertChannelId,
      ts: alertTs,
      text: alertText({
        applicationId,
        projectId,
        ticketId,
        ticketDescription: data.description,
      }),
      metadata: {
        event_type: "TICKET_INFO",
        event_payload: {
          applicationId,
          projectId,
          ticketId,
        },
      },
    });

    return "ok";
  },
  {
    tags: [ALERT_LABEL],
    body: t.Object({
      alertTs: t.String(),
      alertChannelId: t.String(),
      applicationId: t.String(),
      projectId: t.String(),
      ticketId: t.String(),
    }),
  }
);
