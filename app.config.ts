import { env } from "./env.config";

export const AppPermission = {
  [env.SLACK_APP_ID]: env.SLACK_APP_SECRET,
};
