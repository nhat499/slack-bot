import { App } from "@slack/bolt";

export const testSlack = (bolt: App) => {
  // EVENT API TEST

  // Listens to incoming messages that contain "hello"
  bolt.message("hello", async ({ message, say, client }) => {});

  // listen for button click
  bolt.action("button_click", async ({ body, ack }) => {
    // Acknowledge the action
    console.log("buttonClicked");
    await ack();
  });

  // Sends a section block with datepicker when someone reacts with a 📅 emoji
  bolt.event("reaction_added", async ({ event, client }) => {
    console.log("reacted", event.reaction);
    if (event.reaction === "calendar") {
      await client.chat.postEphemeral({
        channel: event.item.channel,
        user: event.user,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Pick a date for me to remind you",
            },
            accessory: {
              type: "datepicker",
              action_id: "datepicker_remind",
              initial_date: "2019-04-28",
              placeholder: {
                type: "plain_text",
                text: "Select a date",
              },
            },
          },
        ],
      });
    }
  });

  // Slash command handler
  bolt.command("/application2", async ({ ack, payload, client }) => {
    await ack();
    await client.chat.postEphemeral({
      channel: payload.channel_id,
      user: payload.user_id,
      text: "Choose an action:",
      blocks: [
        {
          type: "input",
          block_id: "action_input",
          label: {
            type: "plain_text",
            text: "Select or type an action:",
          },
          element: {
            type: "external_select", // External select triggers bolt.options()
            action_id: "select_crud", // Match this with the bolt.options() listener
            placeholder: {
              type: "plain_text",
              text: "Type to search actions...",
            },
          },
        },
      ],
    });
  });

  // Handle option requests for external_select
  bolt.options("select_crud", async ({ payload, ack }) => {
    console.log("auto complete triggered"); // Confirm this runs in logs
    // const input = payload.value.toLowerCase(); // User's input for autocomplete
    const actions = ["LIST", "CREATE", "UPDATE", "DELETE"];

    await ack({
      options: actions.map((action) => ({
        text: {
          type: "plain_text",
          text: action,
        },
        value: action,
      })),
    });
  });

  // listener for selected option
  bolt.action(
    "select_crud",
    async ({ ack, body, payload, action, client, inputs }) => {
      // Acknowledge the action
      console.log("crud_selected");
      console.log({
        body: body,
        payload: payload,
        inputs: inputs,
        action: action,
      });
      await ack();
      if (
        !(action.type === "external_select") ||
        !action.selected_option?.value
      ) {
        return;
      }
      // await say(`<@${body.user.id}> selected ${action.selected_option.value}`);
    }
  );

  // unknown command does not work
  bolt.command("/unknown", async ({ ack, client, payload }) => {
    await ack();
    await client.chat.postEphemeral({
      channel: payload.channel_id,
      user: payload.user_id,
      text: "unknown",
    });
  });

  // custom steps
  bolt.function("sample_custom_step", async ({ inputs, complete, fail }) => {
    console.log("custom step triggered");
  });

  bolt.command(
    "/test",
    async ({ ack, client, payload, body, command, respond, context, say }) => {
      // console.log(body);

      // throw Error("RANdom error");
      await ack();

      // bot post this only viewable by you
      respond({
        text: "test received",
        response_type: "ephemeral",
      });

      // bot post this
      // say({
      //   text: "test received",
      // });

      // you post this
      // await client.chat.postEphemeral({
      //   channel: payload.channel_id + "",
      //   user: payload.user_id,
      //   text: "test",
      // });
      console.log("i am context", context);
      // await say("/test received");
    }
  );
};
