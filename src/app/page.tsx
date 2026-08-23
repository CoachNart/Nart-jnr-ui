@@
-import { useEffect, useState } from "react";
-import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
-import { auth, googleProvider, initAnalytics } from "@/lib/firebase";
+import { useEffect, useState } from "react";
+import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from "firebase/auth";
+import { auth, googleProvider, initAnalytics } from "@/lib/firebase";
@@
-  async function loginWithGoogle() {
-    try {
-      setAuthError(null);
-      setAuthLoading(true);
-
-      const result = await signInWithPopup(auth, googleProvider);
-
-      if (result.user) {
-        setAuthUser({
-          id: result.user.uid,
-          email: result.user.email || "",
-          displayName: result.user.displayName,
-          photoURL: result.user.photoURL,
-        });
-
-        setUserId(result.user.uid);
-      }
-    } catch (error) {
-      console.error("❌ Firebase Google sign-in failed:", error);
-
-      if (error instanceof Error) {
-        setAuthError(error.message);
-      } else {
-        setAuthError("Google sign-in failed. Please try again.");
-      }
-    } finally {
-      setAuthLoading(false);
-    }
-  }
+  async function loginWithGoogle() {
+    try {
+      setAuthError(null);
+      setAuthLoading(true);
+
+      // quick offline check
+      if (typeof window !== "undefined" && !navigator.onLine) {
+        throw new Error("Network unavailable — check your internet connection and try again.");
+      }
+
+      try {
+        const result = await signInWithPopup(auth, googleProvider);
+
+        if (result.user) {
+          setAuthUser({
+            id: result.user.uid,
+            email: result.user.email || "",
+            displayName: result.user.displayName,
+            photoURL: result.user.photoURL,
+          });
+
+          setUserId(result.user.uid);
+        }
+      } catch (err) {
+        // If popup is blocked or environment doesn't support popup flows, fall back to redirect
+        console.warn("signInWithPopup failed — attempting redirect fallback:", err);
+
+        const code = (err as any)?.code || "";
+        const msg = (err as Error)?.message || "";
+
+        const isPopupBlocked =
+          code === "auth/popup-blocked" ||
+          code === "auth/cancelled-popup-request" ||
+          code === "auth/operation-not-supported-in-this-environment" ||
+          /popup/i.test(msg);
+
+        const isNetwork =
+          code === "auth/network-request-failed" ||
+          /failed to fetch|Failed to fetch|network/i.test(msg);
+
+        if (isPopupBlocked) {
+          // start redirect flow — user will be taken back after sign-in
+          await signInWithRedirect(auth, googleProvider);
+          return;
+        }
+
+        if (isNetwork) {
+          throw new Error(
+            "Network request failed — please check your internet connection, disable blocking extensions or VPN/proxy, and try again."
+          );
+        }
+
+        // rethrow other errors so outer catch handles them
+        throw err;
+      }
+    } catch (error) {
+      console.error("❌ Firebase Google sign-in failed:", error);
+
+      if (error instanceof Error) {
+        setAuthError(error.message);
+      } else {
+        setAuthError("Google sign-in failed. Please try again.");
+      }
+    } finally {
+      setAuthLoading(false);
+    }
+  }
