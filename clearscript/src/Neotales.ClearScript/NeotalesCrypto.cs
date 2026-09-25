using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;

namespace Neotales.ClearScript;

/// <summary>
/// Exposes cryptographically secure primitives to JavaScript, including the small
/// Web Crypto subset that the Neotales modules use for AES-GCM secrets.
/// </summary>
public sealed class NeotalesCrypto
{
    private readonly ConcurrentDictionary<string, byte[]> keys = new(StringComparer.Ordinal);
    private long nextKeyId;

    /// <summary>Fills a request with random bytes.</summary>
    /// <param name="count">The number of random bytes to produce.</param>
    /// <returns>The base64 encoded random bytes.</returns>
    public string GetRandomValues(int count)
    {
        if (count < 0) throw new ArgumentOutOfRangeException(nameof(count));
        var bytes = new byte[count];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes);
    }

    /// <summary>Creates a random UUID.</summary>
    /// <returns>The identifier in canonical form.</returns>
    public string RandomUuid() => Guid.NewGuid().ToString("D");

    /// <summary>Imports a raw symmetric key and returns its handle.</summary>
    /// <param name="format">The key format. Only <c>raw</c> is supported.</param>
    /// <param name="keyData">The base64 encoded key material.</param>
    /// <param name="algorithm">The algorithm name, for example <c>AES-GCM</c>.</param>
    /// <param name="usages">The permitted key usages. Recorded but not enforced.</param>
    public string ImportKey(string format, string keyData, string algorithm, object? usages)
    {
        if (!string.Equals(format, "raw", StringComparison.OrdinalIgnoreCase))
        {
            throw new NotSupportedException($"Key format '{format}' is not supported by this host.");
        }

        var handle = $"neotales-key-{Interlocked.Increment(ref nextKeyId)}";
        keys[handle] = Convert.FromBase64String(keyData);
        return handle;
    }

    /// <summary>Encrypts data with an imported AES-GCM key.</summary>
    /// <param name="algorithm">The algorithm name. Only <c>AES-GCM</c> is supported.</param>
    /// <param name="iv">The base64 encoded initialization vector.</param>
    /// <param name="additionalData">Optional base64 encoded additional authenticated data.</param>
    /// <param name="key">The key handle returned by <see cref="ImportKey"/>.</param>
    /// <param name="data">The base64 encoded plaintext.</param>
    /// <returns>The base64 encoded ciphertext with the authentication tag appended.</returns>
    public string Encrypt(
        string algorithm,
        string? iv,
        string? additionalData,
        string key,
        string data)
    {
        RequireAesGcm(algorithm);
        var keyBytes = KeyOf(key);
        var plaintext = Convert.FromBase64String(data);
        var ciphertext = new byte[plaintext.Length];
        var tag = new byte[16];
        using var aes = new AesGcm(keyBytes, tag.Length);
        aes.Encrypt(
            Convert.FromBase64String(iv ?? throw new ArgumentNullException(nameof(iv))),
            plaintext,
            ciphertext,
            tag,
            Decode(additionalData));
        var result = new byte[ciphertext.Length + tag.Length];
        ciphertext.CopyTo(result, 0);
        tag.CopyTo(result, ciphertext.Length);
        return Convert.ToBase64String(result);
    }

    /// <summary>Decrypts data with an imported AES-GCM key.</summary>
    /// <param name="algorithm">The algorithm name. Only <c>AES-GCM</c> is supported.</param>
    /// <param name="iv">The base64 encoded initialization vector.</param>
    /// <param name="additionalData">Optional base64 encoded additional authenticated data.</param>
    /// <param name="key">The key handle returned by <see cref="ImportKey"/>.</param>
    /// <param name="data">The base64 encoded ciphertext with the authentication tag appended.</param>
    /// <returns>The base64 encoded plaintext.</returns>
    public string Decrypt(
        string algorithm,
        string? iv,
        string? additionalData,
        string key,
        string data)
    {
        RequireAesGcm(algorithm);
        var keyBytes = KeyOf(key);
        var payload = Convert.FromBase64String(data);
        if (payload.Length < 16) throw new CryptographicException("Ciphertext is missing the authentication tag.");
        var ciphertext = payload[..^16];
        var tag = payload[^16..];
        var plaintext = new byte[ciphertext.Length];
        using var aes = new AesGcm(keyBytes, tag.Length);
        aes.Decrypt(
            Convert.FromBase64String(iv ?? throw new ArgumentNullException(nameof(iv))),
            ciphertext,
            tag,
            plaintext,
            Decode(additionalData));
        return Convert.ToBase64String(plaintext);
    }

    /// <summary>Computes a message digest.</summary>
    /// <param name="algorithm">The digest algorithm name.</param>
    /// <param name="data">The base64 encoded input.</param>
    /// <returns>The base64 encoded digest.</returns>
    public string Digest(string algorithm, string data)
    {
        var payload = Convert.FromBase64String(data);
        var name = algorithm.ToUpperInvariant();
        byte[] digest = name switch
        {
            "SHA-1" => SHA1.HashData(payload),
            "SHA-256" => SHA256.HashData(payload),
            "SHA-384" => SHA384.HashData(payload),
            "SHA-512" => SHA512.HashData(payload),
            _ => throw new NotSupportedException($"Digest algorithm '{algorithm}' is not supported."),
        };
        return Convert.ToBase64String(digest);
    }

    private static void RequireAesGcm(string algorithm)
    {
        if (!string.Equals(algorithm, "AES-GCM", StringComparison.OrdinalIgnoreCase))
        {
            throw new NotSupportedException($"Algorithm '{algorithm}' is not supported by this host.");
        }
    }

    private static byte[]? Decode(string? base64) =>
        base64 is null ? null : Convert.FromBase64String(base64);

    private byte[] KeyOf(string handle) =>
        keys.TryGetValue(handle, out var key)
            ? key
            : throw new CryptographicException($"Unknown crypto key handle '{handle}'.");
}
