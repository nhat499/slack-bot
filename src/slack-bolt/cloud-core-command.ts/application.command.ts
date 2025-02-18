import { App } from "@slack/bolt";
import { listModal } from "../view-modal/list.app.modal";
import { cloudCoreApi } from "../../util/ticket.system";
import { createAppModal } from "../view-modal/create.app.modal";

const applicationListParams = "application_list_params";
const { view: ListAppModal, extractData: searchData } = listModal(
  applicationListParams
);

const applicationCreateParams = "application_create_params";
const { view: CreateAppModal, extractData: createAppData } = createAppModal(
  applicationCreateParams
);

export const applicationCommands = (bolt: App) => {
  // ============================================================ //
  // APPLICATION LIST //
  // ============================================================ //
  bolt.command(
    "/application",
    async ({ ack, say, body, client, payload, command, context }) => {
      console.log(body);
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
          view: { ...ListAppModal, private_metadata: body.channel_id },
        });
      } else if (action.toLocaleLowerCase() === "create") {
        await client.views.open({
          trigger_id: body.trigger_id,
          view: { ...CreateAppModal, private_metadata: body.channel_id },
        });
      } else {
        await client.chat.postEphemeral({
          user: body.user_id,
          channel: payload.channel_id,
          text: "Action must be LIST or CREATE",
        });
      }
    }
  );

  bolt.shortcut("create_project", async ({ shortcut, ack, client, logger }) => {
    await ack();
    // console.log(shortcut);

    const result = await client.views.open({
      trigger_id: shortcut.trigger_id,
      view: { ...CreateAppModal },
    });
  });

  // ============================================================ //
  // APPLICATION LIST HANDLER //
  // ============================================================ //
  bolt.view(
    applicationListParams,
    async ({ ack, body, view, client, context, payload, respond }) => {
      await ack();

      // Extract user inputs
      const user = body.user.id;

      const { search, page, rows, order, direction } = searchData(view);

      // Process or validate the inputs as needed
      const { data: response } = await cloudCoreApi.GET("/api/v1/apps/", {
        params: {
          query: {
            direction,
            order,
            page,
            rows,
            search: search ?? undefined,
          },
        },
      });

      if (!response || !response.data) {
        await client.chat.postEphemeral({
          user: user,
          channel: view.private_metadata ?? user,
          text: "No data found",
        });
        return;
      }

      // Send a confirmation to the user
      await client.chat.postEphemeral({
        user: user,
        channel: view.private_metadata,
        text: "List of Applications",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*List of Applications*`,
            },
          },
          ...response.data.map((app) => ({
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${app.name}*\n${app.description}`,
            },
          })),
        ],
      });
    }
  );

  // ============================================================ //
  // APPLICATION CREATE HANDLER //
  // ============================================================ //
  bolt.view(
    applicationCreateParams,
    async ({ ack, body, view, client, context, payload }) => {
      await ack();

      console.log({ body, view, payload });
      // Extract user inputs
      const user = body.user.id;

      const { name, description } = createAppData(view);

      // Process or validate the inputs as needed
      // const { data } = await ticketSystemService.createApp({
      //   name,
      //   description: description ?? "",
      // });

      // Send a confirmation to the user
      await client.chat.postEphemeral({
        user: user,
        channel:
          view.private_metadata ?? (await client.bots.info()).bot?.user_id,
        text: `Doesn't make sense to create app at this point`,
      });
    }
  );
};
