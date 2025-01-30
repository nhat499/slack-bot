import Elysia from "elysia";
import { slackCommand } from "./slack-command";

export const v1 = new Elysia().group("/v1", (app) => app.use(slackCommand));
