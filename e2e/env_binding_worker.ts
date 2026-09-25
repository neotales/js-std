import { env } from "cloudflare:workers";
import { expand } from "../jsr/env/expand.ts";

export default {
  fetch(): Response {
    const value = String(env.NEOTALES_RUNTIME_ENV ?? "");
    return Response.json({
      binding: value,
      expanded: expand("${NEOTALES_RUNTIME_ENV}", {
        get: (name) => name === "NEOTALES_RUNTIME_ENV" ? value : undefined,
      }),
    });
  },
};
