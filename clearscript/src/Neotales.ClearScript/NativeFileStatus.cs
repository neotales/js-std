using System.Runtime.InteropServices;

namespace Neotales.ClearScript;

/// <summary>Error numbers returned by the native shim, which are negative.</summary>
internal static class NativeErrno
{
    internal const int EACCES = -13;
    internal const int ENOENT = -2;
}

/// <summary>
/// The layout that .NET's <c>libSystem.Native</c> writes for <c>SystemNative_Stat</c>,
/// <c>SystemNative_LStat</c>, and <c>SystemNative_FStat</c>.
/// </summary>
/// <remarks>
/// <para>
/// This is 120 bytes. Getting it wrong does not fail cleanly: a layout that is too small
/// lets the native write land inside the managed buffer and silently returns wrong values,
/// while a layout that is too large corrupts the stack and the process dies later with an
/// <see cref="AccessViolationException"/> in an unrelated frame.
/// </para>
/// <para>
/// The verified offsets are: <c>Dev</c> at 88, an unused gap at 96, <c>Ino</c> at 104,
/// <c>UserFlags</c> at 112, and a reserved word at 116. The gap is the field most often
/// omitted, which shifts <c>Ino</c> and makes every inode read as zero.
/// </para>
/// <para>
/// Neotales.Core in the skyship repository declares this struct at 112 bytes, without the
/// gap, so its <c>Ino</c> is always zero. This layout is the corrected one.
/// </para>
/// </remarks>
[StructLayout(LayoutKind.Sequential)]
internal struct NativeFileStatus
{
    /// <summary>Bit flags; 1 means the birth time is meaningful.</summary>
    internal int Flags;

    /// <summary>The file type in the high bits and the permission bits in the low bits.</summary>
    internal int Mode;

    /// <summary>The owning user identifier.</summary>
    internal uint Uid;

    /// <summary>The owning group identifier.</summary>
    internal uint Gid;

    /// <summary>The size in bytes.</summary>
    internal long Size;

    /// <summary>Last access time, whole seconds.</summary>
    internal long ATime;

    /// <summary>Last access time, nanoseconds.</summary>
    internal long ATimeNsec;

    /// <summary>Last write time, whole seconds.</summary>
    internal long MTime;

    /// <summary>Last write time, nanoseconds.</summary>
    internal long MTimeNsec;

    /// <summary>Metadata change time, whole seconds.</summary>
    internal long CTime;

    /// <summary>Metadata change time, nanoseconds.</summary>
    internal long CTimeNsec;

    /// <summary>Creation time, whole seconds.</summary>
    internal long BirthTime;

    /// <summary>Creation time, nanoseconds.</summary>
    internal long BirthTimeNsec;

    /// <summary>The device identifier the entry lives on.</summary>
    internal long Dev;

    /// <summary>Reserved. Present in the ABI; omitting it shifts every field after it.</summary>
    internal long Reserved;

    /// <summary>The inode number.</summary>
    internal long Ino;

    /// <summary>User-defined flags.</summary>
    internal uint UserFlags;

    /// <summary>Trailing reserved word that completes the 120-byte layout.</summary>
    internal int Reserved2;
}

/// <summary>
/// Reads real filesystem metadata through .NET's own native shim.
/// </summary>
/// <remarks>
/// <c>libSystem.Native</c> ships inside the .NET runtime, so this needs no extra native
/// dependency and works on any platform that runs .NET. The bindings mirror
/// <c>Neotales.Common</c> in the skyship repository, with the corrected struct layout.
/// </remarks>
internal static partial class NativeFileStatusReader
{
    private const string SystemNative = "System.Native";

    [LibraryImport(SystemNative, EntryPoint = "SystemNative_Stat",
        StringMarshalling = StringMarshalling.Utf8, SetLastError = true)]
    internal static partial int Stat(string path, out NativeFileStatus status);

    [LibraryImport(SystemNative, EntryPoint = "SystemNative_LStat",
        StringMarshalling = StringMarshalling.Utf8, SetLastError = true)]
    internal static partial int LStat(string path, out NativeFileStatus status);

    [LibraryImport(SystemNative, EntryPoint = "SystemNative_FStat", SetLastError = true)]
    internal static partial int FStat(Microsoft.Win32.SafeHandles.SafeFileHandle handle, out NativeFileStatus status);

    /// <summary>Gets a value indicating whether the native shim can be called on this host.</summary>
    internal static bool IsSupported => !OperatingSystem.IsWindows() && !OperatingSystem.IsBrowser();

    /// <summary>Attempts to read metadata for a path, following symbolic links.</summary>
    /// <param name="path">The absolute path to inspect.</param>
    /// <param name="status">The metadata, when the call succeeds.</param>
    /// <returns>Zero on success, otherwise the native error code.</returns>
    internal static int TryStat(string path, out NativeFileStatus status) => Stat(path, out status);

    /// <summary>Attempts to read metadata for a path without following symbolic links.</summary>
    /// <param name="path">The absolute path to inspect.</param>
    /// <param name="status">The metadata, when the call succeeds.</param>
    /// <returns>Zero on success, otherwise the native error code.</returns>
    internal static int TryLStat(string path, out NativeFileStatus status) => LStat(path, out status);

    /// <summary>Attempts to read metadata for an open file handle.</summary>
    /// <param name="handle">The open handle.</param>
    /// <param name="status">The metadata, when the call succeeds.</param>
    /// <returns>Zero on success, otherwise the native error code.</returns>
    internal static int TryFStat(Microsoft.Win32.SafeHandles.SafeFileHandle handle, out NativeFileStatus status) =>
        FStat(handle, out status);
}
