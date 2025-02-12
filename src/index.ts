import Elysia, { t } from "elysia";
import { handleError } from "./util/error.handlers";
import swagger from "@elysiajs/swagger";
import { v1 } from "./v1";
import { vTest } from "./v-test";
import ScheduleHandler from "./util/on-call-schedule/schedule.handler";

//===========================================================//
// INITIALIZE VARIABLES
//===========================================================//

const router = new Elysia().onError(handleError);

export const scheduleHandler = new ScheduleHandler();
await scheduleHandler.init();

//===========================================================//
// ROUTES
//===========================================================//
router.post("/hc", async ({ body, headers }) => {
  return "healthy";
});

// testing
router.use(vTest);

router.use(v1);

//===========================================================//
router.listen(5000);
console.log(
  `🦊 Elysia is running at ${router.server?.hostname}:${router.server?.port}`
);
