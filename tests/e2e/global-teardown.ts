import { MongoClient } from "mongodb";

/** Removes any e2e_-prefixed accounts these tests created, from the real database. */
export default async function globalTeardown() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return;

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const users = await db.collection("users").find({ usernameLower: /^e2e_/ }).toArray();
    for (const user of users) {
      await db.collection("progress").deleteMany({ userId: user._id });
      await db.collection("sessions").deleteMany({ userId: user._id });
    }
    if (users.length > 0) {
      await db.collection("users").deleteMany({ usernameLower: /^e2e_/ });
      // eslint-disable-next-line no-console
      console.log(`[global-teardown] removed ${users.length} e2e test account(s)`);
    }
  } finally {
    await client.close();
  }
}
