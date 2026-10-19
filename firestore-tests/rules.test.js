/**
 * Firestore security rules tests. Run with `npm run test:rules`, which starts
 * the Firestore emulator (needs Java and the Firebase CLI).
 */
const fs = require("fs");
const path = require("path");
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  setLogLevel,
  updateDoc,
  where,
} = require("firebase/firestore");

let testEnv;

const meetingData = (extra = {}) => ({
  title: "Sync",
  date: "2026-10-19",
  duration: "1 Hour",
  timeFlex: "0 mins",
  type: "Online",
  platform: "Zoom",
  location: "",
  recurring: false,
  tags: [],
  ownerUid: "alice",
  participantIds: ["alice"],
  participants: [{ uid: "alice", name: "Alice", isOwner: true, isGuest: false }],
  ...extra,
});

const as = (uid) =>
  uid ? testEnv.authenticatedContext(uid).firestore() : testEnv.unauthenticatedContext().firestore();

const seed = (fn) => testEnv.withSecurityRulesDisabled((ctx) => fn(ctx.firestore()));

beforeAll(async () => {
  // Denied writes are expected here; don't print a warning for each one.
  setLogLevel("error");
  testEnv = await initializeTestEnvironment({
    projectId: "demo-meetsync",
    firestore: {
      rules: fs.readFileSync(path.join(__dirname, "..", "firestore.rules"), "utf8"),
    },
  });
});

afterAll(() => testEnv.cleanup());

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seed(async (db) => {
    await setDoc(doc(db, "users/alice"), { firstName: "Alice", availability: { Mon: [10] } });
    await setDoc(doc(db, "users/bob"), { firstName: "Bob", availability: { Mon: [10] } });
    await setDoc(doc(db, "meetings/m1"), meetingData());
  });
});

describe("users", () => {
  it("lets you write your own profile", async () => {
    await assertSucceeds(
      setDoc(doc(as("alice"), "users/alice"), { busy: [{ date: "2026-10-19", hours: [10] }] }, { merge: true })
    );
  });

  it("blocks writing someone else's profile", async () => {
    await assertFails(updateDoc(doc(as("alice"), "users/bob"), { availability: { Mon: [] } }));
  });

  it("rejects unknown profile fields", async () => {
    await assertFails(setDoc(doc(as("alice"), "users/alice"), { isAdmin: true }, { merge: true }));
  });

  it("lets signed-in users read a profile by id but not list them", async () => {
    await assertSucceeds(getDoc(doc(as("bob"), "users/alice")));
    await assertFails(getDocs(collection(as("bob"), "users")));
    await assertFails(getDoc(doc(as(null), "users/alice")));
  });
});

describe("meetings: create, read, list", () => {
  it("lets you create a meeting you own", async () => {
    await assertSucceeds(setDoc(doc(as("bob"), "meetings/m2"), meetingData({
      ownerUid: "bob",
      participantIds: ["bob"],
      participants: [{ uid: "bob", name: "Bob", isOwner: true, isGuest: false }],
    })));
  });

  it("blocks creating a meeting for someone else or pre-filled with other accounts", async () => {
    await assertFails(setDoc(doc(as("bob"), "meetings/m2"), meetingData()));
    await assertFails(setDoc(doc(as("bob"), "meetings/m2"), meetingData({
      ownerUid: "bob",
      participantIds: ["bob", "alice"],
    })));
  });

  it("lets anyone signed in open a meeting by id", async () => {
    await assertSucceeds(getDoc(doc(as("bob"), "meetings/m1")));
    await assertFails(getDoc(doc(as(null), "meetings/m1")));
  });

  it("only lists meetings you're in", async () => {
    await assertSucceeds(getDocs(query(collection(as("alice"), "meetings"), where("participantIds", "array-contains", "alice"))));
    await assertSucceeds(getDocs(query(collection(as("alice"), "meetings"), where("ownerUid", "==", "alice"))));
    await assertFails(getDocs(query(collection(as("bob"), "meetings"), where("participantIds", "array-contains", "alice"))));
    await assertFails(getDocs(collection(as("alice"), "meetings")));
  });
});

describe("meetings: joining", () => {
  const join = (uid, entry = { uid, name: "Bob", isGuest: false }) =>
    updateDoc(doc(as(uid), "meetings/m1"), {
      participantIds: arrayUnion(uid),
      participants: arrayUnion(entry),
    });

  it("lets you add yourself", async () => {
    await assertSucceeds(join("bob"));
  });

  it("blocks adding someone else", async () => {
    await assertFails(
      updateDoc(doc(as("bob"), "meetings/m1"), {
        participantIds: arrayUnion("carol"),
        participants: arrayUnion({ uid: "carol", name: "Carol", isGuest: false }),
      })
    );
  });

  it("blocks joining as the owner, a guest, or with a changed title", async () => {
    await assertFails(join("bob", { uid: "bob", name: "Bob", isGuest: false, isOwner: true }));
    await assertFails(join("bob", { uid: "bob", name: "Bob", isGuest: true }));
    await assertFails(
      updateDoc(doc(as("bob"), "meetings/m1"), {
        title: "Hijacked",
        participantIds: arrayUnion("bob"),
        participants: arrayUnion({ uid: "bob", name: "Bob", isGuest: false }),
      })
    );
  });

  it("blocks replacing the participant list", async () => {
    await assertFails(
      updateDoc(doc(as("bob"), "meetings/m1"), {
        participantIds: ["alice", "bob"],
        participants: [{ uid: "bob", name: "Bob", isGuest: false }],
      })
    );
  });

  it("blocks joining twice or after a time is picked", async () => {
    await assertSucceeds(join("bob"));
    await assertFails(join("bob", { uid: "bob", name: "Bob again", isGuest: false }));

    await seed((db) => updateDoc(doc(db, "meetings/m1"), { selectedSlot: { startHour: 10, label: "10:00 - 11:00" } }));
    await assertFails(join("carol", { uid: "carol", name: "Carol", isGuest: false }));
  });
});

describe("meetings: owner actions", () => {
  it("lets the owner add guests, pick a time and delete", async () => {
    const db = as("alice");
    await assertSucceeds(
      updateDoc(doc(db, "meetings/m1"), {
        participants: arrayUnion({ guestId: "g1", name: "Guest", isGuest: true, availability: { Mon: [10] } }),
      })
    );
    await assertSucceeds(updateDoc(doc(db, "meetings/m1"), { selectedSlot: { startHour: 10, label: "10:00 - 11:00", dayKey: "Mon" } }));
    await assertSucceeds(deleteDoc(doc(db, "meetings/m1")));
  });

  it("blocks the owner from adding other accounts", async () => {
    await assertFails(updateDoc(doc(as("alice"), "meetings/m1"), { participantIds: arrayUnion("bob") }));
  });

  it("blocks participants from picking a time, editing or deleting", async () => {
    await seed((db) =>
      updateDoc(doc(db, "meetings/m1"), {
        participantIds: arrayUnion("bob"),
        participants: arrayUnion({ uid: "bob", name: "Bob", isGuest: false }),
      })
    );
    const db = as("bob");
    await assertFails(updateDoc(doc(db, "meetings/m1"), { selectedSlot: { startHour: 10 } }));
    await assertFails(updateDoc(doc(db, "meetings/m1"), { title: "Mine now" }));
    await assertFails(deleteDoc(doc(db, "meetings/m1")));
  });
});
