namespace Neotales.ClearScript;

/// <summary>
/// Exposes the subset of <c>System.IO</c> that the JavaScript filesystem shim needs.
/// </summary>
public sealed class NeotalesFileSystem
{
    private readonly string workingDirectory;
    private readonly Dictionary<int, FileStream> handles = [];
    private int nextHandle = 1;

    /// <summary>Initializes a new instance of the <see cref="NeotalesFileSystem"/> class.</summary>
    /// <param name="workingDirectory">The directory used to resolve relative paths.</param>
    public NeotalesFileSystem(string workingDirectory) => this.workingDirectory = workingDirectory;

    /// <summary>Opens a file and returns a handle identifier.</summary>
    /// <param name="path">The file to open.</param>
    /// <param name="flags">Node-compatible open flags.</param>
    public FsResult Open(string path, int flags)
    {
        var full = Resolve(path);
        const int oWronly = 1;
        const int oRdwr = 2;
        const int oCreat = 64;
        const int oExcl = 128;
        const int oTrunc = 512;
        const int oAppend = 1024;

        var access = (flags & 3) switch
        {
            oWronly => FileAccess.Write,
            oRdwr => FileAccess.ReadWrite,
            _ => FileAccess.Read,
        };

        var mode = (flags & oAppend) != 0 ? FileMode.Append
            : (flags & oTrunc) != 0 ? FileMode.Truncate
            : (flags & oCreat) != 0
                ? (flags & oExcl) != 0 ? FileMode.CreateNew : FileMode.OpenOrCreate
            : FileMode.Open;

        try
        {
            var stream = new FileStream(full, mode, access, FileShare.ReadWrite);
            var handle = nextHandle++;
            handles[handle] = stream;
            return FsResult.Opened(handle);
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or ArgumentException)
        {
            return FsResult.Failure("open", full, error, (flags & oExcl) != 0 ? "EEXIST" : "EIO");
        }
    }

    /// <summary>Reads bytes from an open handle.</summary>
    /// <param name="handle">The handle identifier.</param>
    /// <param name="count">The number of bytes to read.</param>
    /// <param name="position">The absolute position, or <c>-1</c> to use the stream position.</param>
    public FsResult Read(int handle, int count, int position)
    {
        if (!handles.TryGetValue(handle, out var stream)) return Closed("read");
        try
        {
            if (position >= 0) stream.Seek(position, SeekOrigin.Begin);
            var buffer = new byte[count];
            var read = stream.ReadAtLeast(buffer, count, false);
            return FsResult.Bytes(buffer[..read]) with { Count = read };
        }
        catch (Exception error) when (error is IOException or ObjectDisposedException or ArgumentException)
        {
            return FsResult.Failure("read", stream.Name, error, "EIO");
        }
    }

    /// <summary>Writes bytes to an open handle.</summary>
    /// <param name="handle">The handle identifier.</param>
    /// <param name="base64">The base64 encoded payload.</param>
    /// <param name="position">The absolute position, or <c>-1</c> to use the stream position.</param>
    public FsResult Write(int handle, string base64, int position)
    {
        if (!handles.TryGetValue(handle, out var stream)) return Closed("write");
        try
        {
            if (position >= 0) stream.Seek(position, SeekOrigin.Begin);
            var bytes = Convert.FromBase64String(base64);
            stream.Write(bytes, 0, bytes.Length);
            return FsResult.Counted(bytes.Length);
        }
        catch (Exception error) when (error is IOException or ObjectDisposedException or ArgumentException)
        {
            return FsResult.Failure("write", stream.Name, error, "EIO");
        }
    }

    /// <summary>Closes an open handle.</summary>
    /// <param name="handle">The handle identifier.</param>
    public FsResult Close(int handle)
    {
        if (!handles.TryGetValue(handle, out var stream)) return Closed("close");
        handles.Remove(handle);
        try
        {
            stream.Dispose();
            return FsResult.Success();
        }
        catch (IOException error)
        {
            return FsResult.Failure("close", stream.Name, error, "EIO");
        }
    }

