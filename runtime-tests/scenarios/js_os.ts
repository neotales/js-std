type Availability = { available: boolean; entries?: unknown; uidMatches?: boolean };

export type JsOsScenarioReport = {
  isElevated: Availability;
  libsecret: Availability;
  winCred: Availability;
  winDpapi: Availability;
  winRegistry: Availability;
};

type ModuleShape = {
  isElevated?: (cache?: boolean) => boolean;
  isElevatedAvailable?: () => boolean;
  isAvailable?: () => boolean;
  isRegistryAvailable?: () => boolean;
  isDpapiAvailable?: () => boolean;
  isLinuxKeyringAvailable?: () => boolean;
  listSecrets?: (service: string) => unknown[];
};

/**
 * Records how the js-os modules behave on the ClearScript host.
 *
 * The vault modules probe for a foreign function interface during module evaluation. ClearScript
 * has none, so each of them is expected to load successfully and report `available: false`, which
 * is exactly what their `isAvailable()` predicates promise for unsupported hosts.
 *
 * Elevation detection has a POSIX implementation that only needs `process.geteuid`, so it is
 * expected to work. Its answer depends on how the test process is launched, so the report
 * records whether the answer agrees with the real user id instead of the answer itself.
 */
export function runJsOsScenario(modules: Record<string, ModuleShape>): JsOsScenarioReport {
  return {
    isElevated: elevationOf(modules.isElevated),
    libsecret: availabilityOf(modules.libsecret, "isLinuxKeyringAvailable"),
    winCred: availabilityOf(modules.winCred, "isAvailable"),
    winDpapi: availabilityOf(modules.winDpapi, "isDpapiAvailable"),
    winRegistry: availabilityOf(modules.winRegistry, "isRegistryAvailable"),
  };
}

function elevationOf(module: ModuleShape | undefined): Availability {
  if (!module?.isElevated) return { available: false };
  const available = module.isElevatedAvailable?.() ?? true;
  const uid = process.geteuid?.() ?? process.getuid?.() ?? -1;
  return {
    available,
    uidMatches: module.isElevated(false) === (uid === 0),
  };
}

function availabilityOf(
  module: ModuleShape | undefined,
  predicate: "isAvailable" | "isRegistryAvailable" | "isDpapiAvailable" | "isLinuxKeyringAvailable",
): Availability {
  if (!module) return { available: false };
  const available = module[predicate]?.() ?? false;
  const result: Availability = { available };
  if (!available && module.listSecrets) result.entries = module.listSecrets("neotales");
  return result;
}
