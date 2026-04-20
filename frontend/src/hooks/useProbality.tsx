import { useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import API from "../api/api";
import AppGlobal from "../ultis/global";
import { Probability } from "../models/probability";
import { Match } from "../models/match";

export const useProbability = (
    id: string
): UseQueryResult<Probability, Error> => {
    const queryClient = useQueryClient();
    return useQuery<Probability, Error>({
        queryKey: ["probability", id],
        queryFn: async () => {
            try {
                const url = AppGlobal.baseURL + "match/match-data/" + id + "?refresh=false";
                const res = await API.GET(url);
                if (res.status === 200 && res.data) return res.data;
                throw new Error(`Failed to fetch match details: ${res.status}`);
            } catch (error) {
                console.error('Error fetching probability:', error);
                throw error;
            }
        },
        // Seed from match list cache so the header renders instantly
        placeholderData: () => {
            const matchList = queryClient.getQueryData<Match[]>(["matchs"]);
            if (!matchList) return undefined;
            const found = matchList.find(m => m.id === id || m.eventId === id);
            return found ? (found as unknown as Probability) : undefined;
        },
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        staleTime: 2 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
};
