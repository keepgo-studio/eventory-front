'use client'

import { useEffect, useRef } from 'react'
import { Provider } from 'react-redux'
import { makeStore, type AppStore } from './store'
import { onAuthStateChanged } from '../firebase/web-api'
import { setUser, setYoutubeInfo } from './user/user-store'
import { getUser } from '../api/firestore/user'
import type { FB_Uid } from '@eventory/shared-types/firebase'
import type { Timestamp } from 'firebase/firestore'
import { IS_DEV } from '../vars'
import { devLog } from '../web-utils'
import { getOriginYoutube } from '../api/firestore/origin'

export default function StoreProvider({
  isLoggedIn,
  children
}: {
  isLoggedIn?: boolean;
  children: React.ReactNode
}) {
  const storeRef = useRef<AppStore | null>(null);
  
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (user) => {
      if (!isLoggedIn || !user) {
        storeRef.current?.dispatch(setUser(null));
        return;
      }

      getUser(user.uid as FB_Uid).then(data => {
        if (!data) {
          // bad status
          return;
        }

        storeRef.current?.dispatch(setUser({ 
          ...data,
          createdAt: (data.createdAt as Timestamp).toMillis()
        }));

        if (IS_DEV) {
          devLog("INFO", "Firestore", "app user updated");
        }
      });

      getOriginYoutube(user.uid as FB_Uid).then(data => {
        if (!data) {
          // bad functions status
          return;
        }

        storeRef.current?.dispatch(setYoutubeInfo(data));

        if (IS_DEV) {
          devLog("INFO", "Firestore", "youtube info updated");
        }
      })
    })

    return () => unsubscribe();
  }, []);

  return <Provider store={storeRef.current}>{children}</Provider>
}