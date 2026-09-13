const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

async function wipeAndReset() {
  try {
    console.log("Deleting bookings...");
    const bookings = await db.collection("bookings").get();
    for (const doc of bookings.docs) {
      await doc.ref.delete();
    }
    console.log(`Deleted ${bookings.docs.length} bookings.`);

    console.log("Deleting landing_leads...");
    const leads = await db.collection("landing_leads").get();
    for (const doc of leads.docs) {
      await doc.ref.delete();
    }
    console.log(`Deleted ${leads.docs.length} landing leads.`);

    console.log("Resetting rooms...");
    const rooms = await db.collection("rooms").get();
    for (const doc of rooms.docs) {
      if (doc.data().status !== "Available") {
        await doc.ref.update({ status: "Available" });
      }
    }
    console.log(`Reset ${rooms.docs.length} rooms to Available.`);

    console.log("Done!");
  } catch (err) {
    console.error("Error wiping data:", err);
  }
}

wipeAndReset();
