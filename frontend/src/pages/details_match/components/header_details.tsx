import { useTranslation } from "react-i18next";
import { Probability } from "../../../models/probability";
import { CardMatch } from "../../../components/card_match";
import { useNavigate } from "react-router-dom";
import { getTeamNameInCurrentLanguage } from "../../../ultis/languageUtils";

interface Props {
    data: Probability;
    /** When false (e.g. non-VIP), the "分析:主勝" block is hidden; lock is shown by parent. */
    showAnalysisLabel?: boolean;
}

function HeaderDetailsComponent({
    data,
    showAnalysisLabel = true,
}: Props) {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const getAnalysisLabel = () => {
        const pick = data.ia?.bestPick ?? data.ia?.picks?.goals?.bestPick;
        if (!pick) return null;

        const match = pick.match(/^(OVER|UNDER)_(\d+\.?\d*)$/);
        if (!match) return null;

        const direction = match[1]; // "OVER" or "UNDER"
        const aiLine = parseFloat(match[2]);
        const hkjcLine = data.hilMainLine ? parseFloat(data.hilMainLine) : NaN;
        // Use the lower of AI line and HKJC HIL main line
        const displayLine = !isNaN(hkjcLine) && hkjcLine < aiLine ? hkjcLine : aiLine;

        const prefix = direction === "OVER" ? t("analysis_over") : t("analysis_under");
        return `${prefix}${displayLine}`;
    };

    const analysisLabel = getAnalysisLabel();

    return (
        <div className="w-full flex flex-col items-center">
            <div className="sm:w-2/3 w-5/6">
                <CardMatch
                    widht={"100%"}
                    crownPosition="leagueRowRight"
                    navigate={navigate}
                    match={data}
                    teams={[getTeamNameInCurrentLanguage(data.homeLanguages, data.homeTeamName), getTeamNameInCurrentLanguage(data.awayLanguages, data.awayTeamName)]}
                />
            </div>
            {showAnalysisLabel && analysisLabel && (
                <div className="sm:w-2/3 w-5/6 mt-3">
                    <div className="bg-white/90 rounded-lg px-4 py-4 sm:py-5 shadow flex items-center justify-center">
                        <span className="text-base sm:text-2xl font-bold text-gray-800 text-center">
                            {analysisLabel}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
export default HeaderDetailsComponent;