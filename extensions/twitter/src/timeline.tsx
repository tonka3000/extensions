import { List, showToast, ToastStyle } from "@raycast/api";
import { TweetV1 } from "twitter-api-v2";
import { TweetListItem } from "./components/tweet";
import { refreshTweets, twitterClient, useRefresher } from "./twitterapi";

async function getHomeTimelineTweets(): Promise<TweetV1[]> {
  const homeTimeline = await twitterClient.v1.homeTimeline({
    exclude_replies: true,
  });
  let tweets: TweetV1[] = [];
  const tweetsRaw = await homeTimeline.fetchLast(0);
  for (const t of tweetsRaw) {
    tweets.push(t);
  }
  return tweets;
}

export default function TweetList() {
  const { data, error, isLoading, fetcher } = useRefresher<TweetV1[] | undefined>(
    async (updateInline): Promise<TweetV1[] | undefined> => {
      return updateInline ? await refreshTweets(data) : await getHomeTimelineTweets();
    }
  );
  if (error) {
    showToast(ToastStyle.Failure, "Error", error);
  }
  return (
    <List isLoading={isLoading} searchBarPlaceholder="Filter Tweets by name...">
      {data?.map((tweet) => (
        <TweetListItem key={tweet.id_str} tweet={tweet} fetcher={fetcher} />
      ))}
    </List>
  );
}
