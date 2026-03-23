import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.join(__dirname, "..");

function loadDotEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDotEnvFile(path.join(packageRoot, "../../apps/web/.env.local"));
loadDotEnvFile(path.join(packageRoot, "../../apps/web/.env"));

const relativeSqlPath = process.argv[2];
if (!relativeSqlPath) {
  console.error("Usage: node run-sql.mjs <path-to-sql-relative-to-package>");
  process.exit(1);
}

const sqlFile = path.join(packageRoot, relativeSqlPath);
if (!existsSync(sqlFile)) {
  console.error(`SQL file not found: ${sqlFile}`);
  process.exit(1);
}

const dbUrlRaw = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL;
const dbUrl = typeof dbUrlRaw === "string" ? dbUrlRaw.trim() : "";
if (!dbUrl) {
  console.error(
    "Missing DATABASE_URL or SUPABASE_DB_URL.\n" +
      "Supabase → Project Settings → Database → Connection string → URI (direct or session mode).\n" +
      "Add it to apps/web/.env or apps/web/.env.local, or export it in your shell."
  );
  process.exit(1);
}

if (
  dbUrl.includes("pooler.supabase.com") &&
  /^postgres(ql)?:\/\/postgres:/i.test(dbUrl)
) {
  console.error(
    "Hint: Session pooler URIs need user postgres.<project_ref>, not plain postgres.\n" +
      "Copy the full URI from Supabase Connect → Session pooler (user is shown there)."
  );
}

function decodeUriPart(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * psql + single URI string can mishandle percent-encoding in passwords; use discrete args + PGPASSWORD.
 */
function parsePostgresUrlForPsql(urlString) {
  try {
    const u = new URL(urlString);
    const scheme = u.protocol.replace(/:$/, "").toLowerCase();
    if (scheme !== "postgres" && scheme !== "postgresql") {
      return null;
    }
    const host = u.hostname;
    const user = decodeUriPart(u.username);
    const password = decodeUriPart(u.password);
    const port = u.port || "5432";
    const database = (u.pathname?.replace(/^\//, "") || "postgres") || "postgres";
    if (!host || !user) {
      return null;
    }
    const ssl =
      host.endsWith("supabase.co") || host.includes("pooler.supabase.com");
    return { host, port, user, password, database, ssl };
  } catch {
    return null;
  }
}

const parsed = parsePostgresUrlForPsql(dbUrl);

try {
  if (parsed) {
    const env = {
      ...process.env,
      PGPASSWORD: parsed.password,
      ...(parsed.ssl ? { PGSSLMODE: "require" } : {}),
    };
    execFileSync(
      "psql",
      [
        "-h",
        parsed.host,
        "-p",
        parsed.port,
        "-U",
        parsed.user,
        "-d",
        parsed.database,
        "-v",
        "ON_ERROR_STOP=1",
        "-f",
        sqlFile,
      ],
      { stdio: "inherit", env }
    );
  } else {
    execFileSync("psql", [dbUrl, "-v", "ON_ERROR_STOP=1", "-f", sqlFile], {
      stdio: "inherit",
    });
  }
} catch (err) {
  if (err?.code === "ENOENT") {
    console.error(
      "psql not found. Install PostgreSQL client tools, e.g.:\n" +
        "  brew install libpq && brew link --force libpq"
    );
  }
  process.exit(err?.status ?? 1);
}
