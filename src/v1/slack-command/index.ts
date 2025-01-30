import Elysia from "elysia";
import { appList } from "./app.list";
import { AppList2 } from "./app.list2";

export const slackCommand = new Elysia().use(appList).use(AppList2);
