using Microsoft.ClearScript;
using Microsoft.ClearScript.V8;

if (args.Length != 1)
{
    Console.Error.WriteLine("usage: RuntimeLab <bundle.js>");
    return 2;
}

using var engine = new V8ScriptEngine();
engine.Execute(File.ReadAllText(args[0]));
var json = engine.Evaluate("JSON.stringify(globalThis.__NEOTALES_RUNTIME_REPORT__)") as string ?? "null";
Console.WriteLine($"__NEOTALES_RUNTIME_RESULT__{json}");
return 0;
