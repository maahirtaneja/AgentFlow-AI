import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import MessageBubble from './MessageBubble'
import LoadingAnimation from './LoadingAnimation'
import { motion, AnimatePresence } from 'motion/react'
import { submitSuggestedPrompt } from '../redux/uiSlice'

function MessageList() {
  const dispatch = useDispatch()
  const { selectedConversation } = useSelector(state => state.conversation)
  const { messages, isLoading } = useSelector(state => state.message)
  const bottemRef = useRef(null)

  useEffect(() => {
    requestAnimationFrame(() => {
      bottemRef?.current?.scrollIntoView({
        behavior: "smooth",
        block: "end"
      })
    })
  }, [messages?.length, isLoading])

  return (
    <div className='flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
      {messages.length === 0 || !selectedConversation ? (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className='glass-panel rounded-3xl p-8 max-w-md w-full flex flex-col items-center gap-4 subtle-glow shadow-xl border border-[#D1D1D1] dark:border-white/15'
          >
            <div className='w-12 h-12 rounded-2xl bg-[#222222] dark:bg-[#FAFAFA] border border-[#D1D1D1] dark:border-white/20 flex items-center justify-center text-[#FAFAFA] dark:text-[#222222] shadow-sm'>
              <span className='font-bold text-sm tracking-wider'>AI</span>
            </div>

            <div className='flex flex-col gap-1 items-center'>
              <h1 className='text-[22px] font-semibold text-[#222222] dark:text-[#FAFAFA] tracking-tight'>
                AgentFlow AI
              </h1>
              <a
                href="https://www.linkedin.com/in/maahirtaneja/"
                target="_blank"
                rel="noopener noreferrer"
                className='text-[11px] font-mono text-[#222222] dark:text-[#FAFAFA] bg-[#D1D1D1]/40 dark:bg-white/10 border border-[#D1D1D1] dark:border-white/15 px-3 py-0.5 rounded-full hover:underline transition-all duration-150 cursor-pointer inline-flex items-center gap-1 mt-0.5'
              >
                &lt;developed by Maahir Taneja /&gt;
              </a>
              <p className='text-[14px] text-[#222222] dark:text-[#FAFAFA] mt-2 font-medium'>
                What would you like to build or solve today?
              </p>
              <p className='text-[12px] text-[#929292] max-w-[300px] leading-relaxed'>
                Multi-agent system powered by intelligent coding, search, image generation, and document analysis.
              </p>
            </div>

            <div className='flex flex-wrap justify-center gap-2 pt-2'>
              {[
                "Write a Netflix clone",
                "Explain Redis caching",
                "Analyze a research PDF",
                "Generate design ideas"
              ].map((s) => (
                <motion.button
                  key={s}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => dispatch(submitSuggestedPrompt(s))}
                  className='text-[12px] text-[#222222] dark:text-[#FAFAFA] glass-pill px-3.5 py-1.5 rounded-full hover:bg-[#D1D1D1]/30 dark:hover:bg-white/[0.08] transition-all duration-150 cursor-pointer shadow-xs border border-[#D1D1D1] dark:border-white/10'
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      ) : (
        <div className='w-full max-w-3xl lg:max-w-4xl mx-auto space-y-6 px-1'>
          <AnimatePresence initial={false}>
            {messages?.map((msg, i) => (
              <motion.div
                key={msg?._id || i}
                initial={{ opacity: 0, y: 12, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <MessageBubble role={msg?.role} content={msg?.content} images={msg.images || []} />
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <LoadingAnimation />
            </motion.div>
          )}
        </div>
      )}
      <div ref={bottemRef} />
    </div>
  )
}

export default MessageList
