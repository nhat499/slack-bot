import { App } from "@slack/bolt";
import { cloudCoreApi, headers } from "../../../util/ticket.system";
import { listProjectModal } from "../../view-modal/list.project.modal";

// PROJECT LIST //
const projectListParams = "project_list_params";
const { view: ListProjectModal, exportData: listProjectData } =
  listProjectModal(projectListParams);

export const projectCommands = (bolt: App) => {
  // ============================================================ //
  // PROJECT ACTION //
  // ============================================================ //
  bolt.command("/project", async ({ ack, client, payload, body, say }) => {
    await ack();

    const [action] = body.text.split(" ");
    if (!action) {
      await client.chat.postEphemeral({
        user: body.user_id,
        channel: payload.channel_id,
        text: "Please provide an action.",
      });
      return;
    }

    if (action.toLocaleLowerCase() === "list") {
      await client.views.open({
        trigger_id: body.trigger_id,
        view: { ...ListProjectModal, private_metadata: body.channel_id },
      });
    } else if (action.toLocaleLowerCase() === "create") {
      await client.chat.postEphemeral({
        user: body.user_id,
        channel: payload.channel_id,
        text: "Not implemented",
      });
    } else {
      await client.chat.postEphemeral({
        user: body.user_id,
        channel: payload.channel_id,
        text: "Action must be LIST or CREATE",
      });
    }
  });

  // ============================================================ //
  // PROJECT LIST HANDLER //
  // ============================================================ //
  bolt.view(
    projectListParams,
    async ({ ack, body, view, client, context, payload }) => {
      await ack();

      const user = body.user.id;

      // Extract user inputs
      const { search, page, rows, order, direction, status } =
        listProjectData(view);

      // Process or validate the inputs as needed
      const { data } = await cloudCoreApi.GET("/api/v1/projects/", {
        params: {
          header: headers,
          query: {
            search: search ?? undefined,
            page,
            rows,
            order: order ?? "createdAt",
            direction,
            status,
          },
        },
      });

      if (!data) {
        await client.chat.postEphemeral({
          user: user,
          channel: view.private_metadata,
          text: "No data found",
        });
        return;
      }

      // Send a confirmation to the user
      await client.chat.postEphemeral({
        user: user,
        channel: view.private_metadata,
        text: `${JSON.stringify(data.data)}`,
      });
    }
  );
};
