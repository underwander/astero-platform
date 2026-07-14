require("dotenv/config");

const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

const apply = process.argv.includes("--apply");
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is empty. Add it to .env before running this script.");
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function main() {
  const { rows: columns } = await pool.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'User'
        AND column_name IN ('id', 'email', 'role', 'password', 'plainPassword', 'clientNumber', 'createdAt')
    `,
  );
  const existingColumns = new Set(columns.map((column) => column.column_name));

  for (const requiredColumn of ["id", "email", "role", "password", "plainPassword"]) {
    if (!existingColumns.has(requiredColumn)) {
      console.log(`Column "${requiredColumn}" is missing. Apply the current database schema before syncing passwords.`);
      console.log("Run `npx prisma db push` on the server, then run this script again.");
      return;
    }
  }

  const clientNumberSelect = existingColumns.has("clientNumber") ? `"clientNumber"` : `NULL AS "clientNumber"`;
  const orderBy = existingColumns.has("createdAt") ? `ORDER BY "createdAt" ASC` : `ORDER BY email ASC`;

  const { rows } = await pool.query(
    `
      SELECT id, email, ${clientNumberSelect}, "plainPassword", password
      FROM "User"
      WHERE role = 'CLIENT'
        AND "plainPassword" IS NOT NULL
        AND length("plainPassword") >= 6
      ${orderBy}
    `,
  );

  let alreadySynced = 0;
  let updated = 0;
  const mismatched = [];

  for (const user of rows) {
    const plainPassword = String(user.plainPassword);
    const isSynced = await bcrypt.compare(plainPassword, user.password);

    if (isSynced) {
      alreadySynced += 1;
      continue;
    }

    mismatched.push({
      id: user.id,
      email: user.email,
      clientNumber: user.clientNumber || "-",
    });

    if (apply) {
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      await pool.query(
        `UPDATE "User" SET password = $1 WHERE id = $2`,
        [hashedPassword, user.id],
      );
      updated += 1;
    }
  }

  console.log(`Checked clients: ${rows.length}`);
  console.log(`Already synced: ${alreadySynced}`);
  console.log(apply ? `Updated hashes: ${updated}` : `Need update: ${mismatched.length}`);

  if (mismatched.length > 0) {
    console.table(mismatched.slice(0, 50));
    if (mismatched.length > 50) {
      console.log(`And ${mismatched.length - 50} more clients...`);
    }
  }

  if (!apply && mismatched.length > 0) {
    console.log("Dry run only. Run `npm run sync:client-password-hashes` to update hashes.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