    /// <summary>Truncates an open handle to a length.</summary>
    /// <param name="handle">The handle identifier.</param>
    /// <param name="length">The new length.</param>
    public FsResult Truncate(int handle, long length)
    {
        if (!handles.TryGetValue(handle, out var stream)) return Closed("ftruncate");
        try
        {
            stream.SetLength(length);
            return FsResult.Success();
        }
        catch (Exception error) when (error is IOException or ObjectDisposedException or ArgumentException)
        {
            return FsResult.Failure("ftruncate", stream.Name, error, "EIO");
        }
    }

    /// <summary>Flushes an open handle to disk.</summary>
    /// <param name="handle">The handle identifier.</param>
    public FsResult Sync(int handle)
    {
        if (!handles.TryGetValue(handle, out var stream)) return Closed("fsync");
        try
        {
            stream.Flush(true);
            return FsResult.Success();
        }
        catch (Exception error) when (error is IOException or ObjectDisposedException or ArgumentException)
        {
            return FsResult.Failure("fsync", stream.Name, error, "EIO");
        }
    }

    /// <summary>Reads metadata for an open handle.</summary>
    /// <param name="handle">The handle identifier.</param>
    public FsResult StatHandle(int handle)
    {
        if (!handles.TryGetValue(handle, out var stream)) return Closed("fstat");
        try
        {
            if (NativeFileStatusReader.IsSupported &&
                NativeFileStatusReader.TryFStat(stream.SafeFileHandle, out var status) == 0)
            {
                // An open handle always refers to the file itself, never to a link.
                return FsResult.StatEntry(FromNative(status) with
                {
                    IsFile = true,
                    IsSymlink = false,
                });
            }

            var info = new FileInfo(stream.Name);
            var modified = Milliseconds(info.Exists ? info.LastWriteTimeUtc : DateTime.MinValue);
            var accessed = Milliseconds(info.Exists ? info.LastAccessTimeUtc : DateTime.MinValue);
            return FsResult.StatEntry(Unknown(true, false, false, stream.Length, accessed, modified, modified, modified));
        }
        catch (Exception error) when (error is IOException or ObjectDisposedException or ArgumentException)
        {
            return FsResult.Failure("fstat", stream.Name, error, "EIO");
        }
    }

    /// <summary>Builds a status record for hosts that cannot report the Unix fields.</summary>
    private static FsStat Unknown(
        bool isFile,
        bool isDirectory,
        bool isSymlink,
        long size,
        double atimeMs,
        double mtimeMs,
        double ctimeMs,
        double birthtimeMs) =>
        new(
            isFile,
            isDirectory,
            isSymlink,
            isBlockDevice: false,
            isCharacterDevice: false,
            isFifo: false,
            isSocket: false,
            size,
            mode: 0,
            dev: -1,
            ino: -1,
            uid: -1,
            gid: -1,
            nlink: -1,
            rdev: -1,
            blksize: -1,
            blocks: -1,
            atimeMs,
            mtimeMs,
            ctimeMs,
            birthtimeMs);

    private static FsResult Closed(string syscall) =>
        new(false, "EBADF", syscall, null, "Bad file descriptor");

    /// <summary>Resolves a path against the configured working directory.</summary>
    /// <param name="path">The path to resolve.</param>
    public string Resolve(string path) => Path.GetFullPath(path, workingDirectory);

    /// <summary>Determines whether a path exists.</summary>
    /// <param name="path">The path to test.</param>
    public bool Exists(string path) => File.Exists(Resolve(path)) || Directory.Exists(Resolve(path));

