import { deepStrictEqual as equal, ok, throws } from "node:assert/strict";
import { test } from "node:test";
import { expand, expandAsync, UnpermittedCommandError, } from "./expand.js";
// Helper functions to simulate environment variable access
function createEnv() {
    const env = {};
    return {
        env,
        get: (key) => env[key],
        set: (key, value) => {
            env[key] = value;
        },
    };
}
function versionCommand() {
    const deno = globalThis.Deno;
    if (deno) {
        return {
            command: `${JSON.stringify(deno.execPath())} --version`,
            expected: `deno ${deno.version.deno}`,
        };
    }
    return { command: `${JSON.stringify(process.execPath)} --version`, expected: process.version };
}
// Basic bash variable expansion tests
test("expand::basic bash variable ${VAR}", () => {
    const { env, get, set } = createEnv();
    env["NAME"] = "Alice";
    const result = expand("Hello, ${NAME}!", get, set);
    equal(result, "Hello, Alice!");
});
test("expand::basic bash variable $VAR", () => {
    const { env, get, set } = createEnv();
    env["NAME"] = "Bob";
    const result = expand("Hello, $NAME!", get, set);
    equal(result, "Hello, Bob!");
});
test("expand::multiple variables", () => {
    const { env, get, set } = createEnv();
    env["FIRST"] = "John";
    env["LAST"] = "Doe";
    const result = expand("${FIRST} ${LAST}", get, set);
    equal(result, "John Doe");
});
test("expand::empty template", () => {
    const { get, set } = createEnv();
    const result = expand("", get, set);
    equal(result, "");
});
test("expand::no variables", () => {
    const { get, set } = createEnv();
    const result = expand("Hello, World!", get, set);
    equal(result, "Hello, World!");
});
// Default value tests with :-
test("expand::default value with :- when variable is unset", () => {
    const { get, set } = createEnv();
    const result = expand("${UNSET:-default}", get, set);
    equal(result, "default");
});
test("expand::default value with :- when variable is set", () => {
    const { env, get, set } = createEnv();
    env["SET"] = "value";
    const result = expand("${SET:-default}", get, set);
    equal(result, "value");
});
test("expand::default value with : when variable is unset", () => {
    const { get, set } = createEnv();
    const result = expand("${UNSET:fallback}", get, set);
    equal(result, "fallback");
});
// Assignment tests with :=
test("expand::assignment with := when variable is unset", () => {
    const { env, get, set } = createEnv();
    const result = expand("${NEW_VAR:=assigned}", get, set);
    equal(result, "assigned");
    equal(env["NEW_VAR"], "assigned");
});
test("expand::assignment with := when variable is set", () => {
    const { env, get, set } = createEnv();
    env["EXISTING"] = "original";
    const result = expand("${EXISTING:=ignored}", get, set);
    equal(result, "original");
    equal(env["EXISTING"], "original");
});
test("expand::assignment disabled with variableAssignment=false", () => {
    const { env, get, set } = createEnv();
    const result = expand("${NEW_VAR2:=value}", get, set, { variableAssignment: false });
    equal(result, "value");
    equal(env["NEW_VAR2"], undefined);
});
// Error message tests with :?
test("expand::error with :? when variable is unset", () => {
    const { get, set } = createEnv();
    throws(() => {
        expand("${MISSING:?Variable MISSING is required}", get, set);
    }, /Variable MISSING is required/);
});
test("expand::error with :? when variable is set", () => {
    const { env, get, set } = createEnv();
    env["PRESENT"] = "exists";
    const result = expand("${PRESENT:?Should not throw}", get, set);
    equal(result, "exists");
});
test("expand::error disabled with customErrorMessage=false", () => {
    const { get, set } = createEnv();
    throws(() => {
        expand("${MISSING:?Custom message}", get, set, { customErrorMessage: false });
    });
});
// Windows-style expansion tests
test("expand::windows expansion with %VAR%", () => {
    const { env, get, set } = createEnv();
    env["USER"] = "Administrator";
    const result = expand("Hello, %USER%!", get, set, { windowsExpansion: true });
    equal(result, "Hello, Administrator!");
});
test("expand::windows expansion disabled", () => {
    const { env, get, set } = createEnv();
    env["USER"] = "Admin";
    const result = expand("%USER%", get, set, { windowsExpansion: false });
    equal(result, "%USER%");
});
test("expand::windows consecutive percent signs throw", () => {
    const { get, set } = createEnv();
    throws(() => {
        expand("100%% complete", get, set, { windowsExpansion: true });
    }, "missing closing token");
});
// Escape sequence tests
test("expand::escaped dollar sign", () => {
    const { env, get, set } = createEnv();
    env["VAR"] = "value";
    const result = expand("Price: \\$100", get, set);
    equal(result, "Price: $100");
});
test("expand::escaped dollar followed by variable", () => {
    const { env, get, set } = createEnv();
    env["VAR"] = "value";
    const result = expand("\\$VAR is ${VAR}", get, set);
    equal(result, "$VAR is value");
});
// Variable name validation tests
test("expand::invalid variable name throws", () => {
    const { get, set } = createEnv();
    throws(() => {
        expand("${123invalid}", get, set);
    }, "invalid variable name");
});
test("expand::empty braces returns literal", () => {
    const { get, set } = createEnv();
    // ${} with insufficient characters is returned as literal
    const result = expand("${}", get, set);
    equal(result, "${}");
});
test("expand::unclosed brace throws", () => {
    const { get, set } = createEnv();
    throws(() => {
        expand("${UNCLOSED", get, set);
    }, "missing closing token");
});
test("expand::unclosed windows percent throws", () => {
    const { get, set } = createEnv();
    throws(() => {
        expand("%UNCLOSED", get, set, { windowsExpansion: true });
    }, "missing closing token");
});
// Variable with underscore
test("expand::variable with underscore", () => {
    const { env, get, set } = createEnv();
    env["MY_VAR_NAME"] = "test_value";
    const result = expand("${MY_VAR_NAME}", get, set);
    equal(result, "test_value");
});
test("expand::variable starting with underscore throws", () => {
    const { env, get, set } = createEnv();
    env["_PRIVATE"] = "secret";
    throws(() => {
        expand("${_PRIVATE}", get, set);
    }, "invalid variable name");
});
// Backslash to separate variable from text
test("expand::backslash separates variable from text", () => {
    const { env, get, set } = createEnv();
    env["HOME"] = "/home/user";
    const result = expand("$HOME\\_TEST", get, set);
    equal(result, "/home/user_TEST");
});
// Mixed expansion tests
test("expand::mixed bash and windows in same string", () => {
    const { env, get, set } = createEnv();
    env["BASH_VAR"] = "bash";
    env["WIN_VAR"] = "windows";
    const result = expand("${BASH_VAR} and %WIN_VAR%", get, set, { windowsExpansion: true });
    equal(result, "bash and windows");
});
test("expand::uses option accessors directly", () => {
    equal(expand("${VALUE}", { get: () => "custom" }), "custom");
});
test("expandAsync::resolves protocol values", async () => {
    const result = await expandAsync("token=${SECRET_URL}", {
        get: () => "keepass:///vault.kdbx?key=api/token",
        protocolHandler: async () => "resolved-secret",
    });
    equal(result, "token=resolved-secret");
});
// Options tests
test("expand::variableExpansion disabled", () => {
    const { env, get, set } = createEnv();
    env["VAR"] = "value";
    const result = expand("${VAR}", get, set, { variableExpansion: false });
    equal(result, "${VAR}");
});
test("expand::custom get function", () => {
    const { get, set } = createEnv();
    const options = {
        get: () => "custom_value",
    };
    const result = expand("${ANY_VAR}", get, set, options);
    equal(result, "custom_value");
});
test("expand::custom set function", () => {
    const captured = { key: "", value: "" };
    const { get, set } = createEnv();
    const options = {
        set: (key, value) => {
            captured.key = key;
            captured.value = value;
        },
    };
    expand("${NEW:=assigned}", get, set, options);
    equal(captured.key, "NEW");
    equal(captured.value, "assigned");
});
// Complex template tests
test("expand::complex template with multiple features", () => {
    const { env, get, set } = createEnv();
    env["BASE"] = "/usr";
    env["APP"] = "myapp";
    const result = expand("${BASE}/local/bin/${APP}", get, set);
    equal(result, "/usr/local/bin/myapp");
});
test("expand::nested-like usage", () => {
    const { env, get, set } = createEnv();
    env["DIR"] = "home";
    env["home"] = "/home/user";
    // Note: true nested expansion not supported, this tests sequential expansion
    const result = expand("${DIR}", get, set);
    equal(result, "home");
});
// Edge cases
test("expand::dollar at end of string", () => {
    const { get, set } = createEnv();
    const result = expand("Price: $", get, set);
    equal(result, "Price: $");
});
test("expand::dollar followed by non-alphanumeric", () => {
    const { get, set } = createEnv();
    const result = expand("$$ money", get, set);
    equal(result, "$$ money");
});
test("expand::variable not set throws", () => {
    const { get, set } = createEnv();
    throws(() => {
        expand("${UNDEFINED_VAR}", get, set);
    }, "not set");
});
test("expand::simple variable not set throws", () => {
    const { get, set } = createEnv();
    throws(() => {
        expand("$UNDEFINED_VAR", get, set);
    }, "not set");
});
// Unicode variable values
test("expand::unicode variable value", () => {
    const { env, get, set } = createEnv();
    env["GREETING"] = "こんにちは";
    const result = expand("${GREETING}", get, set);
    equal(result, "こんにちは");
});
test("expand::emoji variable value", () => {
    const { env, get, set } = createEnv();
    env["EMOJI"] = "🎉";
    const result = expand("Party: ${EMOJI}", get, set);
    equal(result, "Party: 🎉");
});
// Default values with special characters
test("expand::default value with spaces", () => {
    const { get, set } = createEnv();
    const result = expand("${UNSET:-hello world}", get, set);
    equal(result, "hello world");
});
test("expand::default value with colon", () => {
    const { get, set } = createEnv();
    const result = expand("${UNSET:-http://example.com}", get, set);
    equal(result, "http://example.com");
});
// Command substitution tests
test("expand::command substitution basic", () => {
    const { get, set } = createEnv();
    const result = expand('$(echo "hello")', get, set, { commands: true });
    equal(result, "hello");
});
test("expand::command substitution disabled by default", () => {
    const { get, set } = createEnv();
    const result = expand('$(echo "hello")', get, set);
    equal(result, '$(echo "hello")');
});
test("expand::command substitution with surrounding text", () => {
    const { get, set } = createEnv();
    const result = expand('The value is: $(echo "test")', get, set, { commands: true });
    equal(result, "The value is: test");
});
test("expand::command substitution with variable expansion", () => {
    const { env, get, set } = createEnv();
    env["NAME"] = "world";
    const result = expand('$(echo "hello") ${NAME}', get, set, { commands: true });
    equal(result, "hello world");
});
test("expand::command substitution multiple", () => {
    const { get, set } = createEnv();
    const result = expand('$(echo "a") and $(echo "b")', get, set, { commands: true });
    equal(result, "a and b");
});
test("expand::command substitution permits an executable", () => {
    const { get, set } = createEnv();
    const command = versionCommand();
    const executable = command.command.match(/^"([^"]+)"/)?.[1] ?? command.command.split(" ")[0];
    const result = expand(`$(${command.command})`, get, set, {
        commands: { allowed: [executable], enabled: true },
    });
    ok(typeof result === "string");
});
test("expand::command substitution permits a command token prefix", () => {
    const { get, set } = createEnv();
    const command = versionCommand();
    const executable = command.command.match(/^"([^"]+)"/)?.[1] ?? command.command.split(" ")[0];
    const result = expand(`$(${command.command})`, get, set, {
        commands: [[executable, "--version"]],
    });
    ok(typeof result === "string");
});
test("expand::command substitution rejects unpermitted commands", () => {
    const { get, set } = createEnv();
    const command = versionCommand();
    throws(() => expand(`$(${command.command})`, get, set, {
        commands: ["not-the-runtime"],
    }), UnpermittedCommandError);
});
