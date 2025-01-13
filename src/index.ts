import { Elysia, t } from "elysia";

const app = new Elysia().get("/", () => "Hello Elysia").listen(3000);

app.post(
  "/slack/:challenge",
  (req) => {
    console.log(req.params.challenge);

    return { challenge: req.params.challenge };
  },
  {
    params: t.Object({
      challenge: t.String(),
    }),
  }
);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
