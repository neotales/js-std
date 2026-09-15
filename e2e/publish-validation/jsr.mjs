import { runSmokeTests } from "./catalog.mjs";
import { publishedModules } from "./modules.mjs";

const packages = await publishedModules();

await runSmokeTests(packages, (name, version) => import(`jsr:${name}@${version}`));
