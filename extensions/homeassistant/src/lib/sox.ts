import util from "util";
import * as fs from "fs/promises";
import { exec as execNonPromise } from "child_process";
import { environment } from "@raycast/api";
import path from "path";
const exec = util.promisify(execNonPromise);

async function getTempFolder(args?: { ensureDirectory?: boolean }): Promise<string> {
    const ensureDirectory = args?.ensureDirectory === undefined ? true : args.ensureDirectory;
    const result = path.join(environment.supportPath, "voice");
    if (ensureDirectory) {
        await fs.mkdir(result, { recursive: true });
    }
    return result;
}
export async function recordMicrophone(args?: { sampleRate?: number }): Promise<string> {
    const sampleRate = args?.sampleRate ? args.sampleRate : 16000;
    const td = await getTempFolder();
    const recordingPath = path.join(td, "in.wav");
    const recordingHAPath = path.join(td, "inha.wav");
    const { stdout, stderr } = await exec(
        `"/opt/homebrew/bin/rec" "${recordingPath}" rate ${sampleRate} silence 3.0 0 5% 2.0 2.0 5% -t pcm`,
    );
    console.log(stdout);
    console.log(stderr);
    await exec(`"/opt/homebrew/bin/sox" "${recordingPath}" -r ${sampleRate} -b 16 -c 1 -t wav "${recordingHAPath}"`);
    //await exec(`"/opt/homebrew/bin/sox" "${recordingPath}" -r ${sampleRate} -c 1 -t u16 "${recordingHAPath}"`);
    return recordingHAPath;
    //console.log(r);
}
