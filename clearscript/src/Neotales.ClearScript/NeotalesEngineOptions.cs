namespace Neotales.ClearScript;

/// <summary>
/// Configures the host objects and engine flags installed by <see cref="NeotalesScriptEngine"/>.
/// </summary>
public sealed class NeotalesEngineOptions
{
    /// <summary>Script arguments exposed to JavaScript as <c>process.argv</c>.</summary>
    public string[] Args { get; set; } = [];

    /// <summary>Working directory reported by <c>process.cwd()</c> and used to resolve relative paths.</summary>
    public string WorkingDirectory { get; set; } = Environment.CurrentDirectory;

    /// <summary>Installs <c>process</c>, <c>process.getBuiltinModule</c>, and the Node-compatible shims.</summary>
    public bool InstallProcess { get; set; } = true;

    /// <summary>Installs <c>process.env</c> backed by the real process environment.</summary>
    public bool InstallEnvironment { get; set; } = true;

    /// <summary>Installs the <c>node:fs</c> and <c>node:fs/promises</c> shims backed by <c>System.IO</c>.</summary>
    public bool InstallFileSystem { get; set; } = true;

    /// <summary>Installs <c>node:child_process</c> backed by <c>System.Diagnostics.Process</c>.</summary>
    public bool InstallChildProcess { get; set; } = true;

    /// <summary>Installs <c>console</c> when the engine does not provide one.</summary>
    public bool InstallConsole { get; set; } = true;

    /// <summary>Installs <c>TextEncoder</c>, <c>TextDecoder</c>, and <c>atob</c>/<c>btoa</c> when missing.</summary>
    public bool InstallEncoding { get; set; } = true;

    /// <summary>Installs <c>crypto.getRandomValues</c> and <c>crypto.randomUUID</c> when missing.</summary>
    public bool InstallCrypto { get; set; } = true;

    /// <summary>Enables dynamic <c>import()</c> for scripts evaluated by the engine.</summary>
    public bool EnableDynamicModuleImports { get; set; } = true;

    /// <summary>Converts JavaScript promises into .NET tasks so hosts can await script results.</summary>
    public bool EnableTaskPromiseConversion { get; set; } = true;

    /// <summary>
    /// Maximum V8 old-space heap size in mebibytes, or <c>0</c> to use the runtime default.
    /// </summary>
    public int MaxOldSpaceSize { get; set; }

    /// <summary>Maximum number of engine instances kept in the shared V8 runtime. Defaults to 8.</summary>
    public int MaxEngineInstances { get; set; } = 8;
}
