import Elysia, { t } from "elysia";
import { cloudCoreApi } from "../../util/cloud.core.system";
import { env } from "../../../env.config";
import { AppPermission } from "../../../app.config";
import { bolt } from "../../slack-bolt";
import { ALERT_LABEL } from "./alert.tag";

export const alertPostMessage = new Elysia().post(
  "/",
  async ({ body }) => {
    const { applicationId, projectId, alertChannelId, connectWithCloudCore } =
      body;

    // post alert
    const result = await bolt.client.chat.postMessage({
      channel: alertChannelId,
      mrkdwn: true,
      text: alertText({ applicationId, projectId }),
    });
    if (!result.ts) return "error posting alert message";

    if (connectWithCloudCore) {
      // create tickets
      const { error, data } = await cloudCoreApi.POST(
        "/api/v1/projects/{project}/tickets/",
        {
          params: {
            header: {
              "x-app-id": applicationId,
              "x-app-secret": AppPermission[applicationId],
            },
            path: {
              project: projectId,
            },
          },
          body: {
            name: "shouldPostAlert.alertName",
            authorId: env.SLACK_USER_ID,
            description: connectWithCloudCore.alertDescription,
            status: "TODO",
          },
        }
      );
      if (error || !data || !data.id) {
        return "error creating tickets";
      }

      // update postMessage, sync with cloud core by adding meta data
      await bolt.client.chat.update({
        channel: alertChannelId,
        ts: result.ts,
        text: alertText({
          applicationId,
          projectId,
          ticketId: data.id,
          ticketDescription: connectWithCloudCore.alertDescription,
        }),
        metadata: {
          event_type: "TICKET_INFO",
          event_payload: {
            applicationId,
            projectId,
            ticketId: data.id,
          },
        },
      });
    }

    return result;
  },
  {
    tags: [ALERT_LABEL],
    body: t.Object({
      alertChannelId: t.String(),
      applicationId: t.String(),
      projectId: t.String(),
      connectWithCloudCore: t.Optional(
        t.Object({
          alertName: t.String(),
          alertDescription: t.String(),
        })
      ),
    }),
  }
);

export const alertText = ({
  applicationId,
  projectId,
  ticketId = "",
  ticketDescription = "",
}: {
  applicationId: string;
  projectId: string;
  ticketId?: string;
  ticketDescription?: string;
}) => {
  const text = `[ALERT]\n*ApplicationId:* ${applicationId}\n*ProjectId:* ${projectId}\n*Ticket:* ${ticketId}\n*Description:* ${ticketDescription}`;
  return text;
};
