export async function getStagedDiff() {
  const proc = Bun.spawn(["git", "diff", "--cached"], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const diff = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error(`git diff failed: ${stderr.trim()}`);
  }

  if (!diff.trim()) {
    throw new Error("No staged changes found. Stage files with `git add` first.");
  }

  return diff;
}

export async function commitWithMessage({ message }: { message: string }) {
  const proc = Bun.spawn(["git", "commit", "-m", message], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error(`git commit failed: ${stderr.trim()}`);
  }

  return stdout.trim();
}
