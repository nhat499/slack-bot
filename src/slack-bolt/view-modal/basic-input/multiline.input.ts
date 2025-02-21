import { ViewOutput } from "@slack/bolt";
import { AnyBlock } from "@slack/types";

export const multilineInput = (
  label: string,
  block_id: string,
  action_id: string,
  initial_value?: string
) => {
  const block: AnyBlock = {
    type: "input",
    block_id: block_id,
    element: {
      type: "plain_text_input",
      multiline: true,
      action_id,
      initial_value,
    },
    label: {
      type: "plain_text",
      text: label,
    },
  };
  return block;
};

export const extractMultilineInput = (data: {
  view: ViewOutput;
  block_id: string;
  action_id: string;
}) => {
  const { view, block_id, action_id } = data;
  return view.state.values[block_id][action_id]?.value as string;
};
