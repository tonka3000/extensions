import { recordMic } from "swift:../../swift/homeassistant";

export async function getMicrophoneAudio() {
  const res = await recordMic<number>();
  return res;
}
