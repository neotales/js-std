import { equal, ok, throws } from "node:assert/strict";
import { test } from "node:test";
import { DefaultSecretGenerator, generateSecret, secretGenerator, validate } from "./generator.js";
test("secrets::validate requires every default password class", () => {
    ok(validate(new TextEncoder().encode("aB1!")));
    ok(!validate(new TextEncoder().encode("aB1c")));
    ok(!validate(new Uint8Array()));
});
test("secrets::DefaultSecretGenerator generates valid default secrets", () => {
    const secret = new DefaultSecretGenerator().addDefaults().generate(16);
    equal(secret.length, 16);
    ok(validate(new TextEncoder().encode(secret)));
});
test("secrets::DefaultSecretGenerator supports configurable pools and validators", () => {
    const generator = new DefaultSecretGenerator().add("abc").setValidator(() => true);
    const bytes = generator.generateAsUint8Array(12);
    equal(bytes.length, 12);
    ok([...bytes].every((byte) => byte === 97 || byte === 98 || byte === 99));
    equal(generator.generate(5).length, 5);
});
test("secrets::DefaultSecretGenerator supports character helpers", () => {
    const generator = new DefaultSecretGenerator().addLower().addUpper().addDigits().addSpecialSafe();
    equal(generator.generate(16).length, 16);
});
test("secrets::DefaultSecretGenerator rejects invalid inputs and impossible validators", () => {
    throws(() => new DefaultSecretGenerator().generate(1), /without characters/);
    throws(() => new DefaultSecretGenerator().add("a").generate(0), /positive safe integer/);
    throws(() => new DefaultSecretGenerator().add("a").add("😀"), /single byte/);
    throws(() => new DefaultSecretGenerator()
        .add("a")
        .setValidator(() => false)
        .generate(1), /Failed to generate/);
});
test("secrets::generateSecret and secretGenerator use default characters", () => {
    equal(generateSecret(16).length, 16);
    equal(secretGenerator.generate(16).length, 16);
});
