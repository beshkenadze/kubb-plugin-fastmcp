# Releasing @beshkenadze/kubb-plugin-fastmcp

This guide describes how to release a new version of the package to NPM.

## Prerequisites

- You must be logged in to NPM (`npm whoami`)
- Git working directory should be clean
- All tests should pass
- Code should be built successfully

## Release Process

### 1. Run Pre-Release Checks

```bash
# Lint the code
bun lint

# Type check
bun typecheck

# Run all tests
bun test

# Build the package
bun build
```

### 2. Update Version

Edit `package.json` and update the version field following semantic versioning:

- **Patch** (0.1.0 → 0.1.1): Bug fixes only
- **Minor** (0.1.0 → 0.2.0): New features, backward compatible
- **Major** (0.1.0 → 1.0.0): Breaking changes

### 3. Commit Version Change

```bash
git add package.json
git commit -m "chore: bump version to X.Y.Z"
```

### 4. Create Git Tag (Recommended)

```bash
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
```

### 5. Publish to NPM

#### Standard Release
```bash
bun release
# or
pnpm publish --no-git-check
```

#### Canary Release (Pre-release Testing)
```bash
bun release:canary
```

## Release Commands

| Command | Description |
|---------|------------|
| `bun release` | Publish stable version to NPM |
| `bun release:canary` | Publish canary/pre-release version |

## Notes

- The package is published publicly to `@beshkenadze/kubb-plugin-fastmcp`
- Publishing requires proper NPM authentication
- Canary releases are useful for testing changes before stable release