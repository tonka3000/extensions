import { useV2 } from "./common";
import MyTweetList from "./v1/components/mytweets";
import { MyTweetListV2 } from "./v2/components/mytweets";

export default function MyTweetRoot() {
  if (useV2()) {
    return <MyTweetListV2 />;
  } else {
    return <MyTweetList />;
  }
}
