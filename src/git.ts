import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

export async function getStagedDiff() {
  try {
    const { stdout } = await exec("git", ["diff", "--cached"], {
      maxBuffer: 10 * 1024 * 1024,
    });

    if (!stdout.trim()) {
      throw new Error("No staged changes found. Stage files with `git add` first.");
    }

    return stdout;
  } catch (error) {
    if (error instanceof Error && !error.message.includes("Stage files")) {
      const stderr = "stderr" in error && typeof error.stderr === "string" ? error.stderr.trim() : "";
      throw new Error(`git diff failed: ${stderr || error.message}`);
    }
    throw error;
  }
}

export async function commitWithMessage({ message }: { message: string }) {
  try {
    const { stdout } = await exec("git", ["commit", "-m", message]);
    return stdout.trim();
  } catch (error) {
    const stderr =
      error instanceof Error && "stderr" in error && typeof error.stderr === "string"
        ? error.stderr.trim()
        : "";
    throw new Error(`git commit failed: ${stderr || (error instanceof Error ? error.message : String(error))}`);
  }
}
