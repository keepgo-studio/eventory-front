"use client";

import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as _onAuthStateChanged,
  type NextOrObserver,
  type User,
  signOut as _signOut,
} from "firebase/auth";
import {
  getFirestore,
  getDoc as _getDoc,
  doc as _doc,
  collection as _collection,
  runTransaction as _runTransaction,
  DocumentReference,
  writeBatch,
  Transaction,
  type TransactionOptions
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { 
  firebaseConfig,
} from "./config";
import { resolvePath } from "../utils";
import type { FS_CollectionPath, FS_DocPath } from "@eventory/shared-types/firestore";


const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);

export function onAuthStateChanged(cb: NextOrObserver<User>) {
  return _onAuthStateChanged(auth, cb);
}

/**
 * @description
 *
 * YouTube API 접근을 위한 스코프들 추가
 * API scope reference: https://developers.google.com/identity/protocols/oauth2/scopes
 *
 * setCustomParameters 로 refresh token 받아옴
 * reference: https://firebase.google.com/docs/auth/extend-with-blocking-functions?gen=2nd#google
 */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();

  provider.addScope("profile");
  provider.addScope("email");
  provider.addScope("https://www.googleapis.com/auth/youtube.readonly");
  // provider.addScope("https://www.googleapis.com/auth/youtube.force-ssl");
  // provider.addScope(
  //   "https://www.googleapis.com/auth/youtube.channel-memberships.creator"
  // );
  provider.setCustomParameters({
    access_type: "offline",
    prompt: "consent",
  });

  try {
    return await signInWithPopup(auth, provider);
  } catch (err) {
    console.error("Error while signing in with Google", err);
  }
}

export async function signOut() {
  return _signOut(auth);
}

/**
 * Firestore 컬렉션 참조를 생성합니다.
 * @param db Firestore 인스턴스
 * @param pathTemplate 경로 템플릿 (예: 'events/:eventId/participants')
 * @param segments 경로 템플릿의 플레이스홀더에 대응하는 값들
 * @returns Firestore 컬렉션 참조
 */
export function collection(
  pathTemplate: FS_CollectionPath,
  ...segments: string[]
) {
  const fullPath = resolvePath(pathTemplate, segments);
  return _collection(db, fullPath);
}

/**
 * Firestore 문서 참조를 생성합니다.
 * @param db Firestore 인스턴스
 * @param pathTemplate 경로 템플릿 (예: 'events/:eventId/participants/:participantId')
 * @param segments 경로 템플릿의 플레이스홀더에 대응하는 값들
 * @returns Firestore 문서 참조
 */
export function doc<T = unknown>(pathTemplate: FS_DocPath, ...segments: string[]) {
  const fullPath = resolvePath(pathTemplate, segments);
  return _doc(db, fullPath) as DocumentReference<T>;
}

type RunTransactionParams = Parameters<typeof _runTransaction>;

/**
 * 포팅한 doc 타입 추론을 돕기 위해 만든 함수
 */
export async function getDoc<T = unknown>(ref: DocumentReference<T>): Promise<T | null> {
  const snap = await _getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export function runTransaction<T>(
  updateFunction: (transaction: Transaction) => Promise<T>,
  options?: TransactionOptions
) {
  return _runTransaction<T>(db, updateFunction, options);
}

export const createBatch = () => writeBatch(db);
