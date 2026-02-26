import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

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
