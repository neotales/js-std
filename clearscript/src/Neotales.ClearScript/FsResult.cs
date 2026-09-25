namespace Neotales.ClearScript;

/// <summary>
/// The result of a filesystem operation. Failures are reported as data so the JavaScript
/// shim can raise Node-compatible errors with <c>code</c>, <c>syscall</c>, and <c>path</c>.
/// </summary>
public sealed record FsResult
{
    internal FsResult(bool ok, string? code, string? syscall, string? path, string? message)
    {
        Ok = ok;
        Code = code;
        Syscall = syscall;
        Path = path;
        Message = message;
    }

    /// <summary>Gets a value indicating whether the operation succeeded.</summary>
    public bool Ok { get; }

    /// <summary>Gets the Node-compatible error code, such as <c>ENOENT</c>.</summary>
    public string? Code { get; }

    /// <summary>Gets the name of the failed operation.</summary>
    public string? Syscall { get; }

    /// <summary>Gets the path involved in the failure.</summary>
    public string? Path { get; }

    /// <summary>Gets the failure message.</summary>
    public string? Message { get; }

    /// <summary>Gets the text payload, when the operation returned text.</summary>
    public string? Text { get; init; }

    /// <summary>Gets the base64 payload, when the operation returned bytes.</summary>
    public string? Base64 { get; init; }

    /// <summary>Gets the directory entry names.</summary>
    public string[]? Names { get; init; }

    /// <summary>Gets the directory entries.</summary>
    public FsDirEntry[]? Entries { get; init; }

    /// <summary>Gets the stat information.</summary>
    public FsStat? Stat { get; init; }

    /// <summary>Gets the open file handle identifier.</summary>
    public int Handle { get; init; }

    /// <summary>Gets the number of bytes affected by the operation.</summary>
    public int Count { get; init; }

    /// <summary>Gets a value indicating whether the target already existed.</summary>
    public bool Existed { get; init; }

    internal static FsResult Success() => new(true, null, null, null, null);

    internal static FsResult TextOf(string value) => new(true, null, null, null, null) { Text = value };

    internal static FsResult Bytes(byte[] value) =>
        new(true, null, null, null, null) { Base64 = Convert.ToBase64String(value) };

    internal static FsResult Directory(string[] names, FsDirEntry[] entries) =>
        new(true, null, null, null, null) { Names = names, Entries = entries };

    internal static FsResult StatEntry(FsStat stat) => new(true, null, null, null, null) { Stat = stat };

    internal static FsResult Opened(int handle) => new(true, null, null, null, null) { Handle = handle };

    internal static FsResult Counted(int count) => new(true, null, null, null, null) { Count = count };

    internal static FsResult Existing() => new(true, null, null, null, null) { Existed = true };

    internal static FsResult Failure(string syscall, string? path, Exception error, string fallbackCode) =>
        new(false, FsErrorCode.Map(error, fallbackCode), syscall, path, error.Message);
}

/// <summary>
/// A single directory entry returned by <see cref="NeotalesFileSystem.ReadDirectory"/>.
/// </summary>
public sealed class FsDirEntry(string name, bool isFile, bool isDirectory, bool isSymlink)
{
    /// <summary>Gets the entry name.</summary>
    public string Name { get; } = name;

    /// <summary>Gets a value indicating whether the entry is a regular file.</summary>
    public bool IsFile { get; } = isFile;

    /// <summary>Gets a value indicating whether the entry is a directory.</summary>
    public bool IsDirectory { get; } = isDirectory;

    /// <summary>Gets a value indicating whether the entry is a symbolic link.</summary>
    public bool IsSymlink { get; } = isSymlink;
}

/// <summary>
/// Stat information for a filesystem entry.
/// </summary>
public sealed class FsStat
{
    internal FsStat(
        bool isFile,
        bool isDirectory,
        bool isSymlink,
        long size,
        int mode,
        double atimeMs,
        double mtimeMs,
        double ctimeMs,
        double birthtimeMs)
    {
        IsFile = isFile;
        IsDirectory = isDirectory;
        IsSymlink = isSymlink;
        Size = size;
        Mode = mode;
        AtimeMs = atimeMs;
        MtimeMs = mtimeMs;
        CtimeMs = ctimeMs;
        BirthtimeMs = birthtimeMs;
    }

    /// <summary>Gets a value indicating whether the entry is a regular file.</summary>
    public bool IsFile { get; }

    /// <summary>Gets a value indicating whether the entry is a directory.</summary>
    public bool IsDirectory { get; }

    /// <summary>Gets a value indicating whether the entry is a symbolic link.</summary>
    public bool IsSymlink { get; }

    /// <summary>Gets the entry size in bytes.</summary>
    public long Size { get; }

    /// <summary>Gets the Unix permission bits, or <c>0</c> on Windows.</summary>
    public int Mode { get; }

    /// <summary>Gets the last access time in milliseconds since the Unix epoch.</summary>
    public double AtimeMs { get; }

    /// <summary>Gets the last write time in milliseconds since the Unix epoch.</summary>
    public double MtimeMs { get; }

    /// <summary>Gets the metadata change time in milliseconds since the Unix epoch.</summary>
    public double CtimeMs { get; }

    /// <summary>Gets the creation time in milliseconds since the Unix epoch.</summary>
    public double BirthtimeMs { get; }

    /// <summary>Gets a value indicating whether the entry is a block device.</summary>
    public bool IsBlockDevice => false;

    /// <summary>Gets a value indicating whether the entry is a character device.</summary>
    public bool IsCharacterDevice => false;

    /// <summary>Gets a value indicating whether the entry is a FIFO.</summary>
    public bool IsFifo => false;

    /// <summary>Gets a value indicating whether the entry is a socket.</summary>
    public bool IsSocket => false;
}

/// <summary>
/// Maps .NET exceptions to Node-compatible error codes.
/// </summary>
internal static class FsErrorCode
{
    internal static string Map(Exception error, string fallback) => error switch
    {
        FileNotFoundException => "ENOENT",
        DirectoryNotFoundException => "ENOENT",
        UnauthorizedAccessException => "EACCES",
        PathTooLongException => "ENAMETOOLONG",
        NotSupportedException => "ENOTSUP",
        ArgumentException => "EINVAL",
        IOException => fallback,
        _ => fallback,
    };
}
