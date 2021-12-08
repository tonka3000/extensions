import { showToast, Toast } from "@raycast/api";
import { TweetV2List } from "./tweet";
import { Tweet } from "../../twitter";
import { useRefresher } from "../../twitterapi";
import { clientV2 } from "../../twitterapi_v2";

export default function MyTweetV2List() {
  const { data, error, isLoading, fetcher } = useRefresher<Tweet[] | undefined>(
    async (updateInline): Promise<Tweet[] | undefined> => {
      return await clientV2.getMyTweets();
    }
  );
  if (error) {
    showToast({ style: Toast.Style.Failure, title: "Error", message: error });
  }
  return <TweetV2List isLoading={isLoading} tweets={data} fetcher={fetcher} />;
}
