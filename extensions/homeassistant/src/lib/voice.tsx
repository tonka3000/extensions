import { useEffect, useState } from "react";
import { getErrorMessage } from "../utils";
import { recordMicrophone } from "./sox";
import { Toast, showToast } from "@raycast/api";
import { getHAWSConnection } from "../common";
import * as fs from "fs/promises";

interface RunStartRunnerData {
  stt_binary_handler_id?: number;
  timeout?: number;
}

interface RunStartData {
  pipeline?: string;
  language?: string;
  runner_data?: RunStartRunnerData;
}

interface RunStart {
  type: string;
  data?: RunStartData;
  timestamp?: string;
}

export async function voicePipeline(pipelineID?: string) {
  const toast = await showToast({ style: Toast.Style.Animated, title: "Listen to you" });
  const sampleRate = 16000;
  const recordingFilename = await recordMicrophone({sampleRate: sampleRate});
  const con = await getHAWSConnection();
  let stt_binary_handler_id: number | undefined;
  const messageSubscription = await con.subscribeMessage(
    async (result: any) => {
      const type: string | undefined = result.type;
      if (type === "run-start") {
        console.log(result);
        const runstart = result as RunStart;
        stt_binary_handler_id = runstart.data?.runner_data?.stt_binary_handler_id;
      } else if (type === "stt-start") {
        console.log(result);
        try {
          console.log(`read ${recordingFilename}`);
          const bytes = await fs.readFile(recordingFilename);
          if (stt_binary_handler_id) {
            /*const chunk = new Int16Array(bytes, bytes.byteOffset, bytes.length / 2);
            const data = new Uint8Array(1 + chunk.length * 2);
            data[0] = stt_binary_handler_id;
            data.set(new Uint8Array(chunk.buffer), 1);
            console.log("send bytes to HA1");
            con.socket!.binaryType = "arraybuffer";
            con.socket?.send(data);*/

            /*const prefixBuffer = Buffer.alloc(1);
            prefixBuffer.writeInt8(stt_binary_handler_id);
            const prefixedBytes = Buffer.concat([prefixBuffer, bytes]);*/
            const prefixedBytes = new Uint8Array(1 + bytes.length);
            prefixedBytes[0] = stt_binary_handler_id;
            prefixedBytes.set(new Uint8Array(bytes.buffer), 1);
            console.log(prefixedBytes);

            console.log("send bytes to HA");
            con.socket!.binaryType = "arraybuffer";
            con.socket?.send(prefixedBytes);
          }
        } catch (error) {
          console.log(error);
          showToast({ style: Toast.Style.Failure, title: getErrorMessage(error) });
        }
      } else if (type === "error") {
        console.log(result);
        console.log("Error, unsubscribe");
        messageSubscription(); // unsubscribe
        toast.title = result?.data?.message ?? "?";
        toast.style = Toast.Style.Failure;
        toast.show();
      } else {
        console.log(result);
      }
    },
    {
      type: "assist_pipeline/run",
      start_stage: "stt",
      end_stage: "tts",
      pipeline: pipelineID,
      input: {
        sample_rate: sampleRate,
      },
      timeout: 20,
    },
    { resubscribe: true },
  );
  await toast.hide();
  console.log("after talk");
}

export function useVoiceRecording(): {
  error?: string;
  isLoading: boolean;
  data?: object;
} {
  const [data, setData] = useState<object>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let didUnmount = false;

    async function fetchData() {
      if (didUnmount) {
        return;
      }

      setIsLoading(true);
      setError(undefined);

      try {
        await recordMicrophone();
        if (!didUnmount) {
          setData(data);
        }
      } catch (error) {
        if (!didUnmount) {
          setError(getErrorMessage(error));
        }
      } finally {
        if (!didUnmount) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      didUnmount = true;
    };
  }, []);

  return { error, isLoading, data };
}
