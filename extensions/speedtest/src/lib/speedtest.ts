import fs from 'fs';
import { spawn } from "child_process";
import { speedtestCLIFilepath } from './cli';

export interface Result {
    isp: string | undefined;
    location: string | undefined;
    serverName: string | undefined;
    download: number | undefined;
    upload: number | undefined;
    ping: number | undefined;
}

export function isSpeedtestCliInstalled(): boolean {
    return fs.existsSync(speedtestCLIFilepath());
}

export function runSpeedTest(callback: (result: Result) => void, resultCallback: (result: Result) => void, errorCallback: (error: Error) => void) {
    const exePath = speedtestCLIFilepath();
    const pro = spawn(exePath, ["--format", "json", "--progress", "--accept-license", "--accept-gdpr"]);
    const result: Result = { isp: undefined, location: undefined, serverName: undefined, download: undefined, upload: undefined, ping: undefined };

    pro.on('uncaughtException', function (err) {
        errorCallback(err instanceof Error ? err : new Error("unknown error"));
    });

    pro.on('error', function (err) {
        errorCallback(err);
    });

    pro.stdout.on("data", (data) => {
        const obj = JSON.parse(data);
        const t = obj.type as string || undefined;
        if (t) {
            if (t === "download" || t === "upload") {
                const d = obj[t];
                const bandwidth = d.bandwidth as number || undefined;
                result[t] = bandwidth;
                callback(result);
            } else if (t === "testStart") {
                result.isp = obj.isp as string;
                result.serverName = obj.server?.name;
            } else if (t === "ping") {
                result.ping = obj.ping?.latency;
            } else if (t === "result") {
                result.download = obj.download.bandwidth as number || undefined;
                result.upload = obj.upload.bandwidth as number || undefined;
                result.ping = obj.ping?.latency;
                resultCallback(result);
            }
        }
    });

}
