import { ViewOutput } from "@slack/bolt";
import { AnyBlock } from "@slack/types";

export const dayInput = (
  label: string,
  block_id: string,
  action_id: string
) => {
  const block: AnyBlock = {
    type: "input",
    block_id,
    optional: true,
    element: {
      type: "number_input",
      action_id,
      is_decimal_allowed: false,
      min_value: "0",
      max_value: "6",
    },
    label: {
      type: "plain_text",
      text: label,
    },
  };
  return block;
};

export const extractDayInput = (data: {
  view: ViewOutput;
  block_id: string;
  action_id: string;
}) => {
  const { view, block_id, action_id } = data;
  return view.state.values[block_id][action_id]?.value as string;
};
