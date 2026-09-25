using System.Collections;

namespace Neotales.ClearScript;

/// <summary>
/// Exposes the real process environment to JavaScript as <c>process.env</c>.
/// </summary>
public sealed class NeotalesEnvironment
{
    /// <summary>Gets a value by name, or <c>null</c> when the variable is not set.</summary>
    /// <param name="name">The variable name.</param>
    public string? Get(string name) => Environment.GetEnvironmentVariable(name);

    /// <summary>Determines whether a variable is set and not empty.</summary>
    /// <param name="name">The variable name.</param>
    public bool Has(string name) => Environment.GetEnvironmentVariable(name) is not null;

    /// <summary>Sets a variable for the host process.</summary>
    /// <param name="name">The variable name.</param>
    /// <param name="value">The variable value.</param>
    public void Set(string name, string value) => Environment.SetEnvironmentVariable(name, value);

    /// <summary>Removes a variable from the host process.</summary>
    /// <param name="name">The variable name.</param>
    public void Delete(string name) => Environment.SetEnvironmentVariable(name, null);

    /// <summary>Gets every variable name defined for the host process.</summary>
    public string[] Keys()
    {
        var names = new List<string>();
        foreach (DictionaryEntry entry in Environment.GetEnvironmentVariables()) names.Add((string)entry.Key);
        names.Sort(StringComparer.Ordinal);
        return [.. names];
    }
}
