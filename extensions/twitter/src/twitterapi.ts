import { getPreferenceValues } from "@raycast/api";
import { useEffect, useState } from "react";
import { AccountSettingsV1, TweetV1, TwitterApi } from "twitter-api-v2";

function createClient(): TwitterApi {
    const pref = getPreferenceValues();
    const appKey = (pref.appkey as string) || "";
    const appSecret = (pref.appsecret as string) || "";
    const accessToken = (pref.accesstoken as string) || "";
    const accessSecret = (pref.accesssecret as string) || "";
    const client = new TwitterApi({
        appKey: appKey,
        appSecret: appSecret,
        accessToken: accessToken,
        accessSecret: accessSecret
    });
    return client;
}

export const twitterClient = createClient();

let activeAccount: AccountSettingsV1 | undefined;

export async function loggedInUserAccount(): Promise<AccountSettingsV1> {
    if (!activeAccount) {
        const account = await twitterClient.v1.accountSettings();
        activeAccount = account;
    }
    return activeAccount;
}

export async function refreshTweets(tweets?: TweetV1[]): Promise<TweetV1[] | undefined> {
    if (tweets) {
        const tweetIds = tweets.map((t) => t.id_str);
        const unorderedFreshTweets = await twitterClient.v1.tweets(tweetIds);

        let freshTweets: TweetV1[] = [];
        for (const tid of tweetIds) {
            const t = unorderedFreshTweets.find((t) => tid === t.id_str);
            if (t) {
                freshTweets.push(t);
            }
        }
        return freshTweets;
    } else {
        return undefined;
    }
}

export interface Fetcher {
    updateInline: () => Promise<void>;
    refresh: () => Promise<void>;
}

export function useRefresher<T>(fn: (updateInline: boolean) => Promise<T>): {
    data: T | undefined;
    error?: string;
    isLoading: boolean;
    fetcher: Fetcher;
} {
    const [data, setData] = useState<T>();
    const [error, setError] = useState<string>();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [timestamp, setTimestamp] = useState<Date>(new Date());

    let cancel = false;

    const fetcher: Fetcher = {
        updateInline: async () => {
            await fetchData(true);
        },
        refresh: async () => {
            setTimestamp(new Date());
        },
    };

    async function fetchData(updateInline = false) {
        if (cancel) {
            return;
        }

        setIsLoading(true);
        setError(undefined);

        try {
            const data = await fn(updateInline);
            if (!cancel) {
                setData(data);
            }
        } catch (e: any) {
            if (!cancel) {
                setError(e.message);
            }
        } finally {
            if (!cancel) {
                setIsLoading(false);
            }
        }
    }
    useEffect(() => {
        fetchData();

        return () => {
            cancel = true;
        };
    }, [timestamp]);

    return { data, error, isLoading, fetcher };
}