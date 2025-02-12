import Elysia, { t } from "elysia";
import { cloudCoreApi } from "../../util/ticket.system";
import { AppPermission } from "../../../app.config";
import { env } from "../../../env.config";
import { bolt } from "../../slack-bolt";

export const alertsPostCreateTicket = new Elysia().post(
  "/createTicket",
  async ({ body, set }) => {
    const {
      applicationId,
      projectId,
      ticketName,
      description,
      postTicketCreation,
    } = body;

    // create ticket
    let {
      error: CTError,
      ticket,
      ticketId,
    } = await createTicket({
      applicationId,
      projectId,
      ticketName,
      description,
    });
    if (CTError || !ticket || !ticketId) return CTError;

    if (postTicketCreation) {
      await postTicketCreated({
        alertMessageTs: postTicketCreation.alertMessageTs,
        ticketCreationText: `*Ticket Created*`,
        slackChannelId: postTicketCreation.slackChannelId,
        ticketMetaData: {
          applicationId,
          projectId,
          ticketId,
        },
      });
    }

    set.status = 200;
    return { message: "Ticket Created", ticket };
  },
  {
    body: t.Object({
      applicationId: t.String(),
      projectId: t.String(),
      ticketName: t.String(),
      description: t.String(),
      postTicketCreation: t.Optional(
        t.Object({
          alertMessageTs: t.String(),
          slackChannelId: t.String(),
        })
      ),
    }),
  }
);

interface createTicketParams {
  applicationId: string;
  projectId: string;
  ticketName: string;
  description: string;
}
export const createTicket = async ({
  applicationId,
  projectId,
  ticketName,
  description,
}: createTicketParams) => {
  // create ticket
  const { data: ticket, error } = await cloudCoreApi.POST(
    "/api/v1/projects/{project}/tickets/",
    {
      params: {
        header: {
          "x-app-id": applicationId,
          // need to account for other apps
          "x-app-secret": AppPermission[applicationId],
        },
        path: {
          project: projectId,
        },
      },
      body: {
        authorId: env.SLACK_USER_ID,
        name: ticketName,
        description: description,
        status: "TODO",
      },
    }
  );

  const ticketId = ticket?.id;
  if (!ticket || !ticketId || error) {
    return { message: `Ticket ${ticketName} not created.`, error: error };
  }

  return { ticket, ticketId };
};

interface postTicketCreatedParams {
  slackChannelId: string;
  alertMessageTs: string;
  ticketCreationText: string;
  ticketMetaData: TicketMetaData;
}
export interface TicketMetaData {
  applicationId: string;
  projectId: string;
  ticketId: string;
  [key: string]: string;
}
export const postTicketCreated = async ({
  slackChannelId,
  alertMessageTs,
  ticketCreationText,
  ticketMetaData,
}: postTicketCreatedParams) => {
  console.log("ticketMetaData", ticketMetaData);
  // post saying ticket is created
  const result = await bolt.client.chat.postMessage({
    channel: slackChannelId,
    thread_ts: alertMessageTs,

    metadata: {
      event_type: "TICKET_CREATED",
      event_payload: ticketMetaData,
    },
    mrkdwn: true,
    text: `${ticketCreationText}`,
  });

  return result;
};
