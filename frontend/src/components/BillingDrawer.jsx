import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from "motion/react"
import { Check, Crown, X } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useTheme } from '../context/ThemeContext'
import api from '../../utils/axios'
import { createOrder } from '../features/createOrder'
import { verifyPayment } from '../features/verifyPayment'
import getCurrentUser from '../features/getCurrentUser'
import { setUserdata } from '../redux/userSlice'

const formatRupees = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`

function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
        if (window.Razorpay) return resolve(true)
        const script = document.createElement("script")
        script.src = "https://checkout.razorpay.com/v1/checkout.js"
        script.onload = () => resolve(true)
        script.onerror = () => reject(new Error("Failed to load Razorpay SDK"))
        document.body.appendChild(script)
    })
}

function BillingDrawer({ open, onClose }) {
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)
    const { isDark } = useTheme()
    const [quote, setQuote] = useState(null)
    const [quoteError, setQuoteError] = useState('')
    const [creditsInput, setCreditsInput] = useState('100')
    const [purchaseError, setPurchaseError] = useState('')
    const [purchasing, setPurchasing] = useState(false)

    useEffect(() => {
        if (!open) return undefined

        let active = true
        const loadQuote = async () => {
            try {
                const { data } = await api.get('/api/billing/quote')
                if (active) {
                    setQuote(data)
                    setQuoteError('')
                }
            } catch {
                if (active) setQuoteError('Current pricing is temporarily unavailable. Please try again shortly.')
            }
        }

        loadQuote()
        const interval = window.setInterval(loadQuote, 5 * 60 * 1000)
        return () => {
            active = false
            window.clearInterval(interval)
        }
    }, [open])

    const credits = Number(creditsInput)
    const customPrice = useMemo(() => {
        if (!quote || !Number.isInteger(credits) || credits < quote.minCustomCredits || credits > quote.maxCustomCredits) return null
        return Math.max(1, Math.round((credits / 100) * quote.rate))
    }, [credits, quote])

    const handlePurchase = async (purchase) => {
        if (purchasing) return
        setPurchasing(true)
        setPurchaseError('')
        try {
            await loadRazorpayScript()
            const data = await createOrder(purchase)
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: data?.order?.amount,
                currency: data?.order?.currency,
                name: "AgentFlow AI",
                description: `${data?.plan?.credits} credits for ${formatRupees(data?.plan?.amount)}`,
                order_id: data?.order?.id,
                handler: async (response) => {
                    try {
                        const verification = await verifyPayment(response)
                        const updatedUser = verification?.user || await getCurrentUser()
                        if (updatedUser) dispatch(setUserdata(updatedUser))
                        onClose?.()
                    } catch (error) {
                        setPurchaseError(error?.response?.data?.message || 'Payment verification failed. Contact support if you were charged.')
                    } finally {
                        setPurchasing(false)
                    }
                },
                modal: { ondismiss: () => setPurchasing(false) },
                theme: { color: "#222222" }
            }

            const razorpay = new window.Razorpay(options)
            razorpay.open()
        } catch (error) {
            setPurchaseError(error?.response?.data?.message || error.message || 'Could not start checkout. Please try again.')
            setPurchasing(false)
        }
    }

    const customCreditsInvalid = !Number.isInteger(credits) || !quote || credits < quote.minCustomCredits || credits > quote.maxCustomCredits

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 dark:bg-black/75 backdrop-blur-sm z-40"
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.99 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        onClick={(event) => event.stopPropagation()}
                        role="dialog" aria-modal="true" aria-labelledby="billing-plans-title"
                        className="fixed inset-0 z-50 m-auto flex h-fit max-h-[82vh] w-[calc(100%-2rem)] max-w-md flex-col overflow-hidden rounded-2xl border border-[#D1D1D1] bg-[#FAFAFA] text-[#222222] shadow-2xl dark:border-white/[0.08] dark:bg-[#1A1A1A] dark:text-[#FAFAFA]"
                    >
                        <div className="flex shrink-0 items-center justify-between border-b border-[#D1D1D1] p-4 dark:border-white/[0.08]">
                            <div>
                                <h2 id="billing-plans-title" className="text-lg font-semibold tracking-tight">Billing &amp; Credits</h2>
                                <p className="text-xs text-[#929292]">Add credits at the latest USD to INR rate</p>
                            </div>
                            <button onClick={onClose} aria-label="Close billing and plans" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-[#F0F0F0] transition-colors hover:bg-[#E0E0E0] dark:bg-white/5 dark:hover:bg-white/10">
                                <X size={16} className="text-[#929292] dark:text-[#FAFAFA]" />
                            </button>
                        </div>

                        <div className="shrink-0 px-4 pt-3">
                            <div className="rounded-xl border border-[#D1D1D1] p-3 dark:border-white/[0.08]">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-medium uppercase tracking-wider text-[#929292]">Current plan</p>
                                        <h3 className="mt-0.5 text-base font-bold capitalize">{userData?.plan || 'free'}</h3>
                                    </div>
                                    <Crown size={17} className="text-[#929292]" />
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs text-[#929292]">
                                    <span>Credits balance</span>
                                    <span>{userData?.credits || 0} / {userData?.totalCredits || 100}</span>
                                </div>
                                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#EAEAEA] dark:bg-white/10">
                                    <div className="h-full rounded-full bg-[#222222] transition-all duration-500 dark:bg-[#FAFAFA]" style={{ width: `${Math.min(100, ((userData?.credits || 0) / (userData?.totalCredits || 1)) * 100)}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4 pt-3">
                            {quoteError && <p role="status" className="rounded-lg bg-red-500/10 p-2.5 text-xs text-red-600 dark:text-red-300">{quoteError}</p>}

                            <section className="rounded-xl border border-[#D1D1D1] p-3 dark:border-white/[0.08]">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold">Choose your amount</h3>
                                        <p className="text-[11px] text-[#929292]">$1 buys 100 credits</p>
                                    </div>
                                    <span className="rounded-full bg-[#222222]/5 px-2 py-1 text-[10px] text-[#777] dark:bg-white/10 dark:text-[#bbb]">
                                        {quote ? `1 USD = ₹${quote.rate.toFixed(2)}` : 'Loading rate…'}
                                    </span>
                                </div>
                                <div className="flex items-end gap-3">
                                    <label className="min-w-0 flex-1 text-[10px] text-[#929292]">
                                        Credits
                                        <input
                                            type="number" min={quote?.minCustomCredits || 100} max={quote?.maxCustomCredits || 100000} step="1"
                                            value={creditsInput} onChange={(event) => setCreditsInput(event.target.value)}
                                            placeholder="100"
                                            aria-label="Number of credits to buy"
                                            className="mt-1 block h-10 w-full rounded-lg border border-[#D1D1D1] bg-white px-3 py-2 text-sm font-medium text-[#222222] outline-none transition-colors placeholder:text-[#A0A0A0] focus:border-[#777] dark:border-white/15 dark:bg-[#222222] dark:text-[#FAFAFA] dark:placeholder:text-[#777]"
                                        />
                                    </label>
                                    <div className="w-28 shrink-0 rounded-lg bg-[#F3F3F3] px-3 py-2 dark:bg-white/[0.06]">
                                        <p className="text-[10px] text-[#929292]">You pay</p>
                                        <p aria-live="polite" className="text-base font-bold">{customPrice === null ? '—' : formatRupees(customPrice)}</p>
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-2">
                                    <p className="text-[10px] text-[#929292]">
                                        {customPrice === null ? `Enter ${quote?.minCustomCredits || 100}–${(quote?.maxCustomCredits || 100000).toLocaleString('en-IN')} credits` : `${(credits / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })} USD converted to INR`}
                                    </p>
                                    <button
                                        disabled={customCreditsInvalid || purchasing}
                                        onClick={() => handlePurchase({ credits })}
                                        style={{
                                            backgroundColor: isDark ? '#000000' : '#FFFFFF',
                                            color: isDark ? '#FFFFFF' : '#222222',
                                            borderColor: isDark ? '#555555' : '#D1D1D1',
                                        }}
                                        className="shrink-0 rounded-full border px-3.5 py-2 text-[11px] font-semibold transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {purchasing ? 'Opening…' : 'Buy credits'}
                                    </button>
                                </div>
                            </section>

                            <div className="flex items-center justify-between pt-0.5">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#929292]">Discounted bundles</p>
                                {quote?.rateDate && <span className="text-[10px] text-[#929292]">Rate date: {quote.rateDate}</span>}
                            </div>

                            {quote?.bundles?.map((bundle) => (
                                <section key={bundle.id} className={`relative rounded-xl border p-3 ${bundle.popular ? 'border-[#222222]/50 dark:border-white/30' : 'border-[#D1D1D1] dark:border-white/[0.08]'}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="text-sm font-semibold">{bundle.name}</h3>
                                            </div>
                                            <p className="mt-0.5 text-[11px] text-[#929292]">{bundle.credits.toLocaleString('en-IN')} credits · {bundle.discountPercent}% off</p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-base font-bold">{formatRupees(bundle.amount)}</p>
                                            <p className="text-[10px] text-[#929292] line-through">{formatRupees(bundle.regularAmount)}</p>
                                        </div>
                                    </div>
                                    <div className="mt-2.5 flex items-center justify-between">
                                        <span className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300"><Check size={12} /> Save {formatRupees(bundle.regularAmount - bundle.amount)}</span>
                                        <button disabled={purchasing} onClick={() => handlePurchase({ plan: bundle.id })} className="rounded-full border border-[#222222]/20 px-3 py-1.5 text-[10px] font-semibold transition-colors hover:bg-[#222222] hover:text-white disabled:opacity-40 dark:border-white/20 dark:hover:bg-white dark:hover:text-[#222]">
                                            Get {bundle.name}
                                        </button>
                                    </div>
                                </section>
                            ))}

                            {purchaseError && <p role="alert" className="rounded-lg bg-red-500/10 p-2.5 text-xs text-red-600 dark:text-red-300">{purchaseError}</p>}
                            {!quote && !quoteError && <p className="text-center text-xs text-[#929292]">Loading current prices…</p>}
                            <p className="px-1 text-[10px] leading-relaxed text-[#929292]">INR estimates use the latest available reference rate. Final amount is confirmed before checkout.</p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

export default BillingDrawer
