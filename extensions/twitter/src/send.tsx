import { ReactElement } from "react";
import { useV2API } from "./common";
import { TweetSendForm } from "./components/send";
import { TweetSendV2Form } from "./components/v2/send";

export default function SendTweetRoot(): ReactElement {
  if (useV2API()) {
    return <TweetSendV2Form />;
  }
  return <TweetSendForm />;
}
