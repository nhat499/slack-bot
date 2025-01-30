import TicketSystem, { cloudCoreApi } from "../../ticket.system.service";
import { sendBotMessage } from "../../slack.service";
import { slackInfoSchema } from "../../util/bot.request.schema";
import Elysia from "elysia";
import { bolt } from "../../slack-bolt";
import { listModal } from "../../slack-bolt/view-modal/list.app.modal";

const applicationListParams = "application_list_params";
const { view: ListAppModal, extractData: searchData } = listModal(
  applicationListParams
);

// SLASH COMMAND API

export const appList = new Elysia().post(
  // ==================================== //

  "/app",

  // ==================================== //
  async ({ body, headers, params, query }) => {
    console.log(body);
    const client = bolt.client;

    // await ack();
    const [action] = body.text.split(" ");
    if (!action) {
      await client.chat.postEphemeral({
        user: body.user_id,
        channel: body.channel_id,
        text: "Please provide an action.",
      });
      return "Please provide an action.";
    }

    if (action.toLocaleLowerCase() === "list") {
      await client.views.open({
        trigger_id: body.trigger_id,
        view: { ...ListAppModal, private_metadata: body.channel_id },
      });
    } else if (action.toLocaleLowerCase() === "create") {
      // await client.views.open({
      //   trigger_id: body.trigger_id,
      //   view: { ...CreateAppModal, private_metadata: body.channel_id },
      // });
    } else {
      await client.chat.postEphemeral({
        user: body.user_id,
        channel: body.channel_id,
        text: "Action must be LIST or CREATE",
      });
    }
  },
  {
    body: { ...slackInfoSchema },
  }
);
