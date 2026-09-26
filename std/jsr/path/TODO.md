# Path TODO

- Evaluate the Node.js compatibility differences identified in the path review,
  including `format()`, root-path parsing, separator preservation in `dirname()`,
  and Windows drive-relative resolution.
- Design a mutable `PathBuf` API inspired by Rust's `PathBuf`.
- Design a read-only `Path` API. It should expose useful views such as length
  and segments; decide separately whether its semantics should mirror Rust.
