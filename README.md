# SwapKit

### _Integrate Blockchains easily_

## Usage

[Documentation](https://swapkit.github.io/SwapKit)


## Packages

This repo contains packages around SwapKit sdk and its integrations with different blockchains.

## Contributing

#### Pre-requisites

1.

```bash
curl -fsSL https://bun.sh/install | bash
```

2.

```pre
Copy .env.example to .env and fill it with data
```

### Installation

```bash
bun bootstrap
```

#### Branches

- `develop` - development branch - start from here in case of contribution
- `nightly` - branch for nightly builds - can be used for testing purposes
- `docs` - branch for documentation
- `feat/*` - branches for features
- `chore/*` - branches for smaller tasks


#### Testing

To run tests use `bun test` command.

#### Pull requests

- PRs should be created from `develop` branch
- PRs should be reviewed by at least Code Owner (see CODEOWNERS file)
- PRs should have scope in commit message (see commit messages section)
- PRs should have tests if it's possible
- PRs should have changeset file if it's needed (see release section)

### Release and publish

Packages are automatically published to npm when new PR is merged to `main` & `develop` branches.
To automate and handle process we use [changesets](https://github.com/changesets/changesets) and github action workflows.

<b>Before running `bun changeset` you have to pull `main` & `develop`</b>

To release new version of package you need to create PR with changes and add changeset file to your commit.

```bash
bun changeset
```

After PR is merged to `develop` branch with changeset file, github action will create new PR with updated versions of packages and changelogs.


| Package                  | Client | Both | Server |
| ------------------------ | ------ | ---- | ------ |
| @swapkit/client          | -      | ✅    | -      |
| @swapkit/helpers         | -      | ✅    | -      |
| @swapkit/plugins         | ✅      | -    | ❌      |
| @swapkit/toolboxes       | -      | ✅    | -      |
| @swapkit/wallet-keystore | -      | ✅    | -      |
| @swapkit/wallets         | ✅      | -    | ❌      |
| @swapkit/types           | -      | ✅    | -      |
