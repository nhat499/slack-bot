import { ViewOutput } from "@slack/bolt";
import { View } from "@slack/types";

export const createAppModal = (callback_id: string) => {
  const view: View = {
    type: "modal",
    callback_id: callback_id,
    title: {
      type: "plain_text",
      text: "Create Application",
    },
    blocks: [
      {
        type: "input",
        optional: false,
        block_id: "name_block",
        element: {
          type: "plain_text_input",
          action_id: "name_input",
          placeholder: {
            type: "plain_text",
            text: "Enter application name",
          },
        },
        label: {
          type: "plain_text",
          text: "Application Name",
        },
      },
      {
        type: "input",
        optional: true,
        block_id: "description_block",
        element: {
          type: "plain_text_input",
          action_id: "description_input",
          placeholder: {
            type: "plain_text",
            text: "Enter application description",
          },
        },
        label: {
          type: "plain_text",
          text: "Application Description",
        },
      },
    ],
    submit: {
      type: "plain_text",
      text: "Submit",
    },
  };

  const extractData = (view: ViewOutput) => {
    const name = view.state.values.name_block.name_input.value as string;
    const description =
      view.state.values.description_block?.description_input?.value;
    return { name, description };
  };
  return { view, extractData };
};
