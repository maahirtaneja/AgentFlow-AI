import React, { useState, useEffect, useRef } from 'react'
import {
  Coins,
  MoreHorizontal,
  LogOut,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  User,
  X,
  Trash2
} from "lucide-react"
import { getConversations } from '../features/getConversations'
import { useDispatch, useSelector } from 'react-redux'
import { removeConversation, setConversations, setSelectedConversation } from '../redux/conversationSlice'
import { setSidebarSize, toggleSidebar } from '../redux/uiSlice'
import logOut from '../features/logOut'
import { setUserdata } from '../redux/userSlice'
import BillingDrawer from './BillingDrawer'
import { AnimatePresence, motion } from 'motion/react'
import { deleteConversation as deleteConversationRequest } from '../features/deleteConversation'
import { setArtifacts, setMessages } from '../redux/messageSlice'
import { signOut } from 'firebase/auth'
import { auth } from '../../utils/firebase'
import { updateProfile as updateProfileRequest } from '../features/updateProfile'

function SideBar() {
  const dispatch = useDispatch()
  const [imageError, setImageError] = useState(false)
  const { conversations, selectedConversation } = useSelector(state => state.conversation)
  const { userData } = useSelector(state => state.user)
  const { sidebarCollapsed, sidebarSize, artifactSize } = useSelector(state => state.ui)
  const [showBilling, setShowBilling] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [profileFirstName, setProfileFirstName] = useState('')
  const [profileLastName, setProfileLastName] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [isResizing, setIsResizing] = useState(false)
  const resizeStart = useRef(null)

  useEffect(() => {
    const getConv = async () => {
      const data = await getConversations()
      dispatch(setConversations(data))
    }
    getConv()
  }, [userData?._id, dispatch])

  const handleNewChat = () => {
    dispatch(setSelectedConversation(null))
    dispatch(setMessages([]))
    dispatch(setArtifacts([]))
    setMobileOpen(false)
  }

  const handleDeleteConversation = async (conversation) => {
    const confirmed = window.confirm(`Delete “${conversation?.title || 'New Chat'}”? This also removes its messages.`)
    if (!confirmed) return

    try {
      await deleteConversationRequest(conversation._id)
      dispatch(removeConversation(conversation._id))
      if (selectedConversation?._id === conversation._id) {
        dispatch(setMessages([]))
        dispatch(setArtifacts([]))
      }
      setOpenMenuId(null)
    } catch (error) {
      console.error('Unable to delete conversation:', error)
      window.alert('Could not delete this conversation. Please try again.')
    }
  }

  const openEditProfile = () => {
    const nameParts = (userData?.name || '').trim().split(/\s+/)
    setProfileFirstName(userData?.firstName || nameParts.shift() || '')
    setProfileLastName(userData?.lastName || nameParts.join(' '))
    setProfileMenuOpen(false)
    setShowEditProfile(true)
  }

  const handleSaveProfile = async (event) => {
    event.preventDefault()
    setProfileSaving(true)
    try {
      const updatedUser = await updateProfileRequest({ firstName: profileFirstName, lastName: profileLastName })
      dispatch(setUserdata(updatedUser))
      setImageError(false)
      setShowEditProfile(false)
    } catch (error) {
      window.alert(error.response?.data?.message || 'Could not update your profile. Please try again.')
    } finally {
      setProfileSaving(false)
    }
  }

  const handleLogout = async () => {
    await logOut()
    await signOut(auth).catch(() => {})
    dispatch(setUserdata(null))
    dispatch(setConversations([]))
    dispatch(setSelectedConversation(null))
    dispatch(setMessages([]))
    dispatch(setArtifacts([]))
    setProfileMenuOpen(false)
    setShowEditProfile(false)
    setMobileOpen(false)
  }

  const renderProfileMenu = (positionClass) => (
    <AnimatePresence>
      {profileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98 }}
          transition={{ duration: 0.14 }}
          className={`absolute ${positionClass} z-50 min-w-40 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-1 shadow-xl`}
        >
          <button
            type="button"
            onClick={openEditProfile}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10"
          >
            <User size={14} /> Edit profile
          </button>
          <button
            type="button"
            onClick={() => { setProfileMenuOpen(false); setShowBilling(true) }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Coins size={14} /> Increase credits
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10"
          >
            <LogOut size={14} /> Log out
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )

  const sidebarWidth = sidebarCollapsed ? 68 : sidebarSize

  const startSidebarResize = (event) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    resizeStart.current = { x: event.clientX, width: sidebarWidth }
    setIsResizing(true)
  }

  const resizeSidebar = (event) => {
    if (!resizeStart.current) return
    const availableWidth = window.innerWidth - artifactSize - 260
    const maximumWidth = Math.max(220, Math.min(440, availableWidth))
    const nextWidth = resizeStart.current.width + event.clientX - resizeStart.current.x
    dispatch(setSidebarSize(Math.min(maximumWidth, nextWidth)))
  }

  const stopSidebarResize = () => {
    resizeStart.current = null
    setIsResizing(false)
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className='lg:hidden fixed top-3 left-4 z-40 flex items-center justify-center w-8 h-8 rounded-xl bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-xl border border-[#D1D1D1] dark:border-white/10 text-[#929292] hover:text-[#222222] dark:hover:text-[#FAFAFA] shadow-xs cursor-pointer'
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={15} />
      </button>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileOpen(false)}
            className='lg:hidden fixed inset-0 z-40 bg-black/40 dark:bg-black/75 backdrop-blur-xs'
          />
        )}
      </AnimatePresence>

      {/* Desktop Animated Sidebar */}
      <motion.aside
        animate={{ width: sidebarWidth }}
        transition={isResizing ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 30 }}
        className={`hidden lg:flex relative flex-col justify-between h-screen shrink-0 bg-[#F5F5F5] dark:bg-[#1A1A1A] border-r border-[#D1D1D1] dark:border-white/[0.08] shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[8px_0_30px_rgba(0,0,0,0.4)] z-30 select-none overflow-hidden ${isResizing ? 'cursor-col-resize' : ''}`}
      >
        <div className='flex flex-col h-full min-h-0'>
          {/* Header */}
          <div className={`flex items-center h-14 border-b border-[#D1D1D1] dark:border-white/[0.08] shrink-0 px-3.5 ${sidebarCollapsed ? 'justify-center' : 'justify-between gap-2'}`}>
            {sidebarCollapsed ? (
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className='flex items-center justify-center w-9 h-9 rounded-xl text-[#929292] hover:text-[#222222] dark:hover:text-[#FAFAFA] hover:bg-[#EAEAEA] dark:hover:bg-white/[0.06] transition-colors cursor-pointer border-none bg-transparent'
                onClick={() => dispatch(toggleSidebar())}
                title="Expand sidebar"
              >
                <PanelLeftOpen size={17} />
              </motion.button>
            ) : (
              <>
                <div className='flex items-center gap-2 min-w-0'>
                  <div className='w-6 h-6 rounded-lg bg-[#222222] dark:bg-[#FAFAFA] flex items-center justify-center text-[#FAFAFA] dark:text-[#222222] text-[11px] font-bold shadow-xs shrink-0'>
                    AF
                  </div>
                  <span className='text-[13.5px] font-semibold text-[#222222] dark:text-[#FAFAFA] tracking-tight truncate'>
                    AgentFlow AI
                  </span>
                </div>

                <div className='flex items-center gap-1 shrink-0'>
                  {/* Collapse sidebar button */}
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    className='flex items-center justify-center w-7 h-7 rounded-lg text-[#929292] hover:text-[#222222] dark:hover:text-[#FAFAFA] hover:bg-[#EAEAEA] dark:hover:bg-white/[0.06] transition-colors cursor-pointer border-none bg-transparent'
                    onClick={() => dispatch(toggleSidebar())}
                    title="Contract / Collapse sidebar"
                  >
                    <PanelLeftClose size={15} />
                  </motion.button>
                </div>
              </>
            )}
          </div>

          {/* New Chat Button */}
          <div className={`p-3 shrink-0 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
            {sidebarCollapsed ? (
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className='flex items-center justify-center w-10 h-10 rounded-xl bg-[#222222] text-[#FAFAFA] hover:bg-[#333333] dark:bg-[#FAFAFA] dark:text-[#222222] dark:hover:bg-white/90 cursor-pointer shadow-xs border-none'
                onClick={handleNewChat}
                title="New Chat"
              >
                <Plus size={16} />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className='w-full flex items-center justify-center gap-2 text-xs font-semibold text-[#FAFAFA] bg-[#222222] hover:bg-[#333333] dark:bg-[#FAFAFA] dark:text-[#222222] dark:hover:bg-white/90 rounded-xl py-2.5 cursor-pointer shadow-xs transition-colors border-none'
                onClick={handleNewChat}
              >
                <Plus size={15} />
                <span>New Chat</span>
              </motion.button>
            )}
          </div>

          {/* Recents header */}
          {!sidebarCollapsed && (
            <div className='px-4 pt-2 pb-1 text-[10.5px] font-mono uppercase tracking-wider text-[#929292] shrink-0 flex items-center justify-between'>
              <span>{conversations?.length === 0 ? "No Conversations" : "Recent Chats"}</span>
              <span className='text-[10px] text-[#929292] font-normal'>({conversations?.length || 0})</span>
            </div>
          )}

          {/* Conversation List */}
          <div className='flex-1 overflow-y-auto px-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden space-y-1 min-h-0 pt-1'>
            {conversations?.map((conv, i) => {
              const isActive = selectedConversation?._id === conv?._id
              return (
                <div
                  key={conv?._id || i}
                  className={`relative group ${sidebarCollapsed ? 'w-10 mx-auto' : 'w-full'}`}
                  onContextMenu={(event) => { event.preventDefault(); setOpenMenuId(conv._id) }}
                >
                  <motion.button
                    whileHover={{ x: sidebarCollapsed ? 0 : 2 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => { dispatch(setSelectedConversation(conv)); setOpenMenuId(null) }}
                    className={`w-full flex items-center rounded-xl border transition-all duration-150 cursor-pointer ${
                      sidebarCollapsed
                        ? 'justify-center h-10'
                        : 'gap-2.5 px-3 py-2 pr-9 text-left'
                    } ${
                      isActive
                        ? "bg-white dark:bg-[#262626] border-[#D1D1D1] dark:border-white/20 text-[#222222] dark:text-[#FAFAFA] font-semibold shadow-xs"
                        : "border-transparent text-[#929292] hover:text-[#222222] dark:hover:text-[#FAFAFA] hover:bg-[#EAEAEA] dark:hover:bg-white/[0.04]"
                    }`}
                    title={conv?.title || "New Chat"}
                  >
                    <div className={`flex items-center justify-center shrink-0 w-5 h-5 rounded-md ${
                      isActive ? "text-[#222222] dark:text-[#FAFAFA]" : "text-[#929292]"
                    }`}>
                      <MessageSquare size={14} />
                    </div>
                    {!sidebarCollapsed && (
                      <span className='text-[12.5px] truncate flex-1'>
                        {conv?.title || "New Chat"}
                      </span>
                    )}
                  </motion.button>
                  <button
                    type="button"
                    aria-label={`Conversation options for ${conv?.title || 'New Chat'}`}
                    aria-expanded={openMenuId === conv._id}
                    onClick={(event) => { event.stopPropagation(); setOpenMenuId(openMenuId === conv._id ? null : conv._id) }}
                    className={`absolute ${sidebarCollapsed ? 'top-1 right-0' : 'right-1 top-1/2 -translate-y-1/2'} z-10 flex h-7 w-7 items-center justify-center rounded-lg text-[#858580] hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/10 bg-[var(--bg-sidebar)]/90 border border-transparent ${openMenuId === conv._id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'}`}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  <AnimatePresence>
                    {openMenuId === conv._id && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.14 }}
                        className={`absolute ${sidebarCollapsed ? 'left-11 top-0' : 'right-0 top-[calc(100%+4px)]'} z-30 min-w-40 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-1 shadow-xl`}
                      >
                        <button
                          type="button"
                          onClick={() => handleDeleteConversation(conv)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                        >
                          <Trash2 size={14} /> Delete conversation
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>

          {/* Bottom Profile & Footer */}
          <div className='border-t border-[#D1D1D1] dark:border-white/[0.08] shrink-0 pt-2 bg-[#F5F5F5] dark:bg-[#1A1A1A]'>
            <div className={`px-2 pb-2 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
              {userData ? (
                sidebarCollapsed ? (
                  <div className='relative flex flex-col items-center gap-1'>
                    <div
                      className='w-10 h-10 rounded-xl bg-white dark:bg-[#222222] border border-[#D1D1D1] dark:border-white/10 flex items-center justify-center shadow-xs p-0 overflow-hidden'
                      title={`${userData?.name || "User"} (${userData?.credits ?? 0} credits)`}
                    >
                      {userData?.avatar && !imageError ? (
                        <img
                          className='w-full h-full object-cover'
                          src={userData?.avatar}
                          alt="User"
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <User size={15} className="text-[#929292]" />
                      )}
                    </div>
                    <button
                      onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                      className='p-1.5 rounded-lg text-[#929292] hover:text-[#222222] dark:hover:text-[#FAFAFA] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer border-none bg-transparent'
                      title="Profile options"
                      aria-label="Profile options"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {renderProfileMenu('left-12 bottom-0')}
                  </div>
                ) : (
                  <div className='flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-[#222222] border border-[#D1D1D1] dark:border-white/[0.08] shadow-xs'>
                    <div className='shrink-0'>
                      {userData?.avatar && !imageError ? (
                        <img
                          className='w-8 h-8 rounded-lg object-cover ring-1 ring-[#D1D1D1] dark:ring-white/[0.1]'
                          src={userData?.avatar}
                          alt="User"
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <div className='w-8 h-8 rounded-lg bg-[#EAEAEA] dark:bg-white/[0.06] flex items-center justify-center text-[#929292]'>
                          <User size={14} />
                        </div>
                      )}
                    </div>

                    <div className='flex-1 min-w-0'>
                      <p className='text-[12.5px] font-semibold text-[#222222] dark:text-[#FAFAFA] truncate'>
                        {userData?.name || "User"}
                      </p>
                      <p className='text-[10.5px] font-mono text-[#929292] truncate'>
                        {userData?.credits ?? 0} credits
                      </p>
                    </div>

                    <div className='relative'>
                      <button
                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                        className='p-1.5 rounded-lg text-[#929292] hover:text-[#222222] dark:hover:text-[#FAFAFA] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer border-none bg-transparent'
                        title="Profile options"
                        aria-label="Profile options"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      {renderProfileMenu('right-0 bottom-[calc(100%+8px)]')}
                    </div>
                  </div>
                )
              ) : null}
            </div>

            {/* Developer signature */}
            {!sidebarCollapsed && (
              <div className='px-4 pb-3 text-center'>
                <a
                  href="https://www.linkedin.com/in/maahirtaneja/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className='text-[9.5px] font-mono text-[#929292] hover:text-[#222222] dark:hover:text-[#FAFAFA] transition-colors duration-150 select-none inline-block cursor-pointer tracking-wider'
                >
                  &lt;developed by Maahir Taneja /&gt;
                </a>
              </div>
            )}
          </div>
        </div>
        {!sidebarCollapsed && (
          <div
            role="separator"
            aria-label="Resize sidebar"
            aria-orientation="vertical"
            aria-valuemin={220}
            aria-valuemax={440}
            aria-valuenow={sidebarSize}
            onPointerDown={startSidebarResize}
            onPointerMove={resizeSidebar}
            onPointerUp={stopSidebarResize}
            onPointerCancel={stopSidebarResize}
            className="absolute inset-y-0 right-0 z-40 w-1.5 cursor-col-resize touch-none hover:bg-black/10 dark:hover:bg-white/10 active:bg-black/15 dark:active:bg-white/15"
            title="Drag to resize sidebar"
          />
        )}
      </motion.aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] h-screen bg-[#F5F5F5] dark:bg-[#1A1A1A] border-r border-[#D1D1D1] dark:border-white/[0.08] shadow-2xl flex flex-col justify-between"
          >
            <div className='flex flex-col h-full min-h-0'>
              <div className='flex items-center justify-between px-4 h-14 border-b border-[#D1D1D1] dark:border-white/[0.08] shrink-0'>
                <div className='flex items-center gap-2'>
                  <div className='w-6 h-6 rounded-lg bg-[#222222] dark:bg-[#FAFAFA] flex items-center justify-center text-[#FAFAFA] dark:text-[#222222] text-[11px] font-bold'>
                    AF
                  </div>
                  <span className='text-[14px] font-semibold text-[#222222] dark:text-[#FAFAFA]'>AgentFlow AI</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-[#929292] hover:text-[#222222] dark:hover:text-[#FAFAFA] cursor-pointer border-none bg-transparent"
                >
                  <X size={16} />
                </button>
              </div>

              <div className='p-3.5 pb-2 shrink-0'>
                <button
                  className='w-full flex items-center justify-center gap-2 text-xs font-semibold text-[#FAFAFA] bg-[#222222] dark:bg-[#FAFAFA] dark:text-[#222222] rounded-xl py-2.5 cursor-pointer border-none shadow-xs'
                  onClick={handleNewChat}
                >
                  <Plus size={15} />
                  <span>New Chat</span>
                </button>
              </div>

              <div className='flex-1 overflow-y-auto px-2.5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden space-y-1 min-h-0'>
                {conversations?.map((conv, i) => (
                  <div
                    key={conv?._id || i}
                    className="relative group"
                    onContextMenu={(event) => { event.preventDefault(); setOpenMenuId(conv._id) }}
                  >
                    <button
                      onClick={() => {
                        dispatch(setSelectedConversation(conv))
                        setOpenMenuId(null)
                        setMobileOpen(false)
                      }}
                      className='w-full flex items-center gap-2.5 px-3 py-2 pr-10 rounded-xl text-left border border-transparent text-[#929292] hover:text-[#222222] dark:hover:text-[#FAFAFA] hover:bg-[#EAEAEA] dark:hover:bg-white/[0.04]'
                    >
                      <MessageSquare size={13} />
                      <span className='text-[12.5px] truncate flex-1'>{conv?.title || "New Chat"}</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Conversation options for ${conv?.title || 'New Chat'}`}
                      aria-expanded={openMenuId === conv._id}
                      onClick={(event) => { event.stopPropagation(); setOpenMenuId(openMenuId === conv._id ? null : conv._id) }}
                      className={`absolute right-1 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-[#858580] hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/10 ${openMenuId === conv._id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'}`}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    <AnimatePresence>
                      {openMenuId === conv._id && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{ duration: 0.14 }}
                          className="absolute right-0 top-[calc(100%+4px)] z-30 min-w-40 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-1 shadow-xl"
                        >
                          <button
                            type="button"
                            onClick={() => handleDeleteConversation(conv)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                          >
                            <Trash2 size={14} /> Delete conversation
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              <div className='relative border-t border-[#D1D1D1] dark:border-white/[0.08] p-3 text-center'>
                {userData && (
                  <div className="mb-2 flex justify-center">
                    <button
                      onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                      className='inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-[#929292] hover:bg-black/5 dark:hover:bg-white/10'
                      aria-label="Profile options"
                      title="Profile options"
                    >
                      <MoreHorizontal size={15} /> Profile options
                    </button>
                    {renderProfileMenu('right-3 bottom-[calc(100%+4px)]')}
                  </div>
                )}
                <a
                  href="https://www.linkedin.com/in/maahirtaneja/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className='text-[9.5px] font-mono text-[#929292]'
                >
                  &lt;developed by Maahir Taneja /&gt;
                </a>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setShowEditProfile(false)
            }}
          >
            <motion.section
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.99 }}
              transition={{ duration: 0.18 }}
              aria-labelledby="edit-profile-title"
              className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl"
            >
              <form onSubmit={handleSaveProfile}>
                <div className="flex items-start justify-between border-b border-[var(--border-color)] px-5 py-4">
                  <div>
                    <h2 id="edit-profile-title" className="text-base font-semibold text-[var(--text-primary)]">Edit profile</h2>
                    <p className="mt-1 text-xs text-[#929292]">Update your name. Your account email cannot be changed.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEditProfile(false)}
                    className="rounded-lg p-1.5 text-[#929292] hover:bg-black/5 dark:hover:bg-white/10"
                    aria-label="Close profile editor"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4 px-5 py-5">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[var(--text-primary)]">First name</span>
                    <input
                      value={profileFirstName}
                      onChange={(event) => setProfileFirstName(event.target.value)}
                      maxLength={80}
                      required
                      className="w-full rounded-xl border border-[var(--border-color)] bg-transparent px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[#858580]"
                      placeholder="First name"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[var(--text-primary)]">Last name</span>
                    <input
                      value={profileLastName}
                      onChange={(event) => setProfileLastName(event.target.value)}
                      maxLength={80}
                      className="w-full rounded-xl border border-[var(--border-color)] bg-transparent px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[#858580]"
                      placeholder="Last name"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[var(--text-primary)]">Email</span>
                    <input
                      type="email"
                      value={userData?.email || ''}
                      readOnly
                      aria-readonly="true"
                      className="w-full cursor-not-allowed rounded-xl border border-[var(--border-color)] bg-black/[0.03] px-3 py-2.5 text-sm text-[#929292] outline-none dark:bg-white/[0.03]"
                    />
                  </label>
                </div>

                <div className="flex justify-end gap-2 px-5 pb-5">
                  <button
                    type="button"
                    onClick={() => setShowEditProfile(false)}
                    className="rounded-xl border border-[var(--border-color)] px-3.5 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="rounded-xl bg-[#222222] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#333333] disabled:opacity-60 dark:bg-white dark:text-[#222222] dark:hover:bg-white/90"
                  >
                    {profileSaving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>

              </form>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <BillingDrawer
        open={showBilling}
        onClose={() => setShowBilling(false)}
      />
    </>
  )
}

export default SideBar
