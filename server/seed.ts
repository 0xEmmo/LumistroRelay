import { createConnection, type RowDataPacket } from "mysql2/promise";
import { ENV } from "./_core/env";

const workspaceSlug = "foodician-demo";
const brandSlug = "foodician";
const foodicianWebsite = "https://treatsbyfoodician.com.ng/";

async function seedFoodicianWorkspace() {
  if (!ENV.databaseUrl) throw new Error("DATABASE_URL is required to seed the Foodician demo.");

  const connection = await createConnection(ENV.databaseUrl);
  try {
    await connection.execute(
      "INSERT IGNORE INTO `workspaces` (`slug`, `name`) VALUES (?, ?)",
      [workspaceSlug, "Foodician Demo Workspace"],
    );

    const [workspaceRows] = await connection.execute<RowDataPacket[]>(
      "SELECT `id` FROM `workspaces` WHERE `slug` = ? LIMIT 1",
      [workspaceSlug],
    );
    const workspaceId = workspaceRows[0]?.id;
    if (typeof workspaceId !== "number") throw new Error("Foodician workspace seed could not be resolved.");

    await connection.execute(
      "INSERT IGNORE INTO `brands` (`workspaceId`, `slug`, `name`, `websiteUrl`, `isDemo`) VALUES (?, ?, ?, ?, ?)",
      [workspaceId, brandSlug, "Foodician", foodicianWebsite, true],
    );
  } finally {
    await connection.end();
  }
}

seedFoodicianWorkspace()
  .then(() => console.log("Foodician demo workspace and brand are ready."))
  .catch(error => {
    console.error("Foodician demo seed failed:", error instanceof Error ? error.message : "unknown error");
    process.exitCode = 1;
  });
