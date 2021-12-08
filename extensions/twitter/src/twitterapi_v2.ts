import { TwitterApi, TwitterV2IncludesHelper } from "twitter-api-v2";
import { authorize, getOAuthTokens } from "./lib/oauth";
import { Tweet, User } from "./twitter";

export class ClientV2 {
  private userCache: Record<string, User> = {};
  private meCache: User | undefined;

  async getAPI(): Promise<TwitterApi> {
    await authorize();
    const tokens = await getOAuthTokens();
    const at = tokens?.accessToken;
    const c = new TwitterApi(at || "");
    return c;
  }

  async getUserAccount(userId: string): Promise<User> {
    if (userId in this.userCache) {
      return this.userCache[userId];
    }
    const api = await this.getAPI();
    console.log("get user");
    const r = await api.v2.user(userId, { "user.fields": ["profile_image_url"] });
    const u: User = {
      id: r.data.id,
      name: r.data.name,
      username: r.data.username,
      profile_image_url: r.data.profile_image_url,
    };
    this.userCache[userId] = u;
    return u;
  }

  async me(): Promise<User> {
    if (this.meCache) {
      return this.meCache;
    }
    const api = await this.getAPI();
    const me = await api.v2.me();
    const u: User = {
      id: me.data.id,
      name: me.data.name,
      username: me.data.username,
      profile_image_url: me.data.profile_image_url,
    };
    this.meCache = u;
    return u;
  }

  async getMyTweets(): Promise<Tweet[]> {
    const api = await this.getAPI();
    const me = await api.v2.me();
    const tweetsRaw = await api.v2.userTimeline(me.data.id, {
      max_results: 10,
      "tweet.fields": ["public_metrics", "author_id", "attachments", "created_at", "id", "entities"],
      "media.fields": ["url", "type", "media_key", "preview_image_url"],
      expansions: [
        "attachments.media_keys",
        "author_id",
        "in_reply_to_user_id",
        "entities.mentions.username",
        "referenced_tweets.id",
      ],
    });
    const includes = new TwitterV2IncludesHelper(tweetsRaw);
    const tweets: Tweet[] = [];
    for (const t of tweetsRaw) {
      const media = includes.medias(t);
      let image_url: string | undefined = undefined;
      if (media && media.length > 0) {
        const m = media[0];
        if (m.url) {
          image_url = m.url;
        }
      }
      if (!t.author_id) {
        continue;
      }
      const nt: Tweet = {
        id: t.id,
        text: t.text,
        source: t.source || "",
        image_url: image_url,
        user: await this.getUserAccount(t.author_id),
        quote_count: t.public_metrics?.quote_count || 0,
        reply_count: t.public_metrics?.reply_count || 0,
        retweet_count: t.public_metrics?.retweet_count || 0,
        like_count: t.public_metrics?.like_count || 0,
      };
      tweets.push(nt);
    }
    return tweets;
  }

  async sendTweet(text: string): Promise<void> {
    const api = await this.getAPI();
    await api.v2.tweet(text);
  }

  async replyTweetID(text: string, tweetID: string): Promise<void> {
    const api = await this.getAPI();
    await api.v2.reply(text, tweetID);
  }
  async replyTweet(text: string, tweet: Tweet): Promise<void> {
    await this.replyTweetID(text, tweet.id);
  }
  async deleteTweetID(tweetID: string): Promise<void> {
    const api = await this.getAPI();
    await api.v2.deleteTweet(tweetID);
  }
  async deleteTweet(tweet: Tweet): Promise<void> {
    await this.deleteTweetID(tweet.id);
  }
}

export function createClientV2(): ClientV2 {
  return new ClientV2();
}

export const clientV2 = createClientV2();
