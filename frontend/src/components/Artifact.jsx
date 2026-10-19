import {
  Check,
  Code2,
  Copy,
  Eye,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
  X
} from 'lucide-react'
import React, { useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AnimatePresence, motion } from "motion/react"
import Editor from '@monaco-editor/react';
import { useTheme } from '../context/ThemeContext';
import { cycleArtifactMode, setArtifactMode, setArtifactSize, toggleArtifact } from '../redux/uiSlice';
import { setArtifacts } from '../redux/messageSlice';

function Artifact() {
  const dispatch = useDispatch()
  const { artifacts } = useSelector(state => state.message)
  const { artifactCollapsed, artifactMode, artifactSize } = useSelector(state => state.ui)
  const { isDark } = useTheme()
  const [tab, setTab] = useState("code")
  const [activeFile, setActiveFile] = useState(0)
  const [copied, setCopied] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const resizeStart = useRef(null)

  if (!artifacts || artifacts.length === 0) return null;

  const currentArtifact = artifacts[0]
  const file = currentArtifact?.files?.[activeFile] || currentArtifact?.files?.[0]
  const htmlFile = currentArtifact?.files?.find(f => f.name === "index.html")
  const cssFile = currentArtifact?.files?.find(f => f.name === "style.css")
  const jsFile = currentArtifact?.files?.find(f => f.name === "script.js")

  const canPreview = Boolean(htmlFile)

  const previewDoc = `
  <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
     ${cssFile?.content || ""}
    </style>
</head>
<body>
 ${htmlFile?.content || ""} 
<script>
    ${jsFile?.content || ""}
</script>    
</body>
</html>`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(file?.content || "")
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  const detectLanguage = (fileName = "") => {
    const name = fileName.toLowerCase()
    if (name.endsWith(".html")) return "html";
    if (name.endsWith(".css")) return "css";
    if (name.endsWith(".js") || name.endsWith(".jsx")) return "javascript";
    if (name.endsWith(".ts") || name.endsWith(".tsx")) return "typescript";
    if (name.endsWith(".json")) return "json";
    if (name.endsWith(".py")) return "python";
    if (name.endsWith(".java")) return "java";
    if (name.endsWith(".cpp") || name.endsWith(".c")) return "cpp";
    return "plaintext";
  }

  const targetWidth = artifactCollapsed
    ? 52
    : artifactMode === 'full'
    ? 'calc(100vw - 80px)'
    : artifactMode === 'wide'
    ? 680
    : artifactSize

  const startArtifactResize = (event) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    const currentWidth = typeof targetWidth === 'number' ? targetWidth : window.innerWidth - 80
    resizeStart.current = { x: event.clientX, width: currentWidth }
    dispatch(setArtifactSize(currentWidth))
    dispatch(setArtifactMode('standard'))
    setIsResizing(true)
  }

  const resizeArtifact = (event) => {
    if (!resizeStart.current) return
    const availableWidth = window.innerWidth - 320 - 260
    const maximumWidth = Math.max(340, Math.min(820, availableWidth))
    const nextWidth = resizeStart.current.width - (event.clientX - resizeStart.current.x)
    dispatch(setArtifactSize(Math.min(maximumWidth, nextWidth)))
  }

  const stopArtifactResize = () => {
    resizeStart.current = null
    setIsResizing(false)
  }

  const PanelContent = ({ onClose }) => {
    return (
      <div className='flex flex-col h-full bg-[#FFFFFF] dark:bg-[#1E1E1E] text-[#222222] dark:text-[#FAFAFA] select-none'>
        {/* Header */}
        <div className='h-14 px-4 border-b border-[#D1D1D1] dark:border-white/[0.08] flex items-center justify-between gap-3 shrink-0'>
          <div className='flex items-center gap-2.5 min-w-0 flex-1'>
            <button
              className='flex items-center justify-center w-7 h-7 rounded-lg text-[#929292] hover:text-[#222222] dark:hover:text-[#FAFAFA] hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150 bg-transparent border-none cursor-pointer shrink-0'
              onClick={onClose ?? (() => dispatch(toggleArtifact()))}
              title={onClose ? "Close panel" : "Contract / Collapse artifact bar"}
            >
              {onClose ? <X size={15} /> : <PanelRightClose size={16} />}
            </button>

            <div className='flex items-center gap-2 min-w-0'>
              <div className='flex items-center justify-center w-6 h-6 rounded-md bg-[#222222]/5 dark:bg-white/10 border border-[#D1D1D1] dark:border-white/15 shrink-0'>
                <Code2 className="text-[#222222] dark:text-[#FAFAFA]" size={12} />
              </div>
              <span className='text-[13px] font-semibold text-[#222222] dark:text-[#FAFAFA] truncate'>
                {currentArtifact?.title || "Artifact"}
              </span>
            </div>
          </div>

          {/* Action controls */}
          <div className='flex items-center gap-1.5 shrink-0'>
            {/* Copy button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopy}
              className='flex items-center gap-1 px-2 py-1.5 text-xs text-[#929292] hover:text-[#222222] dark:hover:text-[#FAFAFA] hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors border-none bg-transparent cursor-pointer'
              title="Copy code"
            >
              {copied ? <Check size={14} className="text-[#222222] dark:text-[#FAFAFA]" /> : <Copy size={14} />}
            </motion.button>

            {/* Expand / Wide / Standard cycle button */}
            {!onClose && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => dispatch(cycleArtifactMode())}
                className='flex items-center justify-center w-7 h-7 rounded-lg text-[#929292] hover:text-[#222222] dark:hover:text-[#FAFAFA] hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-none bg-transparent cursor-pointer'
                title={
                  artifactMode === 'standard'
                    ? "Expand to Wide mode (680px)"
                    : artifactMode === 'wide'
                    ? "Expand to Fullscreen mode"
                    : "Contract to Standard mode (460px)"
                }
              >
                {artifactMode === 'standard' ? (
                  <Maximize2 size={13} />
                ) : (
                  <Minimize2 size={13} />
                )}
              </motion.button>
            )}

            {/* Code / Preview tab selector */}
            {canPreview && (
              <div className='flex items-center gap-0.5 bg-[#F0F0F0] dark:bg-white/[0.04] border border-[#D1D1D1] dark:border-white/[0.06] p-0.5 rounded-xl'>
                <button
                  onClick={() => setTab("code")}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors border-none cursor-pointer ${
                    tab === "code"
                      ? "bg-[#222222] text-[#FAFAFA] dark:bg-[#FAFAFA] dark:text-[#222222]"
                      : "text-[#929292] hover:text-[#222222] dark:hover:text-[#FAFAFA] bg-transparent"
                  }`}
                >
                  <Code2 size={11} /> Code
                </button>
                <button
                  onClick={() => setTab("preview")}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors border-none cursor-pointer ${
                    tab === "preview"
                      ? "bg-[#222222] text-[#FAFAFA] dark:bg-[#FAFAFA] dark:text-[#222222]"
                      : "text-[#929292] hover:text-[#222222] dark:hover:text-[#FAFAFA] bg-transparent"
                  }`}
                >
                  <Eye size={11} /> Preview
                </button>
              </div>
            )}

            {/* Close artifact button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => dispatch(setArtifacts([]))}
              className='flex items-center justify-center w-7 h-7 rounded-lg text-[#929292] hover:text-rose-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-none bg-transparent cursor-pointer'
              title="Close artifact"
            >
              <X size={14} />
            </motion.button>
          </div>
        </div>

        {/* File Tabs */}
        {tab === "code" && (
          <div className='flex h-auto border-b border-[#D1D1D1] dark:border-white/[0.06] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0'>
            {currentArtifact?.files?.map((f, index) => (
              <button
                key={f?.name || index}
                onClick={() => setActiveFile(index)}
                className={`px-4 py-2 text-[11.5px] font-medium whitespace-nowrap transition-colors duration-150 border-r border-[#D1D1D1] dark:border-white/[0.05] relative cursor-pointer bg-transparent ${
                  activeFile === index
                    ? "text-[#222222] dark:text-[#FAFAFA] font-semibold"
                    : "text-[#929292] hover:text-[#222222] dark:hover:text-[#FAFAFA]"
                }`}
              >
                {f?.name}
                {activeFile === index && (
                  <motion.div
                    layoutId="activeFileTab"
                    className='absolute bottom-0 left-0 right-0 h-[2px] bg-[#222222] dark:bg-[#FAFAFA] rounded-t-full'
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Content Viewer */}
        <div className='flex-1 overflow-hidden select-text'>
          {tab === "preview" && canPreview ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className='w-full h-full'
            >
              <iframe
                title='preview'
                srcDoc={previewDoc}
                sandbox='allow-scripts'
                className='w-full h-full bg-white'
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className='w-full h-full'
            >
              <Editor
                theme={isDark ? 'vs-dark' : 'light'}
                language={detectLanguage(file?.name)}
                value={file?.content}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  wordWrap: "on",
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  padding: { top: 16 },
                  lineNumbers: "on",
                  renderLineHighlight: "none"
                }}
              />
            </motion.div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-24 right-4 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#222222] dark:bg-[#FAFAFA] text-[#FAFAFA] dark:text-[#222222] text-[12px] font-medium shadow-lg border-none cursor-pointer"
      >
        <Code2 size={13} />
        View Code
      </motion.button>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="lg:hidden fixed inset-y-0 right-0 z-50 w-[92vw] max-w-[460px] border-l border-[#D1D1D1] dark:border-white/[0.08] overflow-hidden"
            >
              <PanelContent onClose={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Animated Bar */}
      <motion.div
        animate={{ width: targetWidth }}
        transition={isResizing ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 30 }}
        className={`hidden lg:flex relative h-full border-l border-[#D1D1D1] dark:border-white/[0.08] flex-col overflow-hidden shrink-0 shadow-lg z-20 ${isResizing ? 'cursor-col-resize' : ''}`}
      >
        {artifactCollapsed ? (
          <div className='flex flex-col items-center justify-between h-full py-3.5 bg-[#F5F5F5] dark:bg-[#1A1A1A] w-[52px] cursor-pointer' onClick={() => dispatch(toggleArtifact())}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className='flex items-center justify-center w-8 h-8 rounded-lg text-[#929292] hover:text-[#222222] dark:hover:text-[#FAFAFA] hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-none bg-transparent cursor-pointer'
              title="Expand artifact bar"
            >
              <PanelRightOpen size={16} />
            </motion.button>

            <div className='flex items-center gap-2 flex-1 min-w-0 justify-center'>
              <div
                className='text-[10px] font-medium text-[#929292] hover:text-[#222222] dark:hover:text-[#FAFAFA] tracking-widest uppercase whitespace-nowrap'
                style={{
                  writingMode: "vertical-lr",
                  transform: "rotate(180deg)"
                }}
              >
                {currentArtifact?.title || "Artifact"}
              </div>
            </div>

            <div className='w-7 h-7 rounded-lg bg-[#222222]/5 dark:bg-white/10 flex items-center justify-center text-[#222222] dark:text-[#FAFAFA]'>
              <Code2 size={13} />
            </div>
          </div>
        ) : (
          <PanelContent />
        )}
        {!artifactCollapsed && (
          <div
            role="separator"
            aria-label="Resize artifact panel"
            aria-orientation="vertical"
            aria-valuemin={340}
            aria-valuemax={820}
            aria-valuenow={artifactSize}
            onPointerDown={startArtifactResize}
            onPointerMove={resizeArtifact}
            onPointerUp={stopArtifactResize}
            onPointerCancel={stopArtifactResize}
            className="absolute inset-y-0 left-0 z-40 w-1.5 cursor-col-resize touch-none hover:bg-black/10 dark:hover:bg-white/10 active:bg-black/15 dark:active:bg-white/15"
            title="Drag to resize artifact panel"
          />
        )}
      </motion.div>
    </>
  )
}

export default Artifact
