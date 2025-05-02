import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type { FS_OriginYoutube, FS_User } from "@eventory/shared-types/firestore";

/**
 * Redux serialized 때문에 createdAt을 number type으로 변환해서 flat하게 만듦
 */
export type AppUser = Omit<FS_User, "createdAt"> & { createdAt: number };

interface UserState {
  currentUser: AppUser | null;
  youtubeInfo: FS_OriginYoutube | null;
  loading: boolean;
}

const initialState: UserState = {
  currentUser: null,
  youtubeInfo: null,
  loading: false,
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AppUser | null>) {
      state.currentUser = action.payload;
    },
    setYoutubeInfo(state, action: PayloadAction<FS_OriginYoutube | null>) {
      state.youtubeInfo =  action.payload;
    }
  }
});


export const { setUser, setYoutubeInfo } = userSlice.actions;
export const selectUser = (state: RootState) => state.user.currentUser;
export const selectYoutubeInfo = (state: RootState) => state.user.youtubeInfo;
export const selectUserLoading = (state: RootState) => state.user.loading;
export default userSlice.reducer;
