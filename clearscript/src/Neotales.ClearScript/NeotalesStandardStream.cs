namespace Neotales.ClearScript;

/// <summary>
/// A Node-compatible standard stream backed by the .NET console.
/// </summary>
public sealed class NeotalesStandardStream(TextWriter writer, string name, bool isTerm)
{
    private long writeCount;

    /// <summary>Gets the stream name, for example <c>stdout</c> or <c>stderr</c>.</summary>
    public string Name { get; } = name;

    /// <summary>Gets the number of writes performed through this stream.</summary>
    public long WriteCount => writeCount;

    /// <summary>Gets a value indicating whether the stream is attached to a terminal.</summary>
    public bool IsTerm { get; } = isTerm;

    /// <summary>Gets the number of columns reported to JavaScript.</summary>
    public int Columns => IsTerm ? ReadColumns() : 0;

    /// <summary>Gets the number of rows reported to JavaScript.</summary>
    public int Rows => IsTerm ? ReadRows() : 0;

    /// <summary>Writes text followed by a newline.</summary>
    /// <param name="text">The text to write.</param>
    public void WriteLine(string text)
    {
        writeCount++;
        writer.WriteLine(text);
    }

    /// <summary>Writes text without a trailing newline.</summary>
    /// <param name="text">The text to write.</param>
    public void Write(string text)
    {
        writeCount++;
        writer.Write(text);
    }

    /// <summary>Flushes buffered output.</summary>
    public void Flush() => writer.Flush();

    private static int ReadColumns()
    {
        try
        {
            return Console.WindowWidth > 0 ? Console.WindowWidth : 80;
        }
        catch (IOException)
        {
            return 80;
        }
    }

    private static int ReadRows()
    {
        try
        {
            return Console.WindowHeight > 0 ? Console.WindowHeight : 24;
        }
        catch (IOException)
        {
            return 24;
        }
    }
}