    /// <summary>Verifies that a path is readable, writable, or both.</summary>
    /// <param name="path">The path to check.</param>
    /// <param name="write">Whether write access is required.</param>
    public FsResult Access(string path, bool write)
    {
        var full = Resolve(path);
        try
        {
            if (Directory.Exists(full))
            {
                return FsResult.Success();
            }

            if (!File.Exists(full)) throw new FileNotFoundException("File not found.", full);
            if (write)
            {
                using var stream = new FileStream(full, FileMode.Open, FileAccess.Write, FileShare.ReadWrite);
            }

            return FsResult.Success();
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or ArgumentException)
        {
            return FsResult.Failure("access", full, error, "EACCES");
        }
    }

    /// <summary>Reads a file as UTF-8 text.</summary>
    /// <param name="path">The file to read.</param>
    public FsResult ReadText(string path)
    {
        var full = Resolve(path);
        try
        {
            return FsResult.TextOf(File.ReadAllText(full));
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or ArgumentException)
        {
            return FsResult.Failure("readFile", full, error, "EIO");
        }
    }

    /// <summary>Reads a file as raw bytes.</summary>
    /// <param name="path">The file to read.</param>
    public FsResult ReadBytes(string path)
    {
        var full = Resolve(path);
        try
        {
            return FsResult.Bytes(File.ReadAllBytes(full));
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or ArgumentException)
        {
            return FsResult.Failure("readFile", full, error, "EIO");
        }
    }

    /// <summary>Writes UTF-8 text to a file.</summary>
    /// <param name="path">The file to write.</param>
    /// <param name="text">The text to write.</param>
    /// <param name="append">Whether existing content is kept.</param>
    public FsResult WriteText(string path, string text, bool append)
    {
        var full = Resolve(path);
        try
        {
            if (append) File.AppendAllText(full, text);
            else File.WriteAllText(full, text);
            return FsResult.Success();
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or ArgumentException)
        {
            return FsResult.Failure("writeFile", full, error, "EIO");
        }
    }

    /// <summary>Writes raw bytes to a file.</summary>
    /// <param name="path">The file to write.</param>
    /// <param name="base64">The base64 encoded payload.</param>
    /// <param name="append">Whether existing content is kept.</param>
    public FsResult WriteBytes(string path, string base64, bool append)
    {
        var full = Resolve(path);
        try
        {
            var bytes = Convert.FromBase64String(base64);
            if (append)
            {
                using var stream = new FileStream(full, FileMode.Append, FileAccess.Write, FileShare.ReadWrite);
                stream.Write(bytes, 0, bytes.Length);
            }
            else
            {
                File.WriteAllBytes(full, bytes);
            }

            return FsResult.Success();
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or ArgumentException)
        {
            return FsResult.Failure("writeFile", full, error, "EIO");
        }
    }

    /// <summary>Lists the entries of a directory.</summary>
    /// <param name="path">The directory to list.</param>
    public FsResult ReadDirectory(string path)
    {
        var full = Resolve(path);
        try
        {
            var names = Directory.GetFileSystemEntries(full)
                .Select(Path.GetFileName)
                .OfType<string>()
                .OrderBy(name => name, StringComparer.Ordinal)
                .ToArray();
            var entries = new FsDirEntry[names.Length];
            for (var index = 0; index < names.Length; index++)
            {
                var child = Path.Combine(full, names[index]);
                var isSymlink = Directory.ResolveLinkTarget(child, true) is not null;
                var isDirectory = new DirectoryInfo(child).Exists;
                var isFile = new FileInfo(child).Exists;
                entries[index] = new FsDirEntry(names[index], isFile, isDirectory, isSymlink);
            }

            return FsResult.Directory(names, entries);
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or ArgumentException)
        {
            return FsResult.Failure("scandir", full, error, "ENOTDIR");
        }
    }

    /// <summary>Creates a directory.</summary>
    /// <param name="path">The directory to create.</param>
    /// <param name="recursive">Whether missing parents are created.</param>
    public FsResult MakeDirectory(string path, bool recursive)
    {
        var full = Resolve(path);
        try
        {
            var existed = Directory.Exists(full);
            Directory.CreateDirectory(full);
            return existed ? FsResult.Existing() : FsResult.Success();
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or ArgumentException)
        {
            return FsResult.Failure("mkdir", full, error, recursive ? "EIO" : "EEXIST");
        }
    }

