import { List, showToast, ToastStyle } from "@raycast/api";
import { useState, useEffect } from "react";
import { TweetV1 } from "twitter-api-v2";
import { TweetListItem } from "./components/tweet";
import { twitterClient } from "./twitterapi";

export default function TweetList() {
  const { data, error, isLoading } = useSearch("");
  if (error) {
    showToast(ToastStyle.Failure, "Error", error);
  }
  return (
    <List isLoading={isLoading} searchBarPlaceholder="Filter Tweets by name...">
      {data?.map((tweet) => (
        <TweetListItem key={tweet.id_str} tweet={tweet} />
      ))}
    </List>
  );
}

export function useSearch(query: string | undefined): {
  data: TweetV1[] | undefined;
  error?: string;
  isLoading: boolean;
} {
  const [data, setData] = useState<TweetV1[]>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  let cancel = false;

  useEffect(() => {
    async function fetchData() {
      if (query === null || cancel) {
        return;
      }

      setIsLoading(true);
      setError(undefined);

      try {
        const homeTimeline = await twitterClient.v1.homeTimeline({
          exclude_replies: true,
        });
        let tweets: TweetV1[] = [];
        const tweetsRaw = await homeTimeline.fetchLast(0);
        for (const t of tweetsRaw) {
          tweets.push(t);
        }
        if (!cancel) {
          setData(tweets);
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

    fetchData();

    return () => {
      cancel = true;
    };
  }, []);

  return { data, error, isLoading };
}
