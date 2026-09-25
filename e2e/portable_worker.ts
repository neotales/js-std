import { runCoreScenario } from "../runtime-tests/scenarios/core.ts";

export default {
  fetch(): Response {
    return Response.json(runCoreScenario());
  },
};
