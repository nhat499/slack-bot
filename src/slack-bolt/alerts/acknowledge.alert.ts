import { App } from "@slack/bolt";
import { cloudCoreApi } from "../../ticket.system.service";
import { AppPermission } from "../../../app.config";
import { onCallTimer } from "./system.monitor.alert";
import { bolt } from "..";

export const acknowledgeAlert = (bolt: App) => {
  bolt.action(
    "Acknowledged_task",
    async ({ ack, client, body, action, payload }) => {
      await ack();
      const message = new Message(body.user.id);

      if (
        body.type !== "block_actions" ||
        !body.message ||
        !body.message["metadata"] ||
        !body.message["metadata"].event_payload
      )
        return;

      const {
        applicationId,
        projectId,
        ticketId,
        slackUserId,
        taskId,
        cloudCoreUserId,
        channelId,
        messageTs,
      } = body.message["metadata"].event_payload;

      // get task
      const task = await getTask({
        applicationId,
        projectId,
        taskId,
      });

      if (!task) {
        message.postEphemeral(`Task not found.`);
        return;
      }

      if (task.assignedToId) {
        message.postEphemeral(`Task has already been Assigned.`);
        return;
      }

      const data = await assignToTask({
        cloudCoreUserId,
        applicationId,
        projectId,
        taskId,
      });

      if (!data) {
        message.postEphemeral(`Task not assigned, Error with cloud Core API.`);
        return;
      }

      // clear time outs
      clearOnCallTimer(applicationId, ticketId);

      const text = createTaskText(applicationId, data, slackUserId);

      // reply to previous message
      await client.chat.postMessage({
        channel: channelId,
        thread_ts: messageTs,
        mrkdwn: true,
        text,
      });

      // reply to ack button pressed
      message.postEphemeral("Acknowledged, Task is assign to you");
    }
  );
};

const clearOnCallTimer = (applicationId: string, ticketId: string) => {
  while (onCallTimer[applicationId]?.[ticketId].length > 0) {
    const timer = onCallTimer[applicationId][ticketId].pop();
    if (!timer) continue;
    clearTimeout(timer);
  }
  if (onCallTimer[applicationId][ticketId].length === 0)
    delete onCallTimer[applicationId][ticketId];
};

const assignToTask = async ({
  cloudCoreUserId,
  applicationId,
  projectId,
  taskId,
}: {
  cloudCoreUserId: string;
  applicationId: string;
  projectId: string;
  taskId: string;
}) => {
  const { data } = await cloudCoreApi.PATCH(
    "/api/v1/projects/{project}/tasks/{task}",
    {
      body: {
        assignedToId: cloudCoreUserId,
      },
      params: {
        header: {
          "x-app-id": applicationId,
          "x-app-secret": AppPermission[applicationId],
        },
        path: {
          project: projectId,
          task: taskId,
        },
      },
    }
  );
  return data;
};

const getTask = async ({
  applicationId,
  projectId,
  taskId,
}: {
  applicationId: string;
  projectId: string;
  taskId: string;
}) => {
  const { data } = await cloudCoreApi.GET(
    "/api/v1/projects/{project}/tasks/{task}",
    {
      params: {
        header: {
          "x-app-id": applicationId,
          "x-app-secret": AppPermission[applicationId],
        },
        path: {
          project: projectId,
          task: taskId,
        },
      },
    }
  );
  return data;
};

interface data {
  id?: string;
  name?: string | null;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  projectId?: string | null;
  assignedToId?: string | null;
  ticketId?: string | null;
  status?: string | null;
}

const createTaskText = (
  applicationId: string,
  data: data,
  slackUserId: string
) => {
  const text = `*Task Created*\n
        >*ApplicationId:* ${applicationId}\n
        >*ProjectId:* ${data.projectId}\n
        >*TicketId:* ${data.ticketId}\n
        >*TaskId:* ${data.id}\n
        >*TaskName:* ${data.name}\n
        >*Description:* ${data.description}\n
        >*cloudCoreUser:* ${data.assignedToId}\n
        >*AssignedTo:* <@${slackUserId}>`
    .split(/\n+\s+/)
    .join("\n");
  return text;
};

class Message {
  channel: string;
  constructor(channel: string) {
    this.channel = channel;
  }

  postEphemeral(text: string) {
    bolt.client.chat.postEphemeral({
      channel: this.channel,
      text,
      user: this.channel,
    });
  }
}
