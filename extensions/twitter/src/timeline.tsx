import { Detail, showToast, Toast } from "@raycast/api";
import { ReactElement } from "react";
import { TweetV1 } from "twitter-api-v2";
import { useV2API } from "./common";
import { TweetList } from "./components/tweet";
import { refreshTweets, twitterClient, useRefresher } from "./twitterapi";

async function getHomeTimelineTweets(): Promise<TweetV1[]> {
  const homeTimeline = await twitterClient.v1.homeTimeline({
    exclude_replies: true,
  });
  const tweets: TweetV1[] = [];
  const tweetsRaw = await homeTimeline.fetchLast(0);
  for (const t of tweetsRaw) {
    tweets.push(t);
  }
  return tweets;
}

export function HomeTimelineList() {
  const { data, error, isLoading, fetcher } = useRefresher<TweetV1[] | undefined>(
    async (updateInline): Promise<TweetV1[] | undefined> => {
      return updateInline ? await refreshTweets(data) : await getHomeTimelineTweets();
    }
  );
  if (error) {
    showToast(Toast.Style.Failure, "Error", error);
  }
  return <TweetList isLoading={isLoading} tweets={data} fetcher={fetcher} />;
}

function HomeTimelineV2List(): ReactElement {
  const parts: string[] = [
    "# Unsupported",
    "Sorry, the V2 API of Twitter does not support this feature right now",
    "You can only use this command when you using the API key for an V1",
  ];
  return <Detail markdown={parts.join("  \n")} />;
}

export default function HomeTimelineRoot(): ReactElement {
  if (useV2API()) {
    return <HomeTimelineV2List />;
  }
  return <HomeTimelineList />;
}
