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
    public bool IsDirectory { get; init; } = isDirectory;

    /// <summary>Gets a value indicating whether the entry is a symbolic link.</summary>
    public bool IsSymlink { get; init; } = isSymlink;
}

/// <summary>
/// Stat information for a filesystem entry.
/// </summary>
public sealed record FsStat
{
    internal FsStat(
        bool isFile,
        bool isDirectory,
        bool isSymlink,
        bool isBlockDevice,
        bool isCharacterDevice,
        bool isFifo,
        bool isSocket,
        long size,
        int mode,
        long dev,
        long ino,
        int uid,
        int gid,
        long nlink,
        long rdev,
        long blksize,
        long blocks,
        double atimeMs,
        double mtimeMs,
        double ctimeMs,
        double birthtimeMs)
    {
        IsFile = isFile;
        IsDirectory = isDirectory;
        IsSymlink = isSymlink;
        IsBlockDevice = isBlockDevice;
        IsCharacterDevice = isCharacterDevice;
        IsFifo = isFifo;
        IsSocket = isSocket;
        Size = size;
        Mode = mode;
        Dev = dev;
        Ino = ino;
        Uid = uid;
        Gid = gid;
        Nlink = nlink;
        Rdev = rdev;
        Blksize = blksize;
        Blocks = blocks;
        AtimeMs = atimeMs;
        MtimeMs = mtimeMs;
        CtimeMs = ctimeMs;
        BirthtimeMs = birthtimeMs;
    }

    /// <summary>Gets a value indicating whether the entry is a regular file.</summary>
    public bool IsFile { get; init; }

    /// <summary>Gets a value indicating whether the entry is a directory.</summary>
    public bool IsDirectory { get; init; }

    /// <summary>Gets a value indicating whether the entry is a symbolic link.</summary>
    public bool IsSymlink { get; init; }

    /// <summary>Gets the entry size in bytes.</summary>
    public long Size { get; init; }

    /// <summary>Gets the Unix mode, including the file type in the high bits, or <c>0</c> on Windows.</summary>
    public int Mode { get; init; }

    /// <summary>
    /// Gets the device identifier the entry lives on, or <c>-1</c> when the host cannot report
    /// it. Real on Unix, where it comes from <c>stat(2)</c>.
    /// </summary>
    public long Dev { get; init; }

    /// <summary>
    /// Gets the inode number, or <c>-1</c> when the host cannot report it. This is what
    /// distinguishes two hard links to the same file, so it matters for deduplication.
    /// </summary>
    public long Ino { get; init; }

    /// <summary>Gets the owning user identifier, or <c>-1</c> when unknown.</summary>
    public int Uid { get; init; }

    /// <summary>Gets the owning group identifier, or <c>-1</c> when unknown.</summary>
    public int Gid { get; init; }

    /// <summary>Gets the number of hard links to the entry, or <c>-1</c> when unknown.</summary>
    public long Nlink { get; init; }

    /// <summary>Gets the device identifier for a special file, or <c>-1</c> for ordinary entries.</summary>
    public long Rdev { get; init; }

    /// <summary>Gets the preferred I/O block size, or <c>-1</c> when unknown.</summary>
    public long Blksize { get; init; }

    /// <summary>
    /// Gets the number of allocated 512-byte blocks. This differs from
    /// <see cref="Size"/> for sparse and compressed files.
    /// </summary>
    public long Blocks { get; init; }

    /// <summary>Gets the last access time in milliseconds since the Unix epoch.</summary>
    public double AtimeMs { get; init; }

    /// <summary>Gets the last write time in milliseconds since the Unix epoch.</summary>
    public double MtimeMs { get; init; }

    /// <summary>Gets the metadata change time in milliseconds since the Unix epoch.</summary>
    public double CtimeMs { get; init; }

    /// <summary>Gets the creation time in milliseconds since the Unix epoch.</summary>
    public double BirthtimeMs { get; init; }

    /// <summary>Gets a value indicating whether the entry is a block device.</summary>
    public bool IsBlockDevice { get; init; }

    /// <summary>Gets a value indicating whether the entry is a character device.</summary>
    public bool IsCharacterDevice { get; init; }

    /// <summary>Gets a value indicating whether the entry is a FIFO.</summary>
    public bool IsFifo { get; init; }

    /// <summary>Gets a value indicating whether the entry is a socket.</summary>
    public bool IsSocket { get; init; }
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
