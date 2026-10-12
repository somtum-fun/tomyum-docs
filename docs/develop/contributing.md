# Contributing and code style

TomYum-OSS is MIT licensed. Issues and pull requests are welcome on
[GitHub](https://github.com/somtum-fun/TomYum-OSS).

Everyone taking part (issues, pull requests, discussions) follows our
[Code of Conduct](https://github.com/somtum-fun/TomYum-OSS/blob/main/CODE_OF_CONDUCT.md), the
Contributor Covenant 2.1. Report problems to [mind@somtum.fun](mailto:mind@somtum.fun).

::: warning Security problems
Please don't report a security problem in a public issue. Email
[mind@somtum.fun](mailto:mind@somtum.fun) instead: what it is, how to reproduce it, and the version
you tested. We'll reply within a few days and credit you in the fix unless you'd rather not be named.
The full policy is in [SECURITY.md](https://github.com/somtum-fun/TomYum-OSS/blob/main/SECURITY.md).
:::

## Before you open a pull request

```bash
dotnet build TomYum.sln -c Release    # must finish with 0 warnings: warnings are errors
dotnet test TomYum.sln
```

CI runs the same build and the tests, with MySQL and Redis for the database tests. To run those
locally, see [Try it locally](/guide/local-testing#running-tomyum-s-tests). Never point the tests at a
real server's database.

- **One change per pull request**, with tests for what it changes. A bug fix comes with a test that
  failed before it.
- **Database changes** go in an EF Core migration (`src/TomYum.Persistence/Migrations`); TomYum applies
  them at start-up. Tables that belong to the website are changed in the osu-web fork, not here.
- **New settings** get a default that works, an entry in `config/tomyum.yaml.example` or the env
  examples in `deploy/production`, and a line in the [configuration reference](/reference/configuration).
- **No server's own names** (domains, emails, branding) in code or defaults: everything comes from
  configuration. Server-specific behaviour belongs in a [plugin](/operations/plugins).
- **Security problems:** don't open a public issue; contact the maintainers privately first.

## Code style

`.editorconfig` and `Directory.Build.props` hold the rules, and the build enforces them
(`TreatWarningsAsErrors`, .NET analyzers at `Recommended`, `EnforceCodeStyleInBuild`). In short:

- C# `latest`, nullable reference types on, file-scoped namespaces, 4 spaces, LF line endings.
- `var` where the type is obvious; braces on blocks.
- Public members get XML doc comments (`<summary>`, and `<param>` for every parameter).
- A `CancellationToken` parameter comes last.
- Async all the way: no `.Result` or `.Wait()`; `ConfigureAwait(false)` in libraries.
- Match the code around you: its naming, its comment density, how it logs.

### Writing for players

Messages players see (BanchoBot, notifications, errors) are plain and friendly: short sentences, no
jargon, say what to do next. "Your score wasn't submitted: the map changed. Download it again and
retry." rather than "Error 0x3: checksum mismatch".

## Commit messages

One line that says what changed and why, in plain words. Add a body when the why needs more room.
