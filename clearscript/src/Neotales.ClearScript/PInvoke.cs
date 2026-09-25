using System.Runtime.InteropServices;

namespace Neotales.ClearScript;

/// <summary>
/// Minimal libc bindings used to report Unix identity values to JavaScript.
/// </summary>
internal static class PInvoke
{
    [DllImport("libc", EntryPoint = "getuid")]
    internal static extern uint Getuid();

    [DllImport("libc", EntryPoint = "geteuid")]
    internal static extern uint Geteuid();

    [DllImport("libc", EntryPoint = "getgid")]
    internal static extern uint Getgid();

    [DllImport("libc", EntryPoint = "getegid")]
    internal static extern uint Getegid();

    [DllImport("libc", EntryPoint = "getppid")]
    internal static extern uint Getppid();

    [DllImport("libc", EntryPoint = "link", SetLastError = true)]
    internal static extern int Link(string existing, string created);
}
