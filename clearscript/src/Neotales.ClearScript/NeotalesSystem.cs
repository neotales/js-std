namespace Neotales.ClearScript;

/// <summary>
/// Read-only information about the .NET process that hosts the engine.
/// </summary>
public sealed class NeotalesSystem
{
    private static readonly DateTime StartedAt = DateTime.UtcNow;

    /// <summary>Gets the Node-compatible platform identifier, for example <c>linux</c> or <c>win32</c>.</summary>
    public string Platform =>
        OperatingSystem.IsWindows() ? "win32"
        : OperatingSystem.IsMacOS() ? "darwin"
        : "linux";

    /// <summary>Gets the process architecture, for example <c>x64</c> or <c>arm64</c>.</summary>
    public string Arch { get; } = System.Runtime.InteropServices.RuntimeInformation
        .OSArchitecture.ToString().ToLowerInvariant();

    /// <summary>Gets the OS description reported by .NET.</summary>
    public string Description { get; } = System.Runtime.InteropServices.RuntimeInformation
        .OSDescription.Trim();

    /// <summary>Gets the process identifier of the host process.</summary>
    public int Pid { get; } = Environment.ProcessId;

    /// <summary>Gets the path of the running host executable, or an empty string when unknown.</summary>
    public string ExecPath { get; } = Environment.ProcessPath ?? "";

    /// <summary>Gets the .NET version of the host runtime.</summary>
    public string DotnetVersion { get; } = Environment.Version.ToString();

    /// <summary>Gets the user name of the host process.</summary>
    public string UserName { get; } = Environment.UserName;

    /// <summary>Gets the host name reported by the operating system.</summary>
    public string HostName { get; } = Environment.MachineName;

    /// <summary>Gets the newline sequence used by the host console.</summary>
    public string NewLine { get; } = Environment.NewLine;

    /// <summary>Gets a value indicating whether the host runs on Windows.</summary>
    public bool IsWindows => OperatingSystem.IsWindows();

    /// <summary>Gets a value indicating whether the host runs on macOS.</summary>
    public bool IsMacOS => OperatingSystem.IsMacOS();

    /// <summary>Gets the current working directory.</summary>
    public string CurrentDirectory => Environment.CurrentDirectory;

    /// <summary>Gets the temporary directory used by the host.</summary>
    public string TempDirectory { get; } =
        Path.GetTempPath().TrimEnd(Path.DirectorySeparatorChar);

    /// <summary>Gets the user profile directory.</summary>
    public string HomeDirectory { get; } =
        Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);

    /// <summary>Gets the number of seconds the host process has been running.</summary>
    public double Uptime => (DateTime.UtcNow - StartedAt).TotalSeconds;

    /// <summary>Gets the real user identifier, or <c>-1</c> on hosts that do not expose one.</summary>
    public int Uid { get; } = UnixIdentity.Of(() => PInvoke.Getuid());

    /// <summary>Gets the effective user identifier, or <c>-1</c> on hosts that do not expose one.</summary>
    public int EUid { get; } = UnixIdentity.Of(() => PInvoke.Geteuid());

    /// <summary>Gets the real group identifier, or <c>-1</c> on hosts that do not expose one.</summary>
    public int Gid { get; } = UnixIdentity.Of(() => PInvoke.Getgid());

    /// <summary>Gets the effective group identifier, or <c>-1</c> on hosts that do not expose one.</summary>
    public int EGid { get; } = UnixIdentity.Of(() => PInvoke.Getegid());

    /// <summary>Gets the parent process identifier, or <c>-1</c> when the host cannot determine it.</summary>
    public int Ppid { get; } = ReadParentPid();

    /// <summary>Changes the current working directory for the host process.</summary>
    /// <param name="path">The directory to switch to.</param>
    public void ChangeDirectory(string path) => Environment.CurrentDirectory = path;

    private static int ReadParentPid()
    {
        if (!OperatingSystem.IsLinux()) return -1;

        try
        {
            foreach (var line in File.ReadLines("/proc/self/status"))
            {
                if (!line.StartsWith("PPid:", StringComparison.Ordinal)) continue;
                return int.TryParse(line[5..].Trim(), out var ppid) ? ppid : -1;
            }
        }
        catch (IOException)
        {
            return -1;
        }
        catch (UnauthorizedAccessException)
        {
            return -1;
        }

        return -1;
    }
}

/// <summary>
/// Reads Unix identity values, reporting <c>-1</c> when the platform has no equivalent.
/// </summary>
internal static class UnixIdentity
{
    internal static int Of(Func<uint> read)
    {
        if (OperatingSystem.IsWindows()) return -1;

        try
        {
            return (int)read();
        }
        catch (DllNotFoundException)
        {
            return -1;
        }
        catch (EntryPointNotFoundException)
        {
            return -1;
        }
    }
}
