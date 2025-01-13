import { Elysia, t } from "elysia";

const app = new Elysia().get("/", () => "Hello Elysia").listen(5000);

app.post(
  "/slack/:challenge",
  ({ params, set, body }) => {
    set.status = 200;
    return { challenge: body.challenge };
  },
  {
    params: t.Object({
      challenge: t.String(),
    }),
    body: t.Object({
      token: t.String(),
      challenge: t.String(),
      type: t.String(),
    }),
  }
);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
