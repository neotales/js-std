using System.Reflection;
using System.Text.Json;
using Microsoft.ClearScript;
using Microsoft.ClearScript.V8;

namespace Neotales.ClearScript;

/// <summary>
/// Hosts Neotales TypeScript and JavaScript bundles on ClearScript's V8 engine.
/// </summary>
/// <remarks>
/// <para>
/// The engine installs the host primitives that the Neotales modules look for at runtime:
/// <c>process</c>, <c>process.env</c>, <c>node:fs</c>, <c>node:fs/promises</c>,
/// <c>node:os</c>, <c>node:child_process</c>, <c>console</c>, <c>TextEncoder</c>,
/// <c>TextDecoder</c>, and <c>crypto.getRandomValues</c>. Anything already defined by the engine
/// is left untouched.
/// </para>
/// <para>
/// Bundles are executed as classic scripts. A bundle that produces asynchronous work assigns a
/// promise to <c>globalThis.__neotalesPromise</c>; the host awaits it before reading the report,
/// which is how top-level-await style bundles are supported without a module loader.
/// </para>
/// </remarks>
public sealed class NeotalesScriptEngine : IDisposable
{
    private const string ShimResource = "Neotales.ClearScript.Resources.neotales-shim.js";
    private const string PromiseExpression =
        "typeof globalThis.__neotalesPromise === \"undefined\" ? null : globalThis.__neotalesPromise";
    private const string DrainExpression =
        "typeof globalThis.__neotalesDrain === \"function\" ? globalThis.__neotalesDrain() : null";
    private const string ExitedExpression = "globalThis.__neotalesExited === true";

    private readonly NeotalesEngineOptions options;
    private readonly V8Runtime? runtime;
    private bool disposed;

    private NeotalesScriptEngine(NeotalesEngineOptions options, V8Runtime? runtime, V8ScriptEngine engine)
    {
        this.options = options;
        this.runtime = runtime;
        Engine = engine;
    }

    /// <summary>Gets the underlying ClearScript engine.</summary>
    public V8ScriptEngine Engine { get; }

    /// <summary>Gets the options used to build the engine.</summary>
    public NeotalesEngineOptions Options => options;

    /// <summary>Gets the .NET system information host.</summary>
    public NeotalesSystem System { get; private set; } = new();

    /// <summary>Gets the host standard output stream.</summary>
    public NeotalesStandardStream StandardOutput { get; private set; } = new(Console.Out, "stdout", false);

    /// <summary>Gets the host standard error stream.</summary>
    public NeotalesStandardStream StandardError { get; private set; } = new(Console.Error, "stderr", false);

    /// <summary>Creates an engine with the Neotales compatibility layer installed.</summary>
    /// <param name="options">Optional engine configuration.</param>
    public static NeotalesScriptEngine Create(NeotalesEngineOptions? options = null)
    {
        var settings = options ?? new NeotalesEngineOptions();
        var constraints = new V8RuntimeConstraints { MaxOldSpaceSize = settings.MaxOldSpaceSize };

        V8Runtime? owned = null;
        V8ScriptEngine engine;
        var flags = V8ScriptEngineFlags.None;
        if (settings.EnableTaskPromiseConversion) flags |= V8ScriptEngineFlags.EnableTaskPromiseConversion;

        if (settings.EnableDynamicModuleImports)
        {
            owned = new V8Runtime(
                constraints,
                V8RuntimeFlags.EnableDynamicModuleImports,
                settings.MaxEngineInstances);
            engine = owned.CreateScriptEngine(flags);
        }
        else
        {
            engine = new V8ScriptEngine(constraints, flags, settings.MaxEngineInstances);
        }

        var scriptEngine = new NeotalesScriptEngine(settings, owned, engine);
        scriptEngine.Install();
        return scriptEngine;
    }

    /// <summary>Runs a bundle from disk and awaits any promise it registers.</summary>
    /// <param name="path">The path to the bundled JavaScript file.</param>
    public async Task RunFileAsync(string path)
    {
        var full = Path.GetFullPath(path, options.WorkingDirectory);
        var code = await File.ReadAllTextAsync(full).ConfigureAwait(false);
        await RunAsync(code, full).ConfigureAwait(false);
    }

