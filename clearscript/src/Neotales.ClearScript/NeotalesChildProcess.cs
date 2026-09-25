using System.Diagnostics;
using System.Text;

namespace Neotales.ClearScript;

/// <summary>
/// The result of a synchronous child process launch.
/// </summary>
public sealed class ChildProcessResult
{
    internal ChildProcessResult(int? status, string? error, string? stdout, string? stderr)
    {
        Status = status;
        Error = error;
        Stdout = stdout;
        Stderr = stderr;
    }

    /// <summary>Gets the exit code, or <c>null</c> when the process could not start.</summary>
    public int? Status { get; }

    /// <summary>Gets the launch failure message, when the process could not start.</summary>
    public string? Error { get; }

    /// <summary>Gets the standard output captured from the process.</summary>
    public string? Stdout { get; }

    /// <summary>Gets the standard error captured from the process.</summary>
    public string? Stderr { get; }
}

/// <summary>
/// Runs child processes with <c>System.Diagnostics.Process</c>.
/// </summary>
public sealed class NeotalesChildProcess(string workingDirectory)
{
    /// <summary>Runs a command and captures its output.</summary>
    /// <param name="fileName">The executable to run.</param>
    /// <param name="args">The command arguments.</param>
    /// <param name="input">Optional standard input.</param>
    /// <param name="inheritEnvironment">Whether the current environment is inherited.</param>
    /// <param name="timeoutMs">Optional timeout in milliseconds.</param>
    public ChildProcessResult RunSync(
        string fileName,
        string[] args,
        string? input,
        bool inheritEnvironment,
        int timeoutMs)
    {
        var info = new ProcessStartInfo(fileName)
        {
            WorkingDirectory = workingDirectory,
            RedirectStandardInput = input is not null,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
            StandardOutputEncoding = Encoding.UTF8,
            StandardErrorEncoding = Encoding.UTF8,
        };

        foreach (var arg in args) info.ArgumentList.Add(arg);
        if (!inheritEnvironment)
        {
            info.Environment.Clear();
            foreach (System.Collections.DictionaryEntry entry in Environment.GetEnvironmentVariables())
            {
                info.Environment[(string)entry.Key] = (string?)entry.Value ?? "";
            }
        }

        try
        {
            using var process = new Process { StartInfo = info };
            var stdout = new StringBuilder();
            var stderr = new StringBuilder();
            process.OutputDataReceived += (_, args) =>
            {
                if (args.Data is not null) stdout.AppendLine(args.Data);
            };
            process.ErrorDataReceived += (_, args) =>
            {
                if (args.Data is not null) stderr.AppendLine(args.Data);
            };

            if (!process.Start()) return new ChildProcessResult(null, "Failed to start process", null, null);
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();
            if (input is not null)
            {
                process.StandardInput.Write(input);
                process.StandardInput.Close();
            }

            if (timeoutMs > 0)
            {
                if (!process.WaitForExit(timeoutMs))
                {
                    process.Kill(entireProcessTree: true);
                    return new ChildProcessResult(null, "Process timed out", stdout.ToString(), stderr.ToString());
                }
            }
            else
            {
                process.WaitForExit();
            }

            process.WaitForExit();
            return new ChildProcessResult(process.ExitCode, null, stdout.ToString(), stderr.ToString());
        }
        catch (Exception error) when (error is System.ComponentModel.Win32Exception or InvalidOperationException)
        {
            return new ChildProcessResult(null, error.Message, null, null);
        }
    }
}
