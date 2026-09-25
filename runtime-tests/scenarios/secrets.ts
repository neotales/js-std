import { createSecret, SecretKey } from "../../jsr/secrets/mod.ts";

export type SecretsScenarioReport = {
  keyBytes: number;
  masked: string;
  text: string;
};

/** Exercises the Web Crypto-backed default secrets entry point. */
export async function runSecretsScenario(): Promise<SecretsScenarioReport> {
  const secret = await createSecret("embedded-token");
  const key = SecretKey.generate();
  return {
    keyBytes: key.exportRaw().byteLength,
    masked: String(secret),
    text: await secret.unprotectText(),
  };
}
