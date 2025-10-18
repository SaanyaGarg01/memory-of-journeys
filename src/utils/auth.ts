// src/utils/auth.ts
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { app } from "../firebase";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    // The signed-in user info
    const user = result.user;
    console.log("User info:", user);
    return user;
  } catch (error) {
    console.error("Google login error:", error);
    return null;
  }
};

export const logout = async () => {
  await signOut(auth);
};
