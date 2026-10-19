import { Code2, FileText, Globe, ImageIcon, MessageSquare, Mic, MicOff, Paperclip, Presentation, Send, X, Zap } from 'lucide-react'
import React, { useEffect, useState, useRef } from 'react'
import sendMessage from '../features/sendMessage'
import { useDispatch, useSelector } from 'react-redux'
import { addMessage, setArtifacts, setIsLoading, setMessages } from '../redux/messageSlice'
import { createConversation } from '../features/createConversation'
import { addConversation, setConvTitle, setSelectedConversation } from '../redux/conversationSlice'
import { updateConversation } from '../features/updateConversation'
import { motion, AnimatePresence } from 'motion/react'
import { clearSuggestedPrompt } from '../redux/uiSlice'


function ChatInput() {
  const [value, setValue] = useState("")
  const [selectedAgent, setSelectedAgent] = useState("Auto")
  const { selectedConversation } = useSelector(state => state.conversation)
  const { messages, isLoading } = useSelector(state => state.message)
  const { promptRequest } = useSelector(state => state.ui)
  const [selectedFile, setSelectedFile] = useState(null)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)
  const fileRef = useRef(null)
  const textareaRef = useRef(null)
  const handledPromptId = useRef(0)
  const dispatch = useDispatch()


  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let transcript = ""

      for (let index = event.resultIndex; index < event.results.length; index++) {

        transcript += event.results[index][0].transcript
      }
      setValue(transcript)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition
  }, [])

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("speech recognition not supported")
    }
    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
    } else {
      recognitionRef.current.start()
      setListening(true)
    }

  }








  const handleSendMessage = async (promptOverride) => {
    const trimmedVal = (promptOverride ?? value).trim()
    if (isLoading || (!trimmedVal && !selectedFile)) return

    dispatch(setIsLoading(true))
    let conversation = selectedConversation
    if (!conversation) {
      dispatch(setMessages([]))
      const conv = await createConversation()
      if (!conv || !conv._id) {
        dispatch(setIsLoading(false))
        return
      }
      dispatch(setSelectedConversation(conv))
      dispatch(addConversation(conv))
      conversation = conv
    }

    if (conversation.title === "New Chat") {
      const newTitle = (trimmedVal || selectedFile?.name || "New Chat").slice(0, 40)
      await updateConversation({ id: conversation?._id, title: newTitle })
      dispatch(setConvTitle({ conversationId: conversation?._id, title: newTitle }))
    }

    const formData = new FormData()
    formData.append("prompt", trimmedVal)
    formData.append("conversationId", conversation?._id)
    formData.append("agent", selectedAgent.toLowerCase() === "image" ? "vision" : selectedAgent.toLowerCase())
    if (selectedFile) {
      formData.append("file", selectedFile)
    }

    dispatch(addMessage({ role: "user", content: trimmedVal || `Attached: ${selectedFile?.name}` }))
    setValue("")
    setSelectedFile(null)
    if (fileRef.current) fileRef.current.value = ""

    try {
      const data = await sendMessage(formData)
      dispatch(setIsLoading(false))
      if (data) {
        dispatch(setArtifacts(data.artifacts || []))
        dispatch(addMessage({ role: "assistant", content: data.answer || "No response received.", images: data.images || [] }))
      } else {
        dispatch(addMessage({ role: "assistant", content: "Something went wrong. Please check your connection or server." }))
      }
    } catch (err) {
      dispatch(setIsLoading(false))
      dispatch(addMessage({ role: "assistant", content: "Failed to send message. Please try again." }))
    }
  }

  const sendMessageRef = useRef(handleSendMessage)
  sendMessageRef.current = handleSendMessage

  useEffect(() => {
    if (!promptRequest || handledPromptId.current === promptRequest.id) return

    handledPromptId.current = promptRequest.id
    dispatch(clearSuggestedPrompt())
    textareaRef.current?.focus()
    setValue(promptRequest.text)
    sendMessageRef.current(promptRequest.text)
  }, [promptRequest, dispatch])

  const agents = [
    {
      id: "auto",
      icon: Zap,
      label: "Auto"
    },

    {
      id: "chat",
      icon: MessageSquare,
      label: "Chat"
    },

    {
      id: "coding",
      icon: Code2,
      label: "Coding"
    },

    {
      id: "pdf",
      icon: FileText,
      label: "PDF"
    },

    {
      id: "ppt",
      icon: Presentation,
      label: "PPT"
    },

    {
      id: "vision",
      icon: ImageIcon,
      label: "Image"
    },

    {
      id: "search",
      icon: Globe,
      label: "Search"
    }

  ]

  return (
    <div className='w-full px-4 md:px-8 pb-5 pt-2 bg-gradient-to-t from-[#FAFAFA] via-[#FAFAFA]/90 to-transparent dark:from-[#1E1E1E] dark:via-[#1E1E1E]/90 dark:to-transparent shrink-0'>
      <div className='chat-composer max-w-3xl lg:max-w-4xl mx-auto glass-input rounded-3xl p-3 md:p-4 flex flex-col gap-2.5 border border-[#D1D1D1] dark:border-white/10'>

        {/* Agent pills */}
        <div className='flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
          {agents.map((agent) => {
            const isActive = selectedAgent === agent.label
            const Icon = agent.icon
            return (
              <motion.button
                key={agent.id}
                type="button"
                aria-label={agent.label}
                title={agent.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedAgent(agent.label)}
                className={`relative shrink-0 cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border-none ${
                  isActive
                    ? "bg-[#222222] text-[#FAFAFA] dark:bg-[#FAFAFA] dark:text-[#222222] shadow-xs"
                    : "glass-pill text-[#929292] hover:text-[#222222] dark:hover:text-[#FAFAFA] hover:bg-[#F0F0F0] dark:hover:bg-white/[0.08]"
                }`}
              >
                {isActive && <motion.span layoutId="active-agent-pill" transition={{ type: 'spring', stiffness: 520, damping: 38 }} className="absolute inset-0 z-0 rounded-full bg-[#222222] dark:bg-[#FAFAFA]" />}
                <Icon
                  size={13}
                  className={`relative z-10 ${
                    isActive
                      ? "text-[#FAFAFA] dark:text-[#222222]"
                      : "text-[#929292]"
                  }`}
                />
                <span className="relative z-10">{agent.label}</span>
              </motion.button>
            )
          })}
        </div>

        {/* Selected File Chip */}
        <AnimatePresence>
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 5 }}
              transition={{ duration: 0.2 }}
              className='flex items-center gap-2 rounded-2xl glass-pill px-3 py-1.5 w-fit border border-[#D1D1D1] dark:border-white/10'
            >
              {selectedFile?.type === "application/pdf" ? (
                <FileText size={16} className="text-rose-500" />
              ) : selectedFile.type.startsWith("image/") ? (
                <img src={URL.createObjectURL(selectedFile)} className="h-8 w-8 rounded-lg object-cover" />
              ) : (
                <FileText size={16} className="text-[#222222] dark:text-[#FAFAFA]" />
              )}
              <div className='leading-tight pr-1'>
                <p className='text-xs font-medium text-[#222222] dark:text-[#FAFAFA] max-w-[200px] truncate'>{selectedFile?.name}</p>
                <p className='text-[10px] text-[#929292]'>{Math.ceil(selectedFile.size / 1024)} KB</p>
              </div>
              <button
                onClick={() => { setSelectedFile(null); if (fileRef.current) fileRef.current.value = "" }}
                className='p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[#929292] hover:text-[#222222] dark:hover:text-[#FAFAFA] transition-colors cursor-pointer bg-transparent border-none'
              >
                <X size={13} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          placeholder='Ask AgentFlow AI anything... (Press Enter to send)'
          onChange={(e) => {
            setValue(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`
          }}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.keyCode === 13) && !e.shiftKey) {
              e.preventDefault()
              if (!isLoading && (value.trim() || selectedFile)) {
                handleSendMessage()
                e.target.style.height = 'auto'
              }
            }
          }}
          value={value}
          className="w-full bg-transparent outline-none resize-none text-[14px] text-[#222222] dark:text-[#FAFAFA] placeholder:text-[#929292] leading-relaxed [scrollbar-width:none] [&::-webkit-scrollbar]:hidden disabled:opacity-50 min-h-[38px] max-h-[160px] px-1"
          rows={1}
        />

        {/* Bottom Actions Row */}
        <div className='flex items-center justify-between pt-1'>
          <div className='flex items-center gap-1.5'>
            <input
              type="file"
              accept='.pdf,image/*'
              hidden
              ref={fileRef}
              onChange={(e) => {
                const file = e.target.files[0]
                if (file) {
                  setSelectedFile(file)
                }
              }}
            />

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Attach File (PDF, Image)"
              className='flex items-center justify-center w-8 h-8 rounded-full text-[#929292] hover:text-[#222222] dark:hover:text-[#FAFAFA] hover:bg-black/5 dark:hover:bg-white/10 transition-colors bg-transparent border-none cursor-pointer'
              onClick={() => fileRef.current.click()}
            >
              <Paperclip size={16} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={listening ? "Stop Listening" : "Voice Input"}
              onClick={toggleMic}
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all cursor-pointer border-none ${
                listening
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-[#929292] hover:text-[#222222] dark:hover:text-[#FAFAFA] hover:bg-black/5 dark:hover:bg-white/10 bg-transparent"
              }`}
            >
              {listening ? <Mic size={16} /> : <MicOff size={16} />}
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            title="Send Message"
            disabled={isLoading || (!value.trim() && !selectedFile)}
            onClick={handleSendMessage}
            className={`flex items-center justify-center w-8 h-8 rounded-full border-none transition-all duration-150 ${
              (value.trim() || selectedFile) && !isLoading
                ? "bg-[#222222] text-[#FAFAFA] hover:bg-[#333333] dark:bg-[#FAFAFA] dark:text-[#222222] dark:hover:bg-white/90 cursor-pointer shadow-xs"
                : "bg-[#EAEAEA] dark:bg-white/5 text-[#929292]/50 cursor-not-allowed"
            }`}
          >
            <Send size={14} />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default ChatInput
