import { useTranslation } from "react-i18next";
import AppAssets from "../../../ultis/assets";

export function SectionComponent6() {
    const { t } = useTranslation();
    return (
        <section id="about-us"
            className="flex items-center justify-center sm:mt-0 p-3 flex-col bg-white w-screen">

            <div className="relative z-10 w-full flex items-center flex-col pl-10 pb-5">
                <div className="relative z-10 w-full flex items-end sm:h-[20vh] h-[18vh]">
                    <div className="flex flex-1 items-center pl-5">
                        <div className="w-5 bg-black mr-4 self-stretch" />
                        <div className="flex flex-col justify-center space-y-2 text-black">
                            <p className="sm:text-5xl text-3xl font-semibold leading-tight">
                                {t("About_Us").toUpperCase()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <img src={AppAssets.logo_black} className="h-72" alt="Logo" />

            <p className="text-center mt-5 max-w-xl text-gray-700 text-xl">
                {t("About_com").toUpperCase()}
            </p>

            <div className="h-12" />

            {/* Legal Disclaimer */}
            <div className="w-full bg-black py-6 px-4">
                <p className="text-center max-w-3xl mx-auto text-white text-sm sm:text-base font-bold leading-relaxed">
                    用戶使用本系統提供的足球分析數據時，必須只透過香港賽馬會（HKJC）足智彩等香港合法投注平台進行任何投注。本系統不提供、不推廣亦不便利任何非法投注活動。未滿18歲人士不得投注。如有需要尋求輔導，可致電平和基金熱線 1834 633。
                </p>
            </div>
        </section>
    );
}