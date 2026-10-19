import { signInWithPopup } from 'firebase/auth'
import React from 'react'
import { auth, googleProvider } from '../../utils/firebase'
import api from '../../utils/axios'
import { FcGoogle } from "react-icons/fc";
import { useDispatch, useSelector } from 'react-redux';
import { setUserdata } from '../redux/userSlice';
import SideBar from '../components/SideBar';
import ChatArea from '../components/ChatArea';
import Artifact from '../components/Artifact';
import { AnimatePresence, motion } from 'motion/react'

function Home() {
    const {userData}=useSelector(state=>state.user)
    const dispatch=useDispatch()
    const handleLogin = async (token) => {
        try {
            const { data } = await api.post("/api/auth/login", { token })
            dispatch(setUserdata(data))
        } catch (error) {
            console.log(error)
        }
    }


    const googleLogin = async () => {
        const data = await signInWithPopup(auth, googleProvider)
        const token = await data.user.getIdToken()
        console.log(token)
        await handleLogin(token)
        console.log(data)
    }
    return (
        <div className='h-screen flex bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden transition-colors duration-200'>

            <SideBar />
            <ChatArea />
            <Artifact />

            <AnimatePresence>
            {!userData && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className='fixed inset-0 z-50 flex items-center justify-center bg-black/35 dark:bg-black/65 backdrop-blur-sm p-4'
                >
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.99 }}
                        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                        className='w-[360px] max-w-full glass-panel rounded-2xl p-7 flex flex-col gap-6 shadow-xl relative overflow-hidden'
                    >
                        <div className='flex flex-col gap-1.5 text-center items-center'>
                            <div className='w-12 h-12 rounded-2xl bg-[#222222] dark:bg-[#FAFAFA] flex items-center justify-center text-[#FAFAFA] dark:text-[#222222] mb-2 shadow-md'>
                                <span className='font-bold text-lg tracking-wider'>AF</span>
                            </div>
                            <h2 className='text-[20px] font-semibold text-[#222222] dark:text-[#FAFAFA] tracking-tight'>AgentFlow AI</h2>
                            <a
                                href="https://www.linkedin.com/in/maahirtaneja/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className='text-[11px] font-mono text-[#222222] dark:text-[#FAFAFA] bg-[#D1D1D1]/40 dark:bg-white/10 border border-[#D1D1D1] dark:border-white/15 px-2.5 py-0.5 rounded-full hover:underline transition-colors duration-150 inline-block cursor-pointer'
                            >
                                &lt;developed by Maahir Taneja /&gt;
                            </a>
                            <p className='text-[13px] text-[#929292] mt-1 leading-relaxed'>Sign in to continue using AgentFlow AI.</p>
                        </div>

                        <button
                            className='w-full flex items-center justify-center gap-3 py-3 rounded-full text-sm font-medium text-[#222222] dark:text-[#FAFAFA] bg-[#FAFAFA] dark:bg-[#222222] hover:bg-[#D1D1D1]/30 dark:hover:bg-white/10 border border-[#D1D1D1] dark:border-white/15 transition-all duration-150 cursor-pointer shadow-xs'
                            onClick={googleLogin}
                        >
                            <FcGoogle size={18} />
                            Continue with Google
                        </button>
                    </motion.div>
                </motion.div>
            )}
            </AnimatePresence>

        </div>
    )
}

export default Home
