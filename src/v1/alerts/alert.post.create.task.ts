import Elysia, { t } from "elysia";
import { bolt } from "../../slack-bolt";
import { cloudCoreApi } from "../../util/ticket.system";
import { AppPermission } from "../../../app.config";

enum TaskStatus {
  TODO = "TODO",
  HOLD = "HOLD",
  INACTIVE = "INACTIVE",
  IN_PROGRESS = "IN_PROGRESS",
  READY = "READY",
  DONE = "DONE",
}

export const alertsPostCreateTask = new Elysia().post(
  "/createTask",
  async ({ body, set }) => {
    const {
      applicationId,
      projectId,
      ticketId,
      taskDescription,
      taskName,
      taskStatus,
      assignedToId,
      postTaskCreation,
    } = body;

    const { task, taskId, error } = await createTask({
      applicationId,
      projectId,
      ticketId,
      taskDescription,
      taskName,
      taskStatus,
      assignedToId,
    });

    if (error || !task || !taskId) {
      return error;
    }

    // post saying task is created
    if (postTaskCreation) {
      await bolt.client.chat.postMessage({
        channel: postTaskCreation.slackChannelId,
        thread_ts: postTaskCreation.alertMessageTs,
        text: `*Task Created*`,
      });
    }

    set.status = 200;
    return { task, taskId };
  },
  {
    body: t.Object({
      applicationId: t.String(),
      projectId: t.String(),
      ticketId: t.String(),
      taskDescription: t.String(),
      taskName: t.String(),
      taskStatus: t.Optional(t.Enum(TaskStatus)),
      assignedToId: t.Optional(t.String()),
      postTaskCreation: t.Optional(
        t.Object({
          alertMessageTs: t.String(),
          slackChannelId: t.String(),
        })
      ),
    }),
  }
);

interface createTaskParams {
  applicationId: string;
  projectId: string;
  ticketId: string;
  taskName: string;
  taskDescription: string;
  taskStatus?: TaskStatus;
  assignedToId?: string;
}
export const createTask = async ({
  applicationId,
  projectId,
  ticketId,
  taskName,
  taskDescription,
  taskStatus = TaskStatus.TODO,
  assignedToId,
}: createTaskParams) => {
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
        name: taskName,
        description: taskDescription,
        status: taskStatus,
        assignedToId: assignedToId,
      },
    }
  );
  const taskId = task?.id;
  if (!task || !taskId) {
    return { error: "Task not created" };
  }
  return { task, taskId };
};
