import { App } from "@slack/bolt";
import { cloudCoreApi } from "../../ticket.system.service";
import { AppPermission } from "../../../app.config";
import { env } from "../../../env.config";
import { getCurrentOnCall } from "../../on-call-schedule/get.on.call.schedule";
// import { onCall } from ".";

interface OnCallTimer {
  [appId: string]: {
    [ticketId: string]: Timer[];
  };
}
export const onCallTimer: OnCallTimer = {};

export const systemMonitorAlert = (bolt: App) => {
  // listen for alerts and ping on call personnel
  bolt.message(
    /\[ALERT\] (High|Low|Medium)\n.+\n.+\n.+\n(.+|\n)*/gm,
    async ({ client, message, say }) => {
      // message schema

      // [ALERT] high
      // appId
      // ProjectId
      // ticket name
      // ticket description

      if (!("text" in message && message.text)) return;
      const { applicationId, description, priority, projectId, ticketName } =
        parseAlertText(message.text);

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
        say({
          text: `Application ${applicationId} not found.`,
        });
        return;
      }

      // app permission not found
      if (!AppPermission[applicationId]) {
        say({
          text: `Application ${applicationId} permission not found.`,
        });
        return;
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
        say({
          text: `Project ${projectId} not found.`,
        });
        return;
      }

      // create ticket
      const { data: ticket } = await cloudCoreApi.POST(
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
      if (!ticket || !ticketId) {
        say({
          text: `Ticket ${ticketName} not created.`,
        });
        return;
      }

      // post saying ticket is created
      say({
        thread_ts: message.ts,
        mrkdwn: true,
        text: `*Ticket Created*\n
          >*Application:* ${app.name}\n
          >*ApplicationId:* ${applicationId}\n
          >*Project:* ${project.name}\n
          >*ProjectId:* ${projectId}\n
          >*Ticket:* ${ticketName}\n
          >*TicketId:* ${ticketId}\n
          >*Description:* ${description}`
          .split(/\n+\s+/)
          .join("\n"),
      });

      if (priority === "High") {
        // create task
        const { data: task } = await cloudCoreApi.POST(
          "/api/v1/projects/{project}/tasks/",
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
              ticketId: ticketId,
              name: "slack bot task",
              description: "check ticket description for more info",
              status: "TODO",
              //   assignedToId: onCallPersonnel.cloudCoreId,
            },
          }
        );
        const taskId = task?.id;
        if (!task || !taskId) {
          say({
            text: `Task not created.`,
          });
          return;
        }

        const text = `*Task Created*\n
          >*Application:* ${app.name}\n
          >*Project:* ${project.name}\n
          >*Ticket:* ${ticketName}\n
          >*Description:* ${description}`
          .split(/\n+\s+/)
          .join("\n");
        const blocks = [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text,
            },
            accessory: {
              type: "button",
              text: {
                type: "plain_text",
                text: "Acknowledged",
              },
              action_id: "Acknowledged_task",
            },
          },
        ];

        const fiveMin = 60 * 1 * 1000;
        const onCall = await getCurrentOnCall(applicationId);
        // ping on call people every ${fiveMin}
        for (let i = 0; i < onCall.length; i++) {
          const onCallPersonnel = onCall[i];
          const timeout = setTimeout(async () => {
            await client.chat.postMessage({
              metadata: {
                event_type: "TASK_ALERTED",
                event_payload: {
                  cloudCoreUserId: onCallPersonnel.cloudCoreUserId,
                  slackUserId: onCall[i].slackUserId,
                  channelId: message.channel,
                  messageTs: message.ts,
                  applicationId,
                  projectId,
                  ticketId: ticketId,
                  taskId: taskId,
                },
              },
              channel: onCall[i].slackUserId,
              text,
              blocks,
            });
            say({
              thread_ts: message.ts,
              text: `Pinging <@${onCallPersonnel.slackUserId}> ${onCallPersonnel.firstName}`,
            });
          }, i * fiveMin);
          if (onCallTimer[applicationId] === undefined) {
            onCallTimer[applicationId] = {};
          }
          if (onCallTimer[applicationId][ticketId] === undefined) {
            onCallTimer[applicationId][ticketId] = [];
          }
          onCallTimer[applicationId][ticketId].push(timeout);

          console.log(JSON.stringify(onCallTimer, null, 2));
        }
      }
    }
  );
};

const parseAlertText = (text: string) => {
  const [line1, applicationId, projectId, ticketName, description] =
    text.split("\n");

  const [_alert, priority] = line1.split(" ");

  return {
    applicationId,
    projectId,
    ticketName,
    description,
    priority,
  };
};
