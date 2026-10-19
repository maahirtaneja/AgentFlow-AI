import { Code2, MessageSquare, Moon, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Sparkles, Sun } from 'lucide-react'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTheme } from '../context/ThemeContext'
import { motion } from 'motion/react'
import { toggleArtifact, toggleSidebar } from '../redux/uiSlice'

function Nav() {
  const dispatch = useDispatch()
  const { selectedConversation } = useSelector(state => state.conversation)
  const { messages, artifacts } = useSelector(state => state.message)
  const { sidebarCollapsed, artifactCollapsed, artifactMode } = useSelector(state => state.ui)
  const { isDark, toggleTheme } = useTheme()

  const hasArtifacts = artifacts && artifacts.length > 0

  return (
    <header className='h-14 flex items-center justify-between px-4 sm:px-5 border-b border-[#D1D1D1] dark:border-white/[0.08] bg-[#FAFAFA]/85 dark:bg-[#1E1E1E]/85 backdrop-blur-xl z-20 transition-colors duration-200 select-none'>
      <div className='flex items-center gap-2 sm:gap-2.5 min-w-0'>
        {/* Sidebar Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => dispatch(toggleSidebar())}
          className='hidden lg:flex items-center justify-center w-8 h-8 rounded-xl bg-white dark:bg-[#282828] hover:bg-[#F0F0F0] dark:hover:bg-[#323232] border border-[#D1D1D1] dark:border-white/10 text-[#929292] hover:text-[#222222] dark:hover:text-[#FAFAFA] transition-colors cursor-pointer shadow-2xs mr-1'
          title={sidebarCollapsed ? "Expand sidebar" : "Contract / Collapse sidebar"}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </motion.button>

        {selectedConversation ? (
          <>
            <div className='flex items-center justify-center w-7 h-7 rounded-lg bg-[#222222]/5 dark:bg-white/10 border border-[#D1D1D1] dark:border-white/15 text-[#222222] dark:text-[#FAFAFA] shrink-0'>
              <MessageSquare size={13} />
            </div>
            <div className='text-[13.5px] font-semibold text-[#222222] dark:text-[#FAFAFA] tracking-tight truncate max-w-[160px] sm:max-w-xs md:max-w-md'>
              {selectedConversation?.title || "New Chat"}
            </div>
            <div className='hidden sm:flex text-[10px] font-mono font-medium text-[#929292] bg-white dark:bg-white/[0.05] border border-[#D1D1D1] dark:border-white/10 px-2 py-0.5 rounded-full shrink-0'>
              {messages?.length || 0} msgs
            </div>
          </>
        ) : (
          <div className='flex items-center gap-2 text-[#929292] text-xs font-medium'>
            <Sparkles size={13} className="text-[#222222] dark:text-[#FAFAFA]" />
            <span>AgentFlow AI Workspace</span>
          </div>
        )}
      </div>

      <div className='flex items-center gap-2'>
        {/* Artifact Toggle / Expand Button (when artifacts are present) */}
        {hasArtifacts && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => dispatch(toggleArtifact())}
            aria-label="Toggle Artifact Panel"
            className='hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-[#282828] hover:bg-[#F0F0F0] dark:hover:bg-[#323232] border border-[#D1D1D1] dark:border-white/15 text-[#222222] dark:text-[#FAFAFA] transition-colors duration-150 cursor-pointer shadow-xs'
            title={artifactCollapsed ? "Expand Artifact Bar" : "Contract / Collapse Artifact Bar"}
          >
            <Code2 size={13} className="text-[#222222] dark:text-[#FAFAFA]" />
            <span className="text-[11px] font-medium">
              Artifact {artifactCollapsed ? "Closed" : "Open"}
            </span>
            {artifactCollapsed ? <PanelRightOpen size={12} /> : <PanelRightClose size={12} />}
          </motion.button>
        )}

        {/* Sleek Theme Toggle Pill Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className='flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-[#282828] hover:bg-[#F0F0F0] dark:hover:bg-[#323232] border border-[#D1D1D1] dark:border-white/15 text-[#222222] dark:text-[#FAFAFA] transition-colors duration-150 cursor-pointer shadow-xs'
        >
          {isDark ? (
            <>
              <Sun size={13} className="text-[#FAFAFA]" />
              <span className="text-[11px] font-medium">Light</span>
            </>
          ) : (
            <>
              <Moon size={13} className="text-[#222222]" />
              <span className="text-[11px] font-medium">Dark</span>
            </>
          )}
        </motion.button>
      </div>
    </header>
  )
}

export default Nav

