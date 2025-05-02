// enforces that this code can only be called on the server
import "server-only";

import * as admin from "firebase-admin";
import type { FS_CollectionPath, FS_DocPath } from "@eventory/shared-types/firestore";
import type { DocumentReference, ReadWriteTransactionOptions } from "firebase-admin/firestore";
import { resolvePath } from "../utils";

const serviceAccount = JSON.parse(process.env.FB_SERVICE_ACCOUNT_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const app = admin.app();

export const adminAuth = app.auth();

export const adminFirestore = admin.firestore();

/**
 * Firestore Admin 문서 참조를 생성합니다.
 */
export function adminDoc<T = FirebaseFirestore.DocumentData>(
  pathTemplate: FS_DocPath,
  ...segments: string[]
): DocumentReference<T> {
  const fullPath = resolvePath(pathTemplate, segments);
  return adminFirestore.doc(fullPath) as DocumentReference<T>;
}

/**
 * Firestore Admin 컬렉션 참조를 생성합니다.
 */
export function adminCollection(
  pathTemplate: FS_CollectionPath,
  ...segments: string[]
) {
  const fullPath = resolvePath(pathTemplate, segments);
  return adminFirestore.collection(fullPath);
}

export function adminRunTransaction<T>(
  updateFunction: (transaction: admin.firestore.Transaction) => Promise<T>,
  options?: ReadWriteTransactionOptions
) {
  return adminFirestore.runTransaction<T>(updateFunction, options);
}

export function adminServerTimestamp() {
  return admin.firestore.FieldValue.serverTimestamp();
}