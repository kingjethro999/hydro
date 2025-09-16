# Hydro → direct mappings to your codebase problems

For each numbered problem from your list I give:

1. A short feature description,
2. The `hydro` command(s) you’d run,
3. A small example of usage across OS shells.

---

## 1. Code Organization & Architecture

**Problem:** God files, spaghetti, circular deps, tight coupling, inconsistent architecture.
**Hydro features:** dependency graph, module hotspots, split suggestions, automatic scaffolding for extract.

Commands:

```
hydro codemap [--format json|dot|graph] [--path src]         # map modules & imports
hydro analyze --cycles [--path src]                         # find circular deps
hydro hotspots --size <lines> --path src                    # find god files (>lines)
hydro extract --file <path> --target <module> [--dry-run]   # scaffold safe extraction
```

Example:

* macOS / Linux:

```bash
cd ~/projects/my-api
hydro codemap --format dot --path src > codemap.dot
hydro analyze --cycles --path src
hydro hotspots --size 300 --path src
hydro extract --file src/controllers/bigController.js --target src/services/auth --dry-run
```

* PowerShell:

```powershell
cd C:\Projects\my-api
hydro codemap --format dot --path src | Out-File codemap.dot
hydro analyze --cycles --path src
hydro hotspots --size 300 --path src
hydro extract --file src\controllers\bigController.js --target src\services\auth --dry-run
```

* CMD:

```cmd
cd C:\Projects\my-api
hydro codemap --format dot --path src > codemap.dot
hydro analyze --cycles --path src
hydro hotspots --size 300 --path src
```

---

## 2. Readability & Maintainability

**Problem:** inconsistent naming, long functions, magic numbers, comment rot, poor docs.
**Hydro features:** repo-wide naming normalizer, function complexity reporter, constant extractor, doc generator.

Commands:

```
hydro rename --pattern "<old>" --to "<new>" [--lang js|py|java] [--dry-run]
hydro complexity --threshold 80 --path src            # highlight long/complex functions
hydro extract-consts --path src --pattern "<regex>"  # suggest constants
hydro docs generate [--format markdown|openapi]       # generate README / endpoint docs
```

Example:

* Dry-run rename:

```bash
hydro rename --pattern "user_id" --to "userId" --lang js --dry-run
```

---

## 3. Error Handling

**Problem:** silent failures, overuse of try/catch, unclear messages, scattered handling.
**Hydro features:** error audit, centralized handler suggestions, log-level checks.

Commands:

```
hydro audit-errors --level warn --path src
hydro suggest-error-handler --framework express|django|spring
hydro fix-errors --apply --path src   # optional: scaffolds suggested handlers (requires --apply)
```

Example:

```bash
hydro audit-errors --level warn --path src
hydro suggest-error-handler --framework express
```

---

## 4. Language & Framework-Specific Pain

**Problem:** async misuse (Node), dynamic typing (Python), boilerplate (Java), etc.
**Hydro features:** language-aware linters, common anti-pattern detectors, suggested idiomatic refactors.

Commands:

```
hydro lint --lang nodejs|python|java|go|rust --path src
hydro anti-patterns --lang nodejs|python --path src
hydro codemod --lang python --rule "type-hint-add" [--dry-run]
```

Example:

```bash
hydro lint --lang nodejs --path src
hydro anti-patterns --lang go --path src
hydro codemod --lang python --rule "type-hint-add" --dry-run
```

---

## 5. Database Layer Problems

**Problem:** raw queries everywhere, ORM abuse, business logic in SQL, migration chaos.
**Hydro features:** SQL usage map, ORM-raw mixing alerts, migration planner.

Commands:

```
hydro sql-lint --dialect postgres|mysql --path src
hydro db-usage --map > db-map.json
hydro migrate plan --migrations-dir db/migrations
hydro sql-to-model --suggest --path src  # suggests model wrappers for raw SQL
```

Example:

```bash
hydro sql-lint --dialect postgres --path src
hydro db-usage --map > db-map.json
hydro migrate plan --migrations-dir db/migrations
```

---

## 6. API Layer Issues

**Problem:** inconsistent response formats, hardcoded status codes, no versioning, scattered validation.
**Hydro features:** response formatter enforcer, status-code scan, endpoint version detector, centralized validation scaffolds.

Commands:

```
hydro api-check --format snake_case|camelCase --path src
hydro status-scan --path src
hydro versioning audit --path src
hydro gen-validation --framework express|fastapi --schema-dir schemas
```

Example:

```bash
hydro api-check --format camelCase --path src
hydro versioning audit --path src
hydro gen-validation --framework fastapi --schema-dir openapi/schemas
```

---

## 7. Testing & Code Quality

**Problem:** no tests, flaky tests, over-mocking, edge cases untested, duplicated test logic.
**Hydro features:** coverage hotspot reporter, test scaffold generator, flaky-test detector.

