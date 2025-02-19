import Elysia, { t } from "elysia";
import { cloudCoreApi } from "../../util/cloud.core.system";
import { AppPermission } from "../../../app.config";
import { bolt } from "../../slack-bolt";

export const alertPost = new Elysia().post(
  "/alertMessage",
  async ({ body }) => {
    // check app/project exists
    const {
      slackChannelId,
      alertMessage,
      priority,
      applicationId,
      projectId,
      alertName,
      alertDescription,
    } = body;
    const {
      error: CCError,
      app,
      project,
    } = await cloudCoreChecks({
      applicationId,
      projectId,
    });
    if (CCError || !app || !project) {
      return CCError;
    }

    const { alertMessageTs, error: PAMError } = await postAlertMessage({
      slackChannelId,
      applicationId,
      description: alertDescription,
      priority,
      projectId,
      ticketName: alertName,
    });

    return {
      slackChannelId,
      alertMessage,
      priority,
      applicationId,
      projectId,
      alertName,
      alertDescription,
      alertMessageTs,
    };
  },
  {
    body: t.Object({
      slackChannelId: t.String(),
      alertMessage: t.String(),
      priority: t.String(),
      applicationId: t.String(),
      projectId: t.String(),
      alertName: t.String(),
      alertDescription: t.String(),
    }),
  }
);

interface cloudCoreApiParams {
  applicationId: string;
  projectId: string;
}
export const cloudCoreChecks = async ({
  applicationId,
  projectId,
}: cloudCoreApiParams) => {
  // check app exists
  const { data: app } = await cloudCoreApi.GET("/api/v1/apps/{id}", {
    params: {
      path: {
        id: applicationId,
      },
    },
  });

  // app not found
  if (!app) {
    return { error: `Application ${applicationId} not found.` };
  }

  // app permission not found
  if (!AppPermission[applicationId]) {
    return { error: `Application ${applicationId} permission not found.` };
  }

  // check project exits
  const { data: project } = await cloudCoreApi.GET(
    "/api/v1/projects/{project}/",
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
    }
  );

  // project not found
  if (!project) {
    return { error: `Project ${projectId} not found.` };
  }

  return { app, project };
};

interface postAlertMessageParams {
  slackChannelId: string;
  priority: string;
  applicationId: string;
  projectId: string;
  ticketName: string;
  description: string;
}
export const postAlertMessage = async ({
  slackChannelId,
  priority,
  applicationId,
  projectId,
  ticketName,
  description,
}: postAlertMessageParams) => {
  const alert = await bolt.client.chat.postMessage({
    channel: slackChannelId,
    text: `[ALERT] ${priority}\n${applicationId}\n${projectId}\n${ticketName}\n${description}\n`,
  });
  const alertMessageTs = alert.message?.ts;
  if (!alert.message || !alertMessageTs)
    return { error: "Error sending message" };

  return { alert, alertMessageTs };
};