    /// <summary>Truncates or extends a file by path.</summary>
    /// <param name="path">The file to resize.</param>
    /// <param name="length">The new length, or <c>0</c> when the length is omitted.</param>
    public FsResult TruncateFile(string path, long length)
    {
        var full = Resolve(path);
        try
        {
            if (!File.Exists(full)) throw new FileNotFoundException("File not found.", full);
            using var stream = new FileStream(full, FileMode.Open, FileAccess.Write, FileShare.ReadWrite);
            stream.SetLength(length);
            return FsResult.Success();
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or ArgumentException)
        {
            return FsResult.Failure("truncate", full, error, "EIO");
        }
    }

    /// <summary>Applies Unix permission bits. Windows hosts accept the call and ignore it.</summary>
    /// <param name="path">The file to change.</param>
    /// <param name="mode">The permission bits.</param>
    public FsResult ChangeMode(string path, int mode)
    {
        var full = Resolve(path);
        if (OperatingSystem.IsWindows()) return FsResult.Success();
        try
        {
            var current = File.GetUnixFileMode(full);
            var updated = current;
            updated = ApplyMode(updated, mode, UnixFileMode.UserRead, 0b100_000_000, UnixFileMode.UserWrite, 0b010_000_000, UnixFileMode.UserExecute, 0b001_000_000);
            updated = ApplyMode(updated, mode, UnixFileMode.GroupRead, 0b000_100_000, UnixFileMode.GroupWrite, 0b000_010_000, UnixFileMode.GroupExecute, 0b000_001_000);
            updated = ApplyMode(updated, mode, UnixFileMode.OtherRead, 0b000_000_100, UnixFileMode.OtherWrite, 0b000_000_010, UnixFileMode.OtherExecute, 0b000_000_001);
            File.SetUnixFileMode(full, updated);
            return FsResult.Success();
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or ArgumentException)
        {
            return FsResult.Failure("chmod", full, error, "EPERM");
        }
    }

    /// <summary>Records a change-ownership request. Ownership changes are not supported.</summary>
    /// <param name="path">The file to change.</param>
    /// <param name="uid">The requested user identifier, or <c>-1</c> to keep the owner.</param>
    /// <param name="gid">The requested group identifier, or <c>-1</c> to keep the group.</param>
    public FsResult ChangeOwner(string path, int uid, int gid)
    {
        var full = Resolve(path);
        try
        {
            if (!File.Exists(full) && !Directory.Exists(full)) throw new FileNotFoundException("File not found.", full);
            return uid < 0 && gid < 0 ? FsResult.Success() : FsResult.Failure("chown", full, new UnauthorizedAccessException("Changing ownership is not supported by this host."), "EPERM");
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or ArgumentException)
        {
            return FsResult.Failure("chown", full, error, "EPERM");
        }
    }

    /// <summary>Creates a hard link.</summary>
    /// <param name="from">The existing path.</param>
    /// <param name="to">The new link path.</param>
    public FsResult CreateHardLink(string from, string to)
    {
        var source = Resolve(from);
        var target = Resolve(to);
        try
        {
            if (OperatingSystem.IsWindows())
            {
                return FsResult.Failure(
                    "link",
                    source,
                    new NotSupportedException("Hard links are not supported on this host."),
                    "ENOSYS");
            }

            if (PInvoke.Link(source, target) != 0)
            {
                return FsResult.Failure("link", source, new IOException("link failed"), "EEXIST");
            }

            return FsResult.Success();
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or ArgumentException)
        {
            return FsResult.Failure("link", source, error, "EXDEV");
        }
    }

