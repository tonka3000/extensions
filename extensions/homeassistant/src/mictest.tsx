import { getMicrophoneAudio } from "@lib/speech";
import { getErrorMessage } from "@lib/utils";
import { List, Toast, showToast } from "@raycast/api";
import { useEffect, useState } from "react";

export default function MictestCommand() {
  const { isLoading, error } = useMic();
  if (error) {
    showToast({ style: Toast.Style.Failure, title: error });
  }
  return <List isLoading={isLoading} />;
}

function useMic(): {
  error?: string;
  isLoading: boolean;
  data?: any;
} {
  const [data, setData] = useState<any>();
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
        await getMicrophoneAudio();
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
