import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

interface PullRequestMetadata {
  readonly title: string;
  readonly branch: string;
  readonly base: string;
  readonly head: string;
}

const branchPattern =
  /^(feat|fix|docs|refactor|perf|test|build|ci|chore|style|revert)\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const subjectPattern =
  /^(feat|fix|docs|refactor|perf|test|build|ci|chore|style|revert)(?:\([a-z0-9-]+\))?!?: [a-z].*[^.]$/;

function validBranch(branch: string): boolean {
  return branch.length <= 80 && branchPattern.test(branch);
}

function validSubject(subject: string): boolean {
  return subject.length <= 72 && /^[\x20-\x7e]+$/.test(subject) && subjectPattern.test(subject);
}

function hasProhibitedTrailer(body: string): boolean {
  return /^(?:co-authored-by|generated-by|assistant-generated-by)\s*:/im.test(body);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pullRequestMetadata(event: unknown): PullRequestMetadata | null {
  if (!isObject(event) || !isObject(event.pull_request)) return null;
  const request = event.pull_request;
  if (
    !isObject(request.head) ||
    !isObject(request.base) ||
    typeof request.title !== "string" ||
    typeof request.head.ref !== "string" ||
    typeof request.head.sha !== "string" ||
    typeof request.base.sha !== "string"
  )
    throw new Error("Invalid pull request metadata");
  return {
    title: request.title,
    branch: request.head.ref,
    base: request.base.sha,
    head: request.head.sha,
  };
}

function selfTest(): void {
  if (
    !validBranch("feat/add-liquidity-forecast") ||
    validBranch("feature/Add_forecast") ||
    validBranch(`feat/${"a".repeat(76)}`)
  )
    throw new Error("Branch policy self-test failed");
  if (
    !validSubject("feat(planning): add liquidity forecast") ||
    validSubject("Update forecast") ||
    validSubject("fix: adjust forecast.") ||
    validSubject(`fix: ${"a".repeat(68)}`)
  )
    throw new Error("Commit subject policy self-test failed");
  if (
    !hasProhibitedTrailer("feat: add forecast\n\nCo-Authored-By: Synthetic fixture") ||
    hasProhibitedTrailer("fix: preserve historical authorship")
  )
    throw new Error("Commit trailer policy self-test failed");
}

function git(arguments_: readonly string[]): string {
  return execFileSync("git", [...arguments_], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

selfTest();
let repositoryRoot: string | null = null;
try {
  repositoryRoot = git(["rev-parse", "--show-toplevel"]);
} catch {
  repositoryRoot = null;
}

if (repositoryRoot !== resolve(process.cwd())) {
  console.log(
    "Git policy self-tests passed; metadata checks are not applicable without a root Git repository.",
  );
} else {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  const event: unknown = eventPath ? JSON.parse(readFileSync(eventPath, "utf8")) : null;
  const request = pullRequestMetadata(event);
  const failures: string[] = [];
  if (request && !validBranch(request.branch))
    failures.push("Pull request branch violates type/short-description and the 80-character limit");
  if (request && !validSubject(request.title))
    failures.push("Pull request title violates Conventional Commits or the 72-character limit");
  const before = isObject(event) && typeof event.before === "string" ? event.before : undefined;
  const base = request?.base ?? process.env.GIT_BASE_SHA ?? before;
  const head = request?.head ?? process.env.GIT_HEAD_SHA ?? process.env.GITHUB_SHA;
  if (head) {
    if (!/^[a-f0-9]{40}$/.test(head) || (base && !/^[a-f0-9]{40}$/.test(base)))
      throw new Error("Git metadata requires complete commit hashes");
    const arguments_ =
      base && !/^0{40}$/.test(base)
        ? ["log", `${base}..${head}`, "--format=%H"]
        : ["log", "-1", head, "--format=%H"];
    const commits = git(arguments_).split("\n").filter(Boolean);
    for (const commit of commits) {
      const subject = git(["show", "-s", "--format=%s", commit]);
      const body = git(["show", "-s", "--format=%B", commit]);
      if (!validSubject(subject)) failures.push(`${commit}: invalid commit subject`);
      if (hasProhibitedTrailer(body)) failures.push(`${commit}: prohibited authorship trailer`);
    }
    console.log(`Git policy inspected ${commits.length} commits in the requested change range.`);
  } else {
    console.log(
      "Git policy self-tests passed; set GIT_BASE_SHA/GIT_HEAD_SHA to inspect new commit metadata.",
    );
  }
  if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exitCode = 1;
  }
}