    /// <summary>Updates access and modification times.</summary>
    /// <param name="path">The file to change.</param>
    /// <param name="accessMs">The access time in milliseconds since the Unix epoch.</param>
    /// <param name="modifiedMs">The modification time in milliseconds since the Unix epoch.</param>
    public FsResult SetTimes(string path, double accessMs, double modifiedMs)
    {
        var full = Resolve(path);
        try
        {
            File.SetLastWriteTimeUtc(full, DateTime.UnixEpoch.AddMilliseconds(modifiedMs));
            if (accessMs >= 0) File.SetLastAccessTimeUtc(full, DateTime.UnixEpoch.AddMilliseconds(accessMs));
            return FsResult.Success();
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or ArgumentException)
        {
            return FsResult.Failure("utimes", full, error, "EPERM");
        }
    }

    /// <summary>Removes a file.</summary>
    /// <param name="path">The file to remove.</param>
    public FsResult RemoveFile(string path)
    {
        var full = Resolve(path);
        try
        {
            File.Delete(full);
            return FsResult.Success();
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or ArgumentException)
        {
            return FsResult.Failure("unlink", full, error, "EISDIR");
        }
    }

    /// <summary>Removes a file or directory.</summary>
    /// <param name="path">The entry to remove.</param>
    /// <param name="recursive">Whether directories are removed recursively.</param>
    /// <param name="force">Whether a missing entry is treated as success.</param>
    public FsResult Remove(string path, bool recursive, bool force)
    {
        var full = Resolve(path);
        try
        {
            if (Directory.Exists(full))
            {
                if (!recursive) Directory.Delete(full, false);
                else Directory.Delete(full, true);
                return FsResult.Success();
            }

            if (File.Exists(full))
            {
                File.Delete(full);
                return FsResult.Success();
            }

            if (force) return FsResult.Success();
            throw new FileNotFoundException("File not found.", full);
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or ArgumentException)
        {
            return FsResult.Failure("rm", full, error, "ENOTEMPTY");
        }
    }

    /// <summary>Renames or moves a path.</summary>
    /// <param name="from">The source path.</param>
    /// <param name="to">The destination path.</param>
    public FsResult Rename(string from, string to)
    {
        var source = Resolve(from);
        var target = Resolve(to);
        try
        {
            if (Directory.Exists(source)) Directory.Move(source, target);
            else File.Move(source, target, true);
            return FsResult.Success();
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or ArgumentException)
        {
            return FsResult.Failure("rename", source, error, "EXDEV");
        }
    }

    /// <summary>Copies a file.</summary>
    /// <param name="from">The source file.</param>
    /// <param name="to">The destination file.</param>
    /// <param name="overwrite">Whether an existing destination is replaced.</param>
    public FsResult CopyFile(string from, string to, bool overwrite)
    {
        var source = Resolve(from);
        var target = Resolve(to);
        try
        {
            File.Copy(source, target, overwrite);
            return FsResult.Success();
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or ArgumentException)
        {
            return FsResult.Failure("copyFile", source, error, "EXDEV");
        }
    }

    /// <summary>Reads metadata for a path.</summary>
    /// <param name="path">The path to inspect.</param>
    /// <param name="followLinks">Whether symbolic links are followed.</param>
    public FsResult Stat(string path, bool followLinks)
    {
        var full = Resolve(path);
        if (NativeFileStatusReader.IsSupported)
        {
            var code = followLinks
                ? NativeFileStatusReader.TryStat(full, out var status)
                : NativeFileStatusReader.TryLStat(full, out status);
            if (code == 0) return FsResult.StatEntry(FromNative(status));
            if (code == NativeErrno.ENOENT) throw new FileNotFoundException("File not found.", full);
            if (code == NativeErrno.EACCES) throw new UnauthorizedAccessException(full);
        }

        try
        {
            var linkTarget = Directory.ResolveLinkTarget(full, true);
            var isSymlink = linkTarget is not null;
            var effective = isSymlink && followLinks ? linkTarget?.FullName ?? full : full;
            if (Directory.Exists(effective)) return FsResult.StatEntry(DescribeDirectory(new DirectoryInfo(effective), isSymlink));
            var file = new FileInfo(effective);
            if (!file.Exists) throw new FileNotFoundException("File not found.", full);
            return FsResult.StatEntry(DescribeFile(file, isSymlink));
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or ArgumentException)
        {
            return FsResult.Failure("stat", full, error, "EIO");
        }
    }

