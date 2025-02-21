import { App } from "@slack/bolt";
import { env } from "../../env.config";
import { alertsEvents } from "./alerts";
import { testSlack } from "./test-slack-functions";
import { projectCommands } from "./cloud-core-command/project.command";
import { ExtendedErrorHandlerArgs } from "@slack/bolt/dist/App";
import { onCallScheduleCommands } from "./schedule-commands/on.call.schedule.command";
import { applicationCommands } from "./cloud-core-command/application.command";
import { onCallGroupsCommands } from "./schedule-commands/groups-commands/on.call.groups.command";

export const bolt = new App({
  token: env.SLACK_BOT_TOKEN,
  signingSecret: env.SLACK_SIGNING_SECRET,
  port: env.SLACK_PORT,
  extendedErrorHandler: true,
});

bolt.error(async (data: ExtendedErrorHandlerArgs) => {
  const { error, logger, context, body } = data;
  logger.error({
    error: error.message || error,
    eventType: body.type,
    user: body.user,
  });

  if (
    context &&
    context.userId &&
    body.type === "event_callback" &&
    body.event.type === "message"
  ) {
    await bolt.client.chat.postEphemeral({
      channel: body.event.channel,
      user: context.userId,
      text: `Something went wrong: ${error.message || error}`,
    });
  }
});

// ============================================================== //
// Routes
// ============================================================== //

// apps
applicationCommands(bolt);

// projects
projectCommands(bolt);

// alerts
alertsEvents(bolt);

// on call schedules
onCallScheduleCommands(bolt);

// groups
onCallGroupsCommands(bolt);

// test slack
testSlack(bolt);

// ============================================================== //

(async () => {
  // Start your app
  await bolt.start();

  bolt.logger.info(`⚡️ Bolt app is running at localhost:${env.SLACK_PORT}`);
})();
