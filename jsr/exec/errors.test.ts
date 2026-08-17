import { deepStrictEqual as equal, ok } from "node:assert/strict";
const instanceOf = (
  value: unknown,
  constructor: abstract new (...args: never[]) => object,
  message?: string,
) => ok(value instanceof constructor, message);
const stringIncludes = (value: string, expected: string, message?: string) =>
  ok(value.includes(expected), message);
import { test } from "node:test";
import { CommandError, NotFoundOnPathError } from "./errors.ts";

test("exec::CommandError - creates with options", () => {
  const cause = new Error("root cause");
  const error = new CommandError({
    fileName: "test-command",
    code: 1,
    message: "Test error message",
    args: ["--flag", "value"],
    target: "test-target",
    cause,
  });

  instanceOf(error, Error);
  instanceOf(error, CommandError);
  equal(error.name, "CommandError");
  equal(error.exitCode, 1);
  equal(error.fileName, "test-command");
  equal(error.args?.length, 2);
  equal(error.target, "test-target");
  stringIncludes(error.message, "Test error message");
  equal((error as Error & { cause?: unknown }).cause, cause);
});

test("exec::CommandError - creates with message string", () => {
  const error = new CommandError("Simple error message");

  instanceOf(error, CommandError);
  equal(error.message, "Simple error message");
  equal(error.name, "CommandError");
});

test("exec::CommandError - generates default message from options", () => {
  const error = new CommandError({
    fileName: "my-cmd",
    code: 42,
  });

  stringIncludes(error.message, "my-cmd");
  stringIncludes(error.message, "42");
});

test("exec::CommandError - has link property", () => {
  const error = new CommandError({ fileName: "test" });
  ok(error.link);
  stringIncludes(error.link!, "CommandError");
});

test("exec::CommandError - custom link property", () => {
  const error = new CommandError({
    fileName: "test",
    link: "https://example.com/docs/error",
  });
  equal(error.link, "https://example.com/docs/error");
});

test("exec::NotFoundOnPathError - creates with options", () => {
  const cause = new Error("root cause");
  const error = new NotFoundOnPathError({
    exe: "missing-exe",
    target: "build-step",
    cause,
  });

  instanceOf(error, Error);
  instanceOf(error, NotFoundOnPathError);
  equal(error.name, "NotFoundOnPathError");
  equal(error.exe, "missing-exe");
  equal(error.target, "build-step");
  stringIncludes(error.message, "missing-exe");
  equal((error as Error & { cause?: unknown }).cause, cause);
});

test("exec::NotFoundOnPathError - creates with message string", () => {
  const error = new NotFoundOnPathError("Custom not found message");

  instanceOf(error, NotFoundOnPathError);
  equal(error.message, "Custom not found message");
});

test("exec::NotFoundOnPathError - default constructor", () => {
  const error = new NotFoundOnPathError();

  instanceOf(error, NotFoundOnPathError);
  equal(error.name, "NotFoundOnPathError");
  ok(error.message); // Has some default message
});

test("exec::NotFoundOnPathError - has link property", () => {
  const error = new NotFoundOnPathError({ exe: "test" });
  ok(error.link);
  stringIncludes(error.link!, "NotFoundOnPathError");
});

test("exec::NotFoundOnPathError - generates message with exe name", () => {
  const error = new NotFoundOnPathError({
    exe: "my-special-tool",
  });

  stringIncludes(error.message, "my-special-tool");
  stringIncludes(error.message, "PATH");
});