    /// <summary>Converts native status into the reported shape, including the file type.</summary>
    /// <param name="status">The value returned by <c>stat(2)</c>.</param>
    private static FsStat FromNative(NativeFileStatus status)
    {
        const int ifmt = 0xF000;
        var type = status.Mode & ifmt;
        return new FsStat(
            isFile: type == 0x8000,
            isDirectory: type == 0x4000,
            isSymlink: type == 0xA000,
            isBlockDevice: type == 0x6000,
            isCharacterDevice: type == 0x2000,
            isFifo: type == 0x1000,
            isSocket: type == 0xC000,
            size: status.Size,
            mode: status.Mode,
            dev: status.Dev,
            ino: status.Ino,
            uid: (int)status.Uid,
            gid: (int)status.Gid,
            // The 120-byte status record has no link count, block size, or block count, so
            // these stay unknown rather than being a plausible-looking default. Two hard
            // links are still distinguishable through a shared inode.
            nlink: -1,
            rdev: -1,
            blksize: -1,
            blocks: -1,
            atimeMs: Nanoseconds(status.ATime, status.ATimeNsec),
            mtimeMs: Nanoseconds(status.MTime, status.MTimeNsec),
            ctimeMs: Nanoseconds(status.CTime, status.CTimeNsec),
            birthtimeMs: status.BirthTime > 0
                ? Nanoseconds(status.BirthTime, status.BirthTimeNsec)
                : Nanoseconds(status.CTime, status.CTimeNsec));
    }

    private static double Nanoseconds(long seconds, long nanoseconds) =>
        (seconds * 1000d) + (nanoseconds / 1_000_000d);

    /// <summary>Resolves symbolic links in a path.</summary>
    /// <param name="path">The path to resolve.</param>
    public FsResult RealPath(string path)
    {
        var full = Resolve(path);
        try
        {
            var target = Directory.ResolveLinkTarget(full, true);
            return FsResult.TextOf(target?.FullName ?? full);
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or ArgumentException)
        {
            return FsResult.Failure("realpath", full, error, "ENOENT");
        }
    }

    /// <summary>
    /// Creates a symbolic link, storing the target literally.
    ///
    /// The target is not resolved, so a relative link behaves the way it does on Node and
    /// reads back through <see cref="ReadLink"/> unchanged.
    /// </summary>
    /// <param name="target">The link target, stored as given.</param>
    /// <param name="path">The link path.</param>
    public FsResult CreateSymlink(string target, string path)
    {
        var full = Resolve(path);
        try
        {
            Directory.CreateSymbolicLink(full, target);
            return FsResult.Success();
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or ArgumentException)
        {
            return FsResult.Failure("symlink", full, error, "EEXIST");
        }
    }

    /// <summary>
    /// Reads the target of a symbolic link exactly as it was stored.
    ///
    /// Node returns the literal target, which may be relative, and raises <c>EINVAL</c> when the
    /// path is not a symbolic link. The stored target is used rather than a resolved path so a
    /// relative link reads back identically.
    /// </summary>
    /// <param name="path">The link path.</param>
    public FsResult ReadLink(string path)
    {
        var full = Resolve(path);
        try
        {
            var target = Directory.Exists(full)
                ? new DirectoryInfo(full).LinkTarget
                : new FileInfo(full).LinkTarget;
            if (target is null)
            {
                return FsResult.Failure(
                    "readlink",
                    full,
                    new ArgumentException("The path is not a symbolic link.", nameof(path)),
                    "EINVAL");
            }

            return FsResult.TextOf(target);
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or ArgumentException)
        {
            return FsResult.Failure("readlink", full, error, "EINVAL");
        }
    }

