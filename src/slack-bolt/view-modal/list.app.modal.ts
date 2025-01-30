import { ViewOutput } from "@slack/bolt";
import { View } from "@slack/types";
import { Direction } from "../../ticket.system.service";
export const listModal = (callback_id: string) => {
  const view: View = {
    type: "modal",
    callback_id: callback_id,
    title: {
      type: "plain_text",
      text: "Application LIST",
    },
    blocks: [
      {
        type: "input",
        optional: true,
        block_id: "search_block",
        element: {
          type: "plain_text_input",
          action_id: "search_input",
          placeholder: {
            type: "plain_text",
            text: "Enter search query",
          },
        },
        label: {
          type: "plain_text",
          text: "Search",
        },
      },
      {
        type: "input",
        block_id: "page_block",
        element: {
          type: "plain_text_input",
          action_id: "page_input",
          placeholder: {
            type: "plain_text",
            text: "Enter page number (default: 0)",
          },
          initial_value: "0",
        },
        label: {
          type: "plain_text",
          text: "Page",
        },
      },
      {
        type: "input",
        block_id: "rows_block",
        element: {
          type: "plain_text_input",
          action_id: "rows_input",
          placeholder: {
            type: "plain_text",
            text: "Enter number of rows (default: 25)",
          },
          initial_value: "25",
        },
        label: {
          type: "plain_text",
          text: "Rows",
        },
      },
      {
        type: "input",
        block_id: "order_block",
        element: {
          type: "plain_text_input",
          action_id: "order_input",
          placeholder: {
            type: "plain_text",
            text: "Enter order field (default: createdAt)",
          },
          initial_value: "createdAt",
        },
        label: {
          type: "plain_text",
          text: "Order",
        },
      },
      {
        type: "input",
        block_id: "direction_block",
        element: {
          type: "static_select",
          action_id: "direction_input",
          placeholder: {
            type: "plain_text",
            text: "Choose direction (default: desc)",
          },
          options: [
            {
              text: {
                type: "plain_text",
                text: "ASC",
              },
              value: "asc",
            },
            {
              text: {
                type: "plain_text",
                text: "DESC",
              },
              value: "desc",
            },
          ],
          initial_option: {
            text: {
              type: "plain_text",
              text: "DESC",
            },
            value: "desc",
          },
        },
        label: {
          type: "plain_text",
          text: "Direction",
        },
      },
    ],
    submit: {
      type: "plain_text",
      text: "Submit",
    },
  };

  const extractData = (view: ViewOutput) => {
    const search = view.state.values.search_block.search_input.value;
    const page = parseInt(
      view.state.values.page_block.page_input.value || "0",
      10
    );
    const rows = parseInt(
      view.state.values.rows_block.rows_input.value || "25",
      10
    );
    const order =
      view.state.values.order_block.order_input.value || "createdAt";
    const direction = (view.state.values.direction_block.direction_input
      .selected_option?.value || "desc") as Direction;
    return { search, page, rows, order, direction };
  };

  return { view, extractData };
};
