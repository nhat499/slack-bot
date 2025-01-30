import { Static, t } from "elysia";

export const slackInfoSchema = t.Object({
  token: t.String({
    description: `
        (Deprecated) This is a verification token, a deprecated feature that you shouldn't use any more. 
        It was used to verify that requests were legitimately being sent by Slack to your app, 
        but you should use the signed secrets functionality to do this instead.`,
  }),
  channel_id: t.String({
    description: "The ID of the channel who triggered the command.",
  }),
  user_id: t.String({
    description: "The ID of the user who triggered the command.",
  }),
  user_name: t.String({
    description:
      "(Deprecated) The plain text name of the user who triggered the command. Do not rely on this field as it has been phased out. Use the user_id instead.",
  }),
  command: t.String({
    description: "The command that was entered to trigger this request.",
  }),
  text: t.String({
    description:
      "This is the part of the slash command after the command itself, and it can contain absolutely anything the user might decide to type. ",
  }),
  api_app_id: t.String({
    description:
      "Your Slack app's unique identifier. Use this in conjunction with request signing to verify context for inbound requests",
  }),
  is_enterprise_install: t.String({ description: "false" }),
  response_url: t.String({
    description:
      "A temporary webhook URL that you can use to generate message responses.",
  }),
  trigger_id: t.String({
    description: "8288667425715.8281000556390.1dd72446ad8217a2f99e29a1ba6941eb",
  }),
});

export type SlackInfo = Static<typeof slackInfoSchema>;
