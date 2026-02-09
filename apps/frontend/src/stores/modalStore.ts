import { create } from 'zustand'

export type ModalType = 'txSuccess' | null

export interface ModalPayload {
  title?: string
  message?: string
}

interface ModalState {
  current: ModalType
  payload?: ModalPayload
  open: (type: ModalType, payload?: ModalPayload) => void
  close: () => void
}

export const useModalStore = create<ModalState>((set) => ({
  current: null,
  payload: undefined,
  open: (type, payload) => set({ current: type, payload }),
  close: () => set({ current: null, payload: undefined }),
}))
