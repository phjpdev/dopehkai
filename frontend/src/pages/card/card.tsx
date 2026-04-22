import {
    useMemo,
    useState,
    useEffect,
    useRef,
    type ButtonHTMLAttributes,
    type HTMLAttributes,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Zap, Headphones, Gift, Send, ChevronRight } from "lucide-react";
import AppBarComponent from "../../components/appBar";
import { useConfig } from "../../hooks/useConfig";
import AppAssets from "../../ultis/assets";

const PRIZES = [
    { id: 1, label: "神秘獎勵 甲", reward: "7 日貴賓體驗", tag: "限時體驗" },
    { id: 2, label: "神秘獎勵 乙", reward: "現金獎勵 500 元", tag: "高價值獎勵" },
    { id: 3, label: "神秘獎勵 丙", reward: "88 折專屬優惠", tag: "立即可用" },
];

function Card({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={className} {...rest}>
            {children}
        </div>
    );
}

function CardContent({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={className} {...rest}>
            {children}
        </div>
    );
}

function Button({
    className = "",
    variant,
    children,
    ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "outline" }) {
    const base =
        variant === "outline"
            ? "inline-flex items-center justify-center rounded-full border border-white/15 bg-transparent px-7 text-sm text-white/80 transition hover:bg-white/5 hover:text-white"
            : "inline-flex items-center justify-center rounded-full border border-[#d8b36b]/30 bg-[#d8b36b] px-7 text-sm font-medium text-black shadow-[0_10px_40px_rgba(216,179,107,0.25)] transition hover:bg-[#e5c382]";
    return (
        <button type="button" className={`${base} ${className}`} {...rest}>
            {children}
        </button>
    );
}

function BackgroundDecor() {
    return (
        <>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(216,179,107,0.12),transparent_24%),radial-gradient(circle_at_80%_18%,rgba(255,255,255,0.08),transparent_18%),linear-gradient(180deg,#05060a_0%,#090b12_38%,#05060a_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d8b36b]/30 to-transparent" />
            <div className="pointer-events-none absolute left-1/2 top-[160px] h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-[#d8b36b]/[0.06] blur-[120px]" />
            <div
                className="pointer-events-none absolute left-0 top-0 h-full w-full opacity-[0.08]"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
                    backgroundSize: "72px 72px",
                }}
            />
        </>
    );
}

