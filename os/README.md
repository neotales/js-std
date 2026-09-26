# os

Bindings to operating system facilities: the macOS keychain, the GNOME keyring, the
Windows credential store, DPAPI, and the Windows registry.

Every package here calls into a native system library, and most of them behave
differently per operating system. That is why they are in their own group: the extra
build setup and the platform-specific CI do not slow down or destabilise the general
purpose packages in [`std`](../std).

## Status

No packages yet. The migration from
[neotales/js-os](https://github.com/neotales/js-os) is tracked in
[issue #5](https://github.com/neotales/js-std/issues/5).

## Packages being brought in

| Module            | Operating system | What it does                                 |
| ----------------- | ---------------- | -------------------------------------------- |
| `darwin-keychain` | macOS            | Reads and writes Keychain entries            |
| `linux-libsecret` | Linux            | Reads and writes GNOME Keyring entries       |
| `win-cred`        | Windows          | Reads and writes Credential Manager entries  |
| `win-dpapi`       | Windows          | Encrypts and decrypts with DPAPI             |
| `win-registry`    | Windows          | Reads and writes the Windows registry        |
| `is-elevated`     | all              | Reports whether the process has admin rights |

Published names do not change. `@neotales/win-cred` on npm is the same package before
and after the move.

## Layout

```text
os/
  deno.json     tasks for this group
  package.json  pnpm and npm view of this group
  jsr/<module>  Deno source, published to JSR
  npm/<module>  generated npm build, published to npm
```

## Testing

These packages cannot be fully verified on one machine. A green run on Linux says
nothing about DPAPI. The CI matrix for this group has to cover macOS, Linux, and
Windows, and the group is not done until all three are green.

## License

[MIT](./LICENSE.md)
