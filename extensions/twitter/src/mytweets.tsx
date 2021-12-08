import { useV2API } from "./common";
import MyTweetList from "./components/mytweets";
import MyTweetV2List from "./components/v2/mytweets";

export default function MyTweetRoot() {
  if (useV2API()) {
    return <MyTweetV2List />;
  }
  return <MyTweetList />;
}
