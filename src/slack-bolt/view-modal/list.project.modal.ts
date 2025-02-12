import { ViewOutput } from "@slack/bolt";
import { View } from "@slack/types";
import { Direction } from "../../util/ticket.system";

export const listProjectModal = (callback_id: string) => {
  const view: View = {
    type: "modal",
    callback_id: callback_id,
    title: {
      type: "plain_text",
      text: "Project LIST",
    },
    blocks: [
      {
        type: "input",
        block_id: "search_block",
        optional: true,
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
        optional: false,
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
        optional: true,
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
                text: "Ascending",
              },
              value: "asc",
            },
            {
              text: {
                type: "plain_text",
                text: "Descending",
              },
              value: "desc",
            },
          ],
        },
        label: {
          type: "plain_text",
          text: "Direction",
        },
      },
      {
        type: "input",
        block_id: "status_block",
        optional: true,
        element: {
          type: "static_select",
          action_id: "status_input",
          placeholder: {
            type: "plain_text",
            text: "Choose status (default: all)",
          },
          options: [
            {
              text: {
                type: "plain_text",
                text: "UPCOMING",
              },
              value: "UPCOMING",
            },
            {
              text: {
                type: "plain_text",
                text: "IN_PROGRESS",
              },
              value: "IN_PROGRESS",
            },
            {
              text: {
                type: "plain_text",
                text: "HOLD",
              },
              value: "HOLD",
            },
            {
              text: {
                type: "plain_text",
                text: "DONE",
              },
              value: "DONE",
            },
          ],
        },
        label: {
          type: "plain_text",
          text: "Status",
        },
      },
    ],
    submit: {
      type: "plain_text",
      text: "Submit",
    },
  };

  const exportData = (view: ViewOutput) => {
    const search = view.state.values.search_block.search_input.value;
    const page = parseInt(
      view.state.values.page_block.page_input.value || "0",
      10
    );
    const rows = parseInt(
      view.state.values.rows_block.rows_input.value || "25",
      10
    );
    const order = view.state.values.order_block.order_input.value;
    const direction = (view.state.values.direction_block.direction_input
      .selected_option?.value || "desc") as Direction;
    const status = view.state.values.status_block.status_input.selected_option
      ?.value as "UPCOMING" | "IN_PROGRESS" | "HOLD" | "DONE" | undefined;
    return { search, page, rows, order, direction, status };
  };

  return { view, exportData };
};
