import { cleanEnv, port, str } from "envalid";

export const env = cleanEnv(process.env, {
  PORT: port({ default: 5000 }),
  SLACK_PORT: port({ default: 5020 }), // socket endpoint for slack
  NODE_ENV: str({ default: "development" }),

  // CLOUD CORE
  CLOUD_CORE_URL: str({ default: "http://localhost:8080" }),
  SLACK_APP_SECRET: str({ desc: "secret for slack application on cloud core" }),
  SLACK_APP_ID: str({ desc: "app id for slack application on cloud core" }),
  CLOUD_CORE_AUTH: str(),
  SLACK_USER_ID: str(),

  // SLACK BOT
  SLACK_BOT_TOKEN: str(),
  SLACK_SIGNING_SECRET: str(),
  SLACK_APP_TOKEN: str(),
});
