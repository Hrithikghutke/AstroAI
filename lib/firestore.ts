import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateShareId } from "@/lib/generateId";

const STARTING_CREDITS = 5;

/* -------------------------------------------------------
   Create a new user document when they sign up.
   Called from the webhook in Step 10.
------------------------------------------------------- */
export async function createUserRecord(clerkUserId: string, email: string) {
  const userRef = doc(db, "users", clerkUserId);
  const existing = await getDoc(userRef);

  // Don't overwrite if they already exist
  if (existing.exists()) return;

  await setDoc(userRef, {
    clerkUserId,
    email,
    credits: STARTING_CREDITS,
    totalGenerated: 0,
    createdAt: serverTimestamp(),
  });
}

/* -------------------------------------------------------
   Get a user's current credit balance.
------------------------------------------------------- */
export async function getUserCredits(clerkUserId: string): Promise<number> {
  const userRef = doc(db, "users", clerkUserId);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return 0;
  return snap.data().credits ?? 0;
}

/* -------------------------------------------------------
   Deduct 1 credit and increment totalGenerated.
   Returns false if the user doesn't have enough credits.
------------------------------------------------------- */
export async function deductCredit(clerkUserId: string): Promise<boolean> {
  const credits = await getUserCredits(clerkUserId);

  if (credits < 1) return false;

  const userRef = doc(db, "users", clerkUserId);
  await updateDoc(userRef, {
    credits: increment(-1),
    totalGenerated: increment(1),
  });

  return true;
}

/* -------------------------------------------------------
   Add credits to a user (called after payment).
------------------------------------------------------- */
export async function addCredits(
  clerkUserId: string,
  amount: number,
): Promise<void> {
  const userRef = doc(db, "users", clerkUserId);
  await updateDoc(userRef, {
    credits: increment(amount),
  });
}

/* -------------------------------------------------------
   Save a generated website to Firestore.
   Returns the new document id and shareId.
------------------------------------------------------- */
export async function saveGeneration(
  clerkUserId: string,
  prompt: string,
  layout: any,
): Promise<{ id: string; shareId: string }> {
  const shareId = generateShareId();

  const docRef = await addDoc(collection(db, "generations"), {
    clerkUserId,
    prompt,
    layout,
    shareId,
    siteName: layout?.branding?.logoText ?? "Untitled",
    themeStyle: layout?.themeStyle ?? "corporate",
    createdAt: serverTimestamp(),
  });

  return { id: docRef.id, shareId };
}

/* -------------------------------------------------------
   Get all saved sites for a user, newest first.
------------------------------------------------------- */
export async function getUserGenerations(clerkUserId: string) {
  const q = query(
    collection(db, "generations"),
    where("clerkUserId", "==", clerkUserId),
    orderBy("createdAt", "desc"),
  );

  const snap = await getDocs(q);

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    // Convert Firestore timestamp to ISO string for JSON serialization
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
  }));
}

/* -------------------------------------------------------
   Get a single generation by shareId (public — no auth).
------------------------------------------------------- */
export async function getGenerationByShareId(shareId: string) {
  const q = query(
    collection(db, "generations"),
    where("shareId", "==", shareId),
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  const doc = snap.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
  };
}

/* -------------------------------------------------------
   Delete a generation — only if it belongs to the user.
------------------------------------------------------- */
export async function deleteGeneration(
  docId: string,
  clerkUserId: string,
): Promise<void> {
  const ref = doc(db, "generations", docId);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error("Not found");
  if (snap.data().clerkUserId !== clerkUserId) throw new Error("Unauthorized");

  await deleteDoc(ref);
}

/* -------------------------------------------------------
  Update a generation with new layout and prompt — only if it belongs to the user.
------------------------------------------------------- */

export async function updateGeneration(
  docId: string,
  clerkUserId: string,
  layout: any,
  prompt: string,
): Promise<void> {
  const ref = doc(db, "generations", docId);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error("Not found");
  if (snap.data().clerkUserId !== clerkUserId) throw new Error("Unauthorized");

  await updateDoc(ref, {
    layout,
    prompt,
    siteName: layout?.branding?.logoText ?? "Untitled",
    themeStyle: layout?.themeStyle ?? "corporate",
    updatedAt: serverTimestamp(),
  });
}
