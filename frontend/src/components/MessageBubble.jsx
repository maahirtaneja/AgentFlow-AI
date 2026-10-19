import { Check, Copy, ExternalLink, FileX2, Sparkles, X } from 'lucide-react'
import React, { useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { motion, AnimatePresence } from 'motion/react'

function MessageBubble({ role, content, images }) {
  const isUser = role === "user"
  const [lightBox, setLightBox] = useState(null)
  const [copiedCode, setCopiedCode] = useState("")

  const copyCode = async (code) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => {
      setCopiedCode("")
    }, 2000)
  }

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start gap-3 items-start"}`}>
      {!isUser && (
        <div className='w-7 h-7 rounded-lg bg-[#222222]/5 dark:bg-white/10 border border-[#D1D1D1] dark:border-white/15 flex items-center justify-center text-[#222222] dark:text-[#FAFAFA] shrink-0 mt-0.5 shadow-2xs'>
          <Sparkles size={13} />
        </div>
      )}
      <div
        className={`w-fit max-w-[92vw] md:max-w-[80%] break-words overflow-hidden leading-relaxed text-[14px] ${
          isUser
            ? "px-4 py-2.5 rounded-2xl bg-[#222222] !text-[#FAFAFA] dark:bg-[#2A2A2A] dark:!text-[#FAFAFA] dark:border dark:border-[#D1D1D1]/20 rounded-tr-xs shadow-xs select-text font-normal"
            : "text-[#222222] dark:text-[#FAFAFA] flex-1 min-w-0"
        }`}
      >
        {images && images.length > 0 && (
          <div className='flex flex-wrap gap-2.5 mb-3'>
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                onClick={() => setLightBox(img)}
                loading="lazy"
                onError={(e) => e.currentTarget.remove()}
                className="w-40 h-28 rounded-xl object-cover border border-[#D1D1D1] dark:border-white/10 cursor-zoom-in hover:opacity-90 transition-opacity shadow-xs"
              />
            ))}
          </div>
        )}

        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className={`text-xl md:text-2xl font-bold mt-5 mb-2.5 tracking-tight ${isUser ? '!text-[#FAFAFA]' : 'text-[#222222] dark:text-[#FAFAFA]'}`}>{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className={`text-lg md:text-xl font-semibold mt-4 mb-2 tracking-tight ${isUser ? '!text-[#FAFAFA]' : 'text-[#222222] dark:text-[#FAFAFA]'}`}>{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className={`text-base font-semibold mt-3 mb-1.5 ${isUser ? '!text-[#FAFAFA]' : 'text-[#222222] dark:text-[#FAFAFA]'}`}>{children}</h3>
            ),
            p: ({ children }) => (
              <p className={`whitespace-pre-wrap break-words leading-relaxed ${isUser ? '!text-[#FAFAFA] mb-1.5 last:mb-0' : 'text-[#222222] dark:text-[#FAFAFA] mb-3'}`}>{children}</p>
            ),
            strong: ({ children }) => (
              <strong className={`font-semibold ${isUser ? '!text-[#FAFAFA]' : 'text-[#222222] dark:text-[#FAFAFA]'}`}>{children}</strong>
            ),
            ul: ({ children }) => (
              <ul className={`list-disc pl-5 space-y-1.5 my-3 ${isUser ? '!text-[#FAFAFA]' : ''}`}>{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className={`list-decimal pl-5 space-y-1.5 my-3 ${isUser ? '!text-[#FAFAFA]' : ''}`}>{children}</ol>
            ),
            li: ({ children }) => (
              <li className={isUser ? '!text-[#FAFAFA]' : ''}>{children}</li>
            ),
            table: ({ children }) => (
              <div className='my-5 overflow-hidden rounded-2xl border border-[#D1D1D1] dark:border-white/10 shadow-xs bg-white dark:bg-[#222222]'>
                <div className='overflow-x-auto [scrollbar-width:thin]'>
                  <table className='w-full text-left border-collapse text-[13px]'>
                    {children}
                  </table>
                </div>
              </div>
            ),
            thead: ({ children }) => (
              <thead className='bg-[#F4F4F4] dark:bg-white/[0.04] border-b border-[#D1D1D1] dark:border-white/10'>
                {children}
              </thead>
            ),
            th: ({ children }) => (
              <th className='px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#929292] select-none'>
                {children}
              </th>
            ),
            tbody: ({ children }) => (
              <tbody className='divide-y divide-[#D1D1D1]/40 dark:divide-white/[0.04]'>
                {children}
              </tbody>
            ),
            tr: ({ children }) => (
              <tr className='hover:bg-[#F9F9F9] dark:hover:bg-white/[0.02] transition-colors duration-150'>
                {children}
              </tr>
            ),
            td: ({ children }) => (
              <td className='px-4 py-3.5 text-[#222222] dark:text-[#FAFAFA] leading-relaxed align-top first:font-semibold first:text-[#222222] dark:first:text-[#FAFAFA] first:whitespace-nowrap'>
                {children}
              </td>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className={isUser
                  ? "text-[#D1D1D1] underline underline-offset-2 inline-flex items-center gap-1 hover:text-white transition-colors"
                  : "text-[#222222] dark:text-[#FAFAFA] font-medium underline underline-offset-2 inline-flex items-center gap-1 hover:opacity-75 transition-opacity"
                }
              >
                {children}
                <ExternalLink size={13} />
              </a>
            ),
            code: ({ className, children }) => {
              const value = String(children).trim()

              if (!className) {
                return (
                  <code className={isUser
                    ? 'px-1.5 py-0.5 rounded-md bg-white/20 !text-white font-mono text-[12.5px] border border-white/20'
                    : 'px-1.5 py-0.5 rounded-md bg-[#D1D1D1]/30 dark:bg-white/10 text-[#222222] dark:text-[#FAFAFA] font-mono text-[12.5px] border border-[#D1D1D1] dark:border-white/15'
                  }>
                    {value}
                  </code>
                )
              }

              const language = className.replace("language-", "")

              return (
                <div className='my-4 overflow-hidden rounded-2xl border border-[#D1D1D1] dark:border-white/10 shadow-sm'>
                  <div className='flex items-center justify-between bg-[#F0F0F0] dark:bg-[#1E1E1E] border-b border-[#D1D1D1] dark:border-white/10 px-4 py-2'>
                    <span className='uppercase font-mono text-[11px] font-semibold text-[#929292] tracking-wider'>
                      {language || "code"}
                    </span>
                    <button
                      className='flex items-center gap-1.5 text-xs text-[#929292] hover:text-[#222222] dark:hover:text-[#FAFAFA] transition-colors cursor-pointer bg-transparent border-none'
                      onClick={() => copyCode(value)}
                    >
                      {copiedCode === value ? (
                        <>
                          <Check size={13} className="text-[#222222] dark:text-[#FAFAFA]" />
                          <span className="text-[#222222] dark:text-[#FAFAFA] font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <SyntaxHighlighter
                    language={language}
                    style={oneDark}
                    wrapLongLines
                    showLineNumbers
                    customStyle={{
                      margin: 0,
                      padding: "16px",
                      background: "#181818",
                      fontSize: "12.5px",
                    }}
                  >
                    {value}
                  </SyntaxHighlighter>
                </div>
              )
            },
            img: ({ src }) => {
              if (!src) return null
              return (
                <img
                  src={src}
                  onClick={() => setLightBox(src)}
                  loading="lazy"
                  onError={(e) => e.currentTarget.remove()}
                  className="w-40 h-28 rounded-xl object-cover border border-black/10 dark:border-white/10 cursor-zoom-in hover:opacity-90 transition my-2"
                />
              )
            }
          }}
        >
          {content}
        </Markdown>
      </div>
      <AnimatePresence>
        {lightBox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className='fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-6'
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className='absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2.5 transition-colors border-none cursor-pointer'
              onClick={() => setLightBox(null)}
            >
              <X size={18} />
            </motion.button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              src={lightBox}
              className="max-w-[90vw] max-h-[85vh] rounded-2xl border border-white/15 shadow-2xl object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MessageBubble