    /// <summary>Creates a uniquely named temporary directory.</summary>
    /// <param name="prefix">The directory name prefix.</param>
    public FsResult MakeTempDirectory(string prefix)
    {
        try
        {
            var path = Path.Combine(workingDirectory, $"{prefix}{Guid.NewGuid():N}");
            Directory.CreateDirectory(path);
            return FsResult.TextOf(path);
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException or ArgumentException)
        {
            return FsResult.Failure("mkdtemp", workingDirectory, error, "EIO");
        }
    }

    private static UnixFileMode ApplyMode(
        UnixFileMode current,
        int mode,
        UnixFileMode read,
        int readBit,
        UnixFileMode write,
        int writeBit,
        UnixFileMode execute,
        int executeBit)
    {
        var updated = current;
        if ((mode & readBit) != 0) updated |= read;
        else updated &= ~read;
        if ((mode & writeBit) != 0) updated |= write;
        else updated &= ~write;
        if ((mode & executeBit) != 0) updated |= execute;
        else updated &= ~execute;
        return updated;
    }

    private static FsStat DescribeFile(FileInfo file, bool isSymlink) =>
        Unknown(
            file.Exists,
            isDirectory: false,
            isSymlink,
            file.Exists ? file.Length : 0,
            Milliseconds(file.Exists ? file.LastAccessTimeUtc : DateTime.MinValue),
            Milliseconds(file.Exists ? file.LastWriteTimeUtc : DateTime.MinValue),
            Milliseconds(file.Exists ? file.LastWriteTimeUtc : DateTime.MinValue),
            Milliseconds(file.Exists ? file.CreationTimeUtc : DateTime.MinValue))
        with { Mode = ModeOf(file) };

    private static FsStat DescribeDirectory(DirectoryInfo directory, bool isSymlink) =>
        Unknown(
            isFile: false,
            isDirectory: directory.Exists,
            isSymlink,
            size: 0,
            Milliseconds(directory.Exists ? directory.LastAccessTimeUtc : DateTime.MinValue),
            Milliseconds(directory.Exists ? directory.LastWriteTimeUtc : DateTime.MinValue),
            Milliseconds(directory.Exists ? directory.LastWriteTimeUtc : DateTime.MinValue),
            Milliseconds(directory.Exists ? directory.CreationTimeUtc : DateTime.MinValue))
        with { Mode = ModeOf(directory) };

    private static int ModeOf(FileSystemInfo info)
    {
        if (OperatingSystem.IsWindows()) return 0;
        try
        {
            var mode = File.GetUnixFileMode(info.FullName);
            var value = 0;
            if (mode.HasFlag(UnixFileMode.UserRead)) value |= 0b100_000_000;
            if (mode.HasFlag(UnixFileMode.UserWrite)) value |= 0b010_000_000;
            if (mode.HasFlag(UnixFileMode.UserExecute)) value |= 0b001_000_000;
            if (mode.HasFlag(UnixFileMode.GroupRead)) value |= 0b000_100_000;
            if (mode.HasFlag(UnixFileMode.GroupWrite)) value |= 0b000_010_000;
            if (mode.HasFlag(UnixFileMode.GroupExecute)) value |= 0b000_001_000;
            if (mode.HasFlag(UnixFileMode.OtherRead)) value |= 0b000_000_100;
            if (mode.HasFlag(UnixFileMode.OtherWrite)) value |= 0b000_000_010;
            if (mode.HasFlag(UnixFileMode.OtherExecute)) value |= 0b000_000_001;
            return value;
        }
        catch (IOException)
        {
            return 0;
        }
        catch (UnauthorizedAccessException)
        {
            return 0;
        }
    }

    private static double Milliseconds(DateTime value) =>
        value == DateTime.MinValue ? 0 : (value - DateTime.UnixEpoch).TotalMilliseconds;
}