    /// <summary>Runs bundle source and awaits any promise it registers.</summary>
    /// <param name="code">The bundle source.</param>
    /// <param name="documentName">An optional document name used in stack traces.</param>
    public async Task RunAsync(string code, string? documentName = null)
    {
        ObjectDisposedException.ThrowIf(disposed, this);
        try
        {
            if (documentName is null) Engine.Execute(code);
            else Engine.Execute(new DocumentInfo(documentName) { Category = DocumentCategory.Script }, code);
        }
        catch (ScriptEngineException) when (Exited())
        {
            return;
        }

        if (!options.EnableTaskPromiseConversion) return;
        await AwaitPending().ConfigureAwait(false);
    }

    /// <summary>Gets the exit code requested by <c>process.exit</c>, or <c>null</c>.</summary>
    public int? ExitCode =>
        Evaluate("typeof globalThis.process !== \"undefined\" && typeof process.exitCode === \"number\" ? process.exitCode : null")
            as int?;

    private async Task AwaitPending()
    {
        for (var pass = 0; pass < 32; pass++)
        {
            Task? pending = null;
            if (Engine.Evaluate(PromiseExpression) is Task registered) pending = registered;
            if (pending is null && Engine.Evaluate(DrainExpression) is Task drained) pending = drained;
            if (pending is null) return;
            await pending.ConfigureAwait(false);
        }
    }

    private bool Exited() => Engine.Evaluate(ExitedExpression) as bool? == true;

    /// <summary>Evaluates an expression and returns the result as an object.</summary>
    /// <param name="expression">The JavaScript expression to evaluate.</param>
    public object? Evaluate(string expression)
    {
        ObjectDisposedException.ThrowIf(disposed, this);
        return Engine.Evaluate(expression);
    }

    /// <summary>Reads the JSON report published by the runtime-test emit helper.</summary>
    /// <returns>The JSON text, or <c>null</c> when the script did not publish a report.</returns>
    public string? ReadReport()
    {
        var json = Evaluate(
            "JSON.stringify(globalThis.__NEOTALES_RUNTIME_REPORT__ ?? globalThis.__neotalesReport ?? null)")
            as string;
        return string.IsNullOrEmpty(json) || json == "null" ? null : json;
    }

    /// <inheritdoc />
    public void Dispose()
    {
        if (disposed) return;
        disposed = true;
        Engine.Dispose();
        runtime?.Dispose();
    }

    private void Install()
    {
        System = new NeotalesSystem();
        var environment = new NeotalesEnvironment();
        var fileSystem = new NeotalesFileSystem(options.WorkingDirectory);
        var childProcess = new NeotalesChildProcess(options.WorkingDirectory);
        var crypto = new NeotalesCrypto();
        StandardOutput = new NeotalesStandardStream(
            Console.Out,
            "stdout",
            Console.IsOutputRedirected is false);
        StandardError = new NeotalesStandardStream(
            Console.Error,
            "stderr",
            Console.IsErrorRedirected is false);

        Engine.AddHostObject("__neotalesSystem", System);
        Engine.AddHostObject("__neotalesEnvironment", environment);
        Engine.AddHostObject("__neotalesFileSystem", fileSystem);
        Engine.AddHostObject("__neotalesChildProcess", childProcess);
        Engine.AddHostObject("__neotalesCrypto", crypto);
        Engine.AddHostObject("__neotalesStdout", StandardOutput);
        Engine.AddHostObject("__neotalesStderr", StandardError);
        Engine.Execute($"globalThis.__neotalesConfig = {JsonSerializer.Serialize(options.Args)};");
        Engine.Execute(LoadShim());
    }

    private static string LoadShim()
    {
        using var stream = typeof(NeotalesScriptEngine).GetTypeInfo()
            .Assembly.GetManifestResourceStream(ShimResource)
            ?? throw new InvalidOperationException($"Missing embedded resource {ShimResource}.");
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}
