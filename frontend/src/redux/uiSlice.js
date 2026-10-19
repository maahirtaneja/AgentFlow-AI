import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  sidebarCollapsed: false,
  sidebarSize: 275,
  artifactCollapsed: false,
  artifactSize: 460,
  promptRequest: null,
  promptRequestId: 0,
  artifactMode: 'standard', // 'standard' (440px) | 'wide' (680px) | 'full' (85vw)
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload
    },
    setSidebarSize: (state, action) => {
      state.sidebarSize = Math.max(220, Math.min(440, action.payload))
    },
    setArtifactSize: (state, action) => {
      state.artifactSize = Math.max(340, Math.min(820, action.payload))
    },
    submitSuggestedPrompt: (state, action) => {
      state.promptRequestId += 1
      state.promptRequest = { id: state.promptRequestId, text: action.payload }
    },
    clearSuggestedPrompt: (state) => {
      state.promptRequest = null
    },
    toggleArtifact: (state) => {
      state.artifactCollapsed = !state.artifactCollapsed
    },
    setArtifactCollapsed: (state, action) => {
      state.artifactCollapsed = action.payload
    },
    setArtifactMode: (state, action) => {
      state.artifactMode = action.payload
      state.artifactCollapsed = false
    },
    cycleArtifactMode: (state) => {
      if (state.artifactCollapsed) {
        state.artifactCollapsed = false
        state.artifactMode = 'standard'
      } else if (state.artifactMode === 'standard') {
        state.artifactMode = 'wide'
      } else if (state.artifactMode === 'wide') {
        state.artifactMode = 'full'
      } else {
        state.artifactMode = 'standard'
      }
    }
  }
})

export const {
  toggleSidebar,
  setSidebarCollapsed,
  setSidebarSize,
  setArtifactSize,
  submitSuggestedPrompt,
  clearSuggestedPrompt,
  toggleArtifact,
  setArtifactCollapsed,
  setArtifactMode,
  cycleArtifactMode,
} = uiSlice.actions

export default uiSlice.reducer
