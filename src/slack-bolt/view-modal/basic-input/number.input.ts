import { ViewOutput } from "@slack/bolt";
import { AnyBlock } from "@slack/types";

export const numberInput = (
  label: string,
  block_id: string,
  action_id: string
) => {
  const block: AnyBlock = {
    type: "input",
    block_id: block_id,
    element: {
      type: "number_input",
      is_decimal_allowed: false,
      action_id,
      min_value: "0",
      max_value: "24",
    },
    label: {
      type: "plain_text",
      text: label,
    },
  };
  return block;
};

export const extractNumberInput = (data: {
  view: ViewOutput;
  block_id: string;
  action_id: string;
}) => {
  const { view, block_id, action_id } = data;
  return view.state.values[block_id][action_id]?.value as string;
};