Commands:

```
hydro coverage --report --path tests --threshold 80
hydro test-suggest --path src --output tests/hydro-suggest
hydro flaky detect --ci-log ci/build.log
```

Example:

```bash
hydro coverage --report --path tests
hydro test-suggest --path src --output tests/hydro-suggest --dry-run
```

---

## 8. Dependency Management

**Problem:** too many libs, abandoned deps, custom patches, version conflicts.
**Hydro features:** deps audit, safe-upgrade plan, patch detector.

Commands:

```
hydro deps audit --format json
hydro deps upgrade --strategy safe --dry-run
hydro patch-detect --path node_modules|vendor
```

Example:

```bash
hydro deps audit --format json > deps-report.json
hydro deps upgrade --strategy safe --dry-run
```

---

## 9. Scalability in Code

**Problem:** hardcoded configs, blocking calls, global state, monolith boundaries unclear.
**Hydro features:** secret/config detector, blocking-call analyzer, global-state finder, suggested service split points.

Commands:

```
hydro secrets detect --path src
hydro blocking detect --path src
hydro globals find --path src
hydro split-suggest --path src --target-size 200kLOC
```

Example:

```bash
hydro secrets detect --path src
hydro blocking detect --path src
hydro split-suggest --path src --target-size 50
```

---

## 10. Refactoring Resistance

**Problem:** brittle code, no tests, legacy patterns, partial rewrites.
**Hydro features:** safe-refactor flow (codemod + test-run + rollback), refactor score, legacy-pattern reporter.

Commands:

```
hydro safe-refactor plan --id <refactor-id>
hydro safe-refactor run --id <refactor-id> [--apply]
hydro legacy report --path src
```

Example:

```bash
hydro safe-refactor plan --id split-auth-module
hydro safe-refactor run --id split-auth-module --dry-run
```

---

## 11. Technical Debt

**Problem:** quick hacks permanent, dead code, feature-flag sprawl, duplicate logic.
**Hydro features:** debt scanner, dead-code remover suggestions, feature-flag map, duplicate code finder.

Commands:

```
hydro debt scan --path src --export debt.csv
hydro dead-code find --path src
hydro flags map --path config
hydro dupfinder --path src --min-similarity 0.8
```

Example:

```bash
hydro debt scan --path src --export .hydro/debt.csv
hydro dead-code find --path src
hydro dupfinder --path src --min-similarity 0.85
```

---

# Global usage rules & safety (consistent with our initial design)

* **Dry-run default:** hydro simulates changes; to make changes use `--apply`.
* **Staged changes pattern:** when `--apply` is used, hydro creates staged git changes and a suggested commit message: `hydro: <summary>`.
* **Tests gate:** `--apply` will run `hydro test` (unit + smoke integration) before committing; if tests fail hydro rolls back.
* **Audit log:** All applied changes logged under `.hydro/audit.log` with commit SHAs for traceability.

---

# Example `hydro.yml` (keeps everything repo-focused)

```yaml
project: my-api
languages:
  - nodejs
  - sql
scan:
  include:
    - src
  exclude:
    - node_modules
rules:
  naming:
    style: camelCase
  complexity:
    max_function_lines: 120
outputs:
  reports: .hydro/reports
safety:
  dry_run_default: true
  apply_requires_tests: true
hooks:
  pre-commit:
    - hydro fmt --check
    - hydro sql-lint --dialect postgres
```

---

# Quick cross-OS install & a few shell examples

**Install (example via npm or binary):**

* macOS / Linux:

```bash
npm i -g hydro
```

* PowerShell:

```powershell
npm i -g hydro
$env:Path += ";C:\Tools"
```

* CMD:

```cmd
npm i -g hydro
```

**Common cross-OS command examples:**

```bash
# baseline scan (dry-run)
hydro scan --full --path src

# find circular deps
hydro analyze --cycles --path src

# suggest tests for low coverage areas
hydro test-suggest --path src --output tests/hydro-suggest

# lint SQL and rename a column safely (dry-run)
hydro sql-lint --dialect postgres --path src
hydro rename --pattern "user_id" --to "userId" --dry-run

# apply rename after review (runs tests)
hydro rename --pattern "user_id" --to "userId" --apply --staged
```

(Replace `hydro` with `hydro.exe` in Windows CMD if you installed the binary.)

---

# Final notes — exact alignment with your original list

* Each `hydro` command above **directly corresponds** to the specific items in your list (1 → codemap/hotspots/extract, 2 → rename/complexity/docs, 3 → audit-errors, … 11 → debt scan/dead-code/dupfinder).
* The tool scope is **strictly codebase-focused** (no infra or cloud orchestration), matching your instruction to cover problems *from the codebase angle* only.
* Defaults are conservative and reversible to avoid contradicting the “safe” approach we discussed earlier.

