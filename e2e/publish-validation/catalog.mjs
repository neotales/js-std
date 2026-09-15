function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function equal(actual, expected, message) {
  assert(
    actual === expected,
    `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
  );
}

function equalArrays(actual, expected, message) {
  equal(JSON.stringify(actual), JSON.stringify(expected), message);
}

const smokeTests = {
  "@neotales/ansi": (mod) => {
    equal(
      mod.stripAnsiCode("\x1b[31mred\x1b[0m"),
      "red",
      "stripAnsiCode should remove color codes",
    );
  },
  "@neotales/args": (mod) => {
    equal(mod.join(["echo", "hello"]), "echo hello", "join should format arguments");
  },
  "@neotales/chars": (mod) => {
    equal(mod.isAscii(65), true, "isAscii should recognize ASCII code points");
  },
  "@neotales/dotenv": (mod) => {
    equal(mod.parse("NAME=neotales").NAME, "neotales", "parse should read dotenv values");
  },
  "@neotales/env": (mod) => {
    const path = mod.joinPath(["first", "second"]);
    assert(path.includes("first") && path.includes("second"), "joinPath should join path entries");
  },
  "@neotales/exec": (mod) => {
    equalArrays(
      mod.convertCommandArgs(["echo", "ok"]),
      ["echo", "ok"],
      "convertCommandArgs should preserve arrays",
    );
  },
  "@neotales/fmt": (mod) => {
    equal(mod.sprintf("%s %d", "value", 42), "value 42", "sprintf should format arguments");
  },
  "@neotales/fs": (mod) => {
    assert(mod.cwd().length > 0, "cwd should return the current directory");
  },
  "@neotales/path": (mod) => {
    assert(/first[/\\]second$/.test(mod.join("first", "second")), "join should create a path");
  },
  "@neotales/process": (mod) => {
    assert(mod.cwd().length > 0, "cwd should return the current directory");
    assert(Number.isInteger(mod.pid) && mod.pid > 0, "pid should return a process identifier");
  },
  "@neotales/results": (mod) => {
    equal(mod.ok("success").orThrow(), "success", "ok should return its value");
  },
  "@neotales/secrets": (mod) => {
    equal(mod.generateSecret(16).length, 16, "generateSecret should return the requested length");
  },
  "@neotales/slices": (mod) => {
    equal(
      String.fromCodePoint(...mod.camelize("hello_world")),
      "helloWorld",
      "camelize should convert to camel case",
    );
  },
  "@neotales/strings": (mod) => {
    equal(mod.camelize("hello_world"), "helloWorld", "camelize should convert to camel case");
  },
};

export async function runSmokeTests(packages, importModule) {
  for (const { name, version } of packages) {
    const smokeTest = smokeTests[name];
    assert(smokeTest, `No smoke test is defined for ${name}`);

    const mod = await importModule(name, version);
    await smokeTest(mod);
    console.log(`Validated ${name}@${version}`);
  }
}