export default function CardLotteryPage() {
    const { data: config } = useConfig();
    const tgLink = config?.telegram || "https://t.me/Dopehkai";

    const [selected, setSelected] = useState<number | null>(null);
    const [revealed, setRevealed] = useState(false);
    const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prizeResultRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        return () => {
            if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
        };
    }, []);

    const selectedPrize = useMemo(() => {
        if (selected === null) return null;
        return PRIZES[selected];
    }, [selected]);

    useEffect(() => {
        if (!revealed || selectedPrize === null) return;
        const t = window.setTimeout(() => {
            prizeResultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 200);
        return () => window.clearTimeout(t);
    }, [revealed, selectedPrize]);

    const handlePick = (index: number) => {
        if (revealed) return;
        if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
        setSelected(index);
        revealTimerRef.current = setTimeout(() => {
            setRevealed(true);
            revealTimerRef.current = null;
        }, 350);
    };

    return (
        <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#06070a] text-white font-body">
            <AppBarComponent />

            <div className="relative isolate pt-24 md:pt-28">
                <BackgroundDecor />

                <main className="relative z-10 mx-auto max-w-7xl min-w-0 px-6 pb-20 lg:px-10">
                    <section className="grid items-start gap-6 pt-0 pb-2 lg:min-h-[80vh] lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:pb-8 lg:py-10">
                        <div className="max-w-2xl min-w-0">
                            <div className="relative flex min-h-0 flex-col overflow-hidden rounded-[28px] bg-[#06070a] lg:block lg:rounded-none lg:bg-transparent">
                                <div
                                    className="pointer-events-none absolute inset-0 scale-[1.08] bg-[#06070a] lg:hidden"
                                    style={{
                                        backgroundImage: `linear-gradient(180deg, rgba(6,7,10,0.52) 0%, rgba(6,7,10,0.28) 38%, rgba(6,7,10,0.35) 58%, rgba(6,7,10,0.72) 100%), url(${AppAssets.background_image})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center 40%",
                                        backgroundRepeat: "no-repeat",
                                    }}
                                />
                                <div className="pointer-events-none absolute inset-0 bg-black/12 lg:hidden" />
                                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_55%_at_50%_35%,rgba(216,179,107,0.09),transparent_52%)] lg:hidden" />
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#06070a] from-0% via-transparent via-20% to-transparent to-38% lg:hidden" />
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#06070a] from-0% via-[#06070a]/90 via-25% to-transparent to-58% lg:hidden" />
                                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_100%,#06070a_0%,transparent_45%)] opacity-90 lg:hidden" />
                                <div className="relative z-10 flex min-h-0 flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-8 lg:items-stretch lg:justify-start lg:px-0 lg:py-0">
                                    <div className="w-full max-w-xl text-left lg:max-w-none">
                                        <h1 className="text-4xl font-semibold leading-[1.12] tracking-tight text-white [text-shadow:0_2px_20px_rgba(0,0,0,0.85)] sm:text-5xl md:text-7xl md:leading-[1.1] lg:text-[88px] lg:leading-[1.12] lg:[text-shadow:none]">
                                            足球幸運抽獎
                                            <span className="mt-2 block bg-gradient-to-r from-[#fff4d6] via-[#d8b36b] to-[#9d7740] bg-clip-text pb-[0.12em] pt-[0.02em] text-transparent [-webkit-background-clip:text] [background-clip:text] sm:mt-3">
                                                贏取專屬好禮
                                            </span>
                                        </h1>

                                        <p className="mt-5 max-w-xl text-sm leading-7 text-white/95 [text-shadow:0_1px_14px_rgba(0,0,0,0.75)] sm:mt-6 sm:text-base sm:leading-8 md:text-lg lg:text-white/62 lg:[text-shadow:none]">
                                            高端足球數據體驗頁面，融合抽卡互動與品牌感視覺。點選一張卡片揭曉你的獎勵，完成後即可透過電報聯絡客服領獎。
                                        </p>

                                        <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8 lg:mt-10">
                                            <Button
                                                className="h-11 sm:h-12"
                                                onClick={() => {
                                                    document.getElementById("draw-section")?.scrollIntoView({ behavior: "smooth" });
                                                }}
                                            >
                                                立即參與
                                                <ChevronRight className="ml-1 h-4 w-4" />
                                            </Button>

                                            <div className="rounded-full border border-white/10 bg-black/45 px-4 py-2.5 text-xs text-white/80 shadow-inner backdrop-blur-md sm:px-5 sm:py-3 sm:text-sm sm:text-white/65">
                                                今日參與人數 <span className="ml-1.5 text-base font-semibold text-white sm:ml-2 sm:text-lg">23,568</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative mx-auto hidden w-full max-w-[560px] min-w-0 items-center justify-center lg:flex">
                            <div className="absolute inset-0 rounded-[36px] bg-[radial-gradient(circle_at_center,rgba(216,179,107,0.22),transparent_58%)] blur-3xl" />
                            <div className="relative h-[620px] w-full max-w-full overflow-hidden rounded-[36px] border border-[#d8b36b]/20 bg-[#0a0b10] shadow-[0_24px_90px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(255,255,255,0.06)]">
                                <img
                                    src={AppAssets.background_image}
                                    alt="首頁主視覺"
                                    className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
                                    loading="eager"
                                />
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#06070a] via-[#06070a]/55 to-transparent" />
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05060a] via-[#05060a]/35 to-[#0a0c14]/50" />
                                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(216,179,107,0.15),transparent_50%)]" />
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/60" />
                                <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08)]" />
                                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d8b36b]/35 to-transparent" />

                                <div className="absolute left-6 top-6 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-xs tracking-[0.2em] text-white/80 shadow-lg backdrop-blur-md">
                                    賽日氛圍
                                </div>

                                <div className="absolute bottom-6 left-6 right-6 rounded-[28px] border border-white/12 bg-black/45 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
                                    <div className="text-xs tracking-[0.2em] text-[#d8b36b]">專屬活動</div>
                                    <div className="mt-3 text-3xl font-semibold leading-tight text-white/95">
                                        極簡奢感 × 足球數據視覺
                                    </div>
                                    <div className="mt-3 text-sm leading-7 text-white/60">
                                        以黑金材質、球場燈光與玻璃卡片打造更高級的抽獎落地頁風格。
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="draw-section" className="pt-2 lg:pt-6">
                        <div className="mx-auto max-w-6xl min-w-0 rounded-[32px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-10">
                            <div className="flex flex-col items-center justify-between gap-4 border-b border-white/10 pb-8 text-center md:flex-row md:text-left">
                                <div>
                                    <div className="text-xs tracking-[0.2em] text-[#d8b36b]">卡片選擇</div>
                                    <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">選擇一張卡片</h2>
                                </div>
                                <div className="text-sm text-white/50">每位用戶限選一次，揭曉後即可前往客服領獎</div>
                            </div>

                            <div className="mt-10 grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
                                {PRIZES.map((item, index) => {
                                    const isChosen = selected === index;
                                    const isDimmed = selected !== null && selected !== index;

                                    return (
                                        <motion.button
                                            key={item.id}
                                            type="button"
                                            whileHover={!revealed ? { y: -8, scale: 1.01 } : {}}
                                            whileTap={!revealed ? { scale: 0.985 } : {}}
                                            onClick={() => handlePick(index)}
                                            className={`group relative h-[200px] min-h-0 w-full min-w-0 overflow-hidden rounded-xl border text-left transition duration-500 sm:h-[280px] sm:rounded-2xl md:h-[360px] md:rounded-[28px] ${
                                                isChosen
                                                    ? "border-[#d8b36b]/70 shadow-[0_0_0_1px_rgba(216,179,107,0.25),0_20px_60px_rgba(216,179,107,0.12)]"
                                                    : "border-white/10"
                                            } ${isDimmed ? "opacity-45" : "opacity-100"}`}
                                        >
                                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_18%,rgba(0,0,0,0.35)_100%)]" />
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(216,179,107,0.18),transparent_28%)] opacity-70" />
                                            <div className="absolute inset-0 bg-[#0b0d12]" />
                                            <div className="absolute inset-[1px] rounded-[11px] bg-[linear-gradient(180deg,#11141b_0%,#090b10_100%)] sm:rounded-[15px] md:rounded-[27px]" />
                                            <div
                                                className="absolute inset-0 opacity-[0.18]"
                                                style={{
                                                    backgroundImage:
                                                        "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.65) 1px, transparent 0)",
                                                    backgroundSize: "20px 20px",
                                                }}
                                            />
                                            <div className="absolute left-2 top-3 h-px w-8 bg-gradient-to-r from-[#d8b36b] to-transparent sm:left-6 sm:top-6 sm:w-16" />
                                            <div className="absolute right-2 top-3 h-px w-8 bg-gradient-to-l from-[#d8b36b] to-transparent sm:right-6 sm:top-6 sm:w-16" />
                                            <div className="absolute bottom-3 left-2 h-px w-8 bg-gradient-to-r from-[#d8b36b] to-transparent sm:bottom-6 sm:left-6 sm:w-16" />
                                            <div className="absolute bottom-3 right-2 h-px w-8 bg-gradient-to-l from-[#d8b36b] to-transparent sm:bottom-6 sm:right-6 sm:w-16" />

                                            <div className="relative z-10 flex h-full flex-col items-center justify-center px-1.5 text-center sm:px-6 md:px-8">
                                                <motion.div
                                                    animate={
                                                        isChosen && revealed ? { rotateY: 180, scale: 1.02 } : { rotateY: 0, scale: 1 }
                                                    }
                                                    transition={{ duration: 0.55 }}
                                                    className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-[#d8b36b]/20 bg-[radial-gradient(circle_at_30%_30%,rgba(216,179,107,0.38),rgba(24,25,30,0.9)_62%)] shadow-[inset_0_1px_12px_rgba(255,255,255,0.08),0_10px_40px_rgba(0,0,0,0.4)] sm:mb-6 sm:h-24 sm:w-24 md:mb-8 md:h-32 md:w-32"
                                                    style={{ transformStyle: "preserve-3d" }}
                                                >
                                                    <span className="bg-gradient-to-b from-[#fff7e2] to-[#caa35e] bg-clip-text text-2xl font-semibold text-transparent sm:text-5xl md:text-6xl">
                                                        ?
                                                    </span>
                                                </motion.div>
                                                <div className="text-[11px] font-semibold leading-tight tracking-tight sm:text-lg md:text-3xl">
                                                    {item.label}
                                                </div>
                                                <div className="mt-1 text-[9px] tracking-[0.12em] text-white/36 sm:mt-2 sm:text-xs sm:tracking-[0.2em]">
                                                    神秘獎勵
                                                </div>
                                                <div className="mt-2 max-w-full truncate rounded-full border border-white/10 bg-white/5 px-1.5 py-1 text-[8px] tracking-[0.08em] text-white/54 sm:mt-5 sm:px-3 sm:py-2 sm:text-xs sm:tracking-[0.15em] md:mt-6 md:px-4">
                                                    {revealed && isChosen ? item.tag : "點擊揭曉"}
                                                </div>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            <AnimatePresence>
                                {revealed && selectedPrize && (
                                    <motion.div
                                        ref={prizeResultRef}
                                        initial={{ opacity: 0, y: 24 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 24 }}
                                        transition={{ duration: 0.45 }}
                                        className="mt-8 scroll-mt-24 sm:scroll-mt-28"
                                    >
                                        <Card className="overflow-hidden rounded-[32px] border border-[#d8b36b]/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                                            <CardContent className="grid gap-0 p-0 lg:grid-cols-[0.9fr_1.1fr]">
                                                <div className="relative min-h-[320px] overflow-hidden border-b border-white/10 lg:border-b-0 lg:border-r lg:border-white/10">
                                                    <div
                                                        className="absolute inset-0 bg-cover bg-center brightness-[0.38] contrast-[1.05]"
                                                        style={{ backgroundImage: `url(${AppAssets.background_session_4})` }}
                                                    />
                                                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,8,12,0.15),rgba(7,8,12,0.82))]" />
                                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(216,179,107,0.2),transparent_24%)]" />
                                                    <div className="absolute bottom-8 left-8 right-8">
                                                        <div className="mb-3 text-xs tracking-[0.2em] text-[#d8b36b]">恭喜獲獎</div>
                                                        <div className="text-4xl font-semibold leading-tight">恭喜你抽中了</div>
                                                        <div className="mt-3 text-white/60">完成抽獎後，點擊下方按鈕前往電報聯絡客服。</div>
                                                    </div>
                                                </div>

                                                <div className="flex min-w-0 flex-col justify-center p-8 md:p-10 lg:p-12">
                                                    <div className="inline-flex w-fit items-center rounded-full border border-[#d8b36b]/25 bg-[#d8b36b]/10 px-4 py-2 text-xs tracking-[0.28em] text-[#e7c789]">
                                                        {selectedPrize.tag}
                                                    </div>
                                                    <h3 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl">
                                                        {selectedPrize.reward}
                                                    </h3>
                                                    <p className="mt-5 max-w-xl text-base leading-8 text-white/62">
                                                        您的抽獎結果已揭曉。請截圖保存本頁畫面，並透過電報聯絡客服完成獎勵確認與領取流程。
                                                    </p>

                                                    <div className="mt-8 flex flex-wrap gap-4">
                                                        <a
                                                            href={tgLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#d8b36b]/20 bg-[#d8b36b] px-7 text-sm font-medium text-black shadow-[0_10px_36px_rgba(216,179,107,0.24)] transition hover:bg-[#e5c382]"
                                                        >
                                                            <Send className="h-4 w-4" />
                                                            聯絡電報客服領獎
                                                        </a>
                                                    </div>

                                                    <div className="mt-8 grid gap-3 text-sm text-white/45 md:grid-cols-3">
                                                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">官方驗證</div>
                                                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">安全可靠</div>
                                                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">快速發放</div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </section>

                    <section className="mt-10 grid gap-4 md:grid-cols-4">
                        {[
                            { icon: Gift, title: "多種大獎", text: "體驗、現金與專屬優惠" },
                            { icon: ShieldCheck, title: "公平公正", text: "流程透明，互動明確" },
                            { icon: Zap, title: "快速領獎", text: "揭曉後即可聯絡客服" },
                            { icon: Headphones, title: "專人客服", text: "電報即時對接" },
                        ].map((item) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.title}
                                    className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d8b36b]/20 bg-[#d8b36b]/10 text-[#d8b36b]">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="mt-5 text-xl font-semibold tracking-tight">{item.title}</div>
                                    <div className="mt-2 text-sm leading-7 text-white/55">{item.text}</div>
                                </div>
                            );
                        })}
                    </section>

                    <footer className="pb-10 pt-10 text-center text-sm text-white/35">
                        本活動與電報平臺無關，參與即表示同意活動規則。
                    </footer>
                </main>
            </div>
        </div>
    );
}
