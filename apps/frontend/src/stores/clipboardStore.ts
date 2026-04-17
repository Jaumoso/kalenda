import { create } from 'zustand'

interface ClipboardState {
  /** Serialized Fabric.js object(s) JSON — persists across page navigations */
  objectJson: string | null
  copy: (json: string) => void
  clear: () => void
}

export const useClipboardStore = create<ClipboardState>()((set) => ({
  objectJson: null,
  copy: (json) => set({ objectJson: json }),
  clear: () => set({ objectJson: null }),
}))
