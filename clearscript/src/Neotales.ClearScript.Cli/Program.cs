using Neotales.ClearScript;

if (args.Length < 1)
{
    Console.Error.WriteLine("usage: neotales-clearscript <bundle.js> [script args...]");
    return 2;
}

var bundle = args[0];
if (!File.Exists(bundle))
{
    Console.Error.WriteLine($"bundle not found: {bundle}");
    return 2;
}

var options = new NeotalesEngineOptions
{
    Args = args[1..],
    WorkingDirectory = Path.GetDirectoryName(Path.GetFullPath(bundle)) ?? Environment.CurrentDirectory,
};

using var engine = NeotalesScriptEngine.Create(options);
try
{
    await engine.RunFileAsync(bundle).ConfigureAwait(false);
}
catch (Exception error)
{
    Console.Error.WriteLine(error.Message);
    return 1;
}

// The scenario fixtures already print their report through `console.log`. Only fall back to
// writing the report here when the script published one without touching standard output.
if (engine.StandardOutput.WriteCount == 0)
{
    var report = engine.ReadReport();
    if (report is not null) Console.WriteLine(report);
}

return engine.ExitCode ?? 0;
