import { ViewOutput } from "@slack/bolt";
import { AnyBlock } from "@slack/types";

export const stringInput = (
  label: string,
  block_id: string,
  action_id: string
) => {
  const block: AnyBlock = {
    type: "input",
    block_id: block_id,
    element: {
      type: "plain_text_input",
      action_id,
    },
    label: {
      type: "plain_text",
      text: label,
    },
  };
  return block;
};

export const extractStringInput = (data: {
  view: ViewOutput;
  block_id: string;
  action_id: string;
}) => {
  const { view, block_id, action_id } = data;
  return view.state.values[block_id][action_id]?.value as string;
};
