import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync, spawn } from "child_process";

function fail(message) {
throw new Error("[VPS deploy] " + message);
}

function waitForProcess(child, name) {
return new Promise((resolve, reject) => {
child.on("error", (error) => {
reject(new Error(name + " failed: " + error.message));
});

child.on("close", (code) => {
  if (code === 0) {
    resolve();
  } else {
    reject(new Error(name + " exited with code " + code));
  }
});

});
}

export const onPostBuild = async ({ constants }) => {
// На VPS отправляем только production.
if (process.env.CONTEXT !== "production") {
console.log("[VPS deploy] Skipping: not a production build.");
return;
}

const required = [
"VPS_DEPLOY_KEY_B64",
"VPS_HOST",
"VPS_USER",
"VPS_KNOWN_HOSTS",
];

for (const name of required) {
if (!process.env[name]) {
fail("Missing environment variable: " + name);
}
}

const publishDir = constants.PUBLISH_DIR;

if (!publishDir) {
fail("Netlify PUBLISH_DIR is not available.");
}

const indexFile = path.join(publishDir, "index.html");

if (!fs.existsSync(indexFile)) {
fail("Build output not found: " + indexFile);
}

const tempDir = fs.mkdtempSync(
path.join(os.tmpdir(), "enemy-vps-deploy-")
);

const keyFile = path.join(tempDir, "deploy_key");
const knownHostsFile = path.join(tempDir, "known_hosts");
const archiveFile = path.join(tempDir, "site.tar.gz");

let archiveFd = null;

try {
console.log("[VPS deploy] Preparing deployment archive...");

const privateKey = Buffer.from(
  process.env.VPS_DEPLOY_KEY_B64,
  "base64"
).toString("utf8");

if (!privateKey.includes("BEGIN OPENSSH PRIVATE KEY")) {
  fail("Decoded SSH key is not a valid OpenSSH private key.");
}

fs.writeFileSync(keyFile, privateKey, {
  mode: 0o600,
});

fs.writeFileSync(
  knownHostsFile,
  process.env.VPS_KNOWN_HOSTS + "\n",
  {
    mode: 0o600,
  }
);

execFileSync(
  "tar",
  [
    "-czf",
    archiveFile,
    "-C",
    publishDir,
    ".",
  ],
  {
    stdio: "inherit",
  }
);

console.log("[VPS deploy] Uploading " + publishDir + "...");

archiveFd = fs.openSync(archiveFile, "r");

const ssh = spawn(
  "ssh",
  [
    "-T",
    "-i",
    keyFile,
    "-o",
    "IdentitiesOnly=yes",
    "-o",
    "StrictHostKeyChecking=yes",
    "-o",
    "UserKnownHostsFile=" + knownHostsFile,
    "-o",
    "BatchMode=yes",
    "-o",
    "ConnectTimeout=20",
    process.env.VPS_USER + "@" + process.env.VPS_HOST,
  ],
  {
    stdio: [
      archiveFd,
      "inherit",
      "inherit",
    ],
  }
);

await waitForProcess(ssh, "ssh");

console.log("[VPS deploy] Deployment successful.");

} catch (error) {
console.error(
"[VPS deploy] Deployment failed:",
error instanceof Error ? error.message : error
);

throw error;

} finally {
if (archiveFd !== null) {
try {
fs.closeSync(archiveFd);
} catch {
// fd уже мог быть закрыт системой.
}
}

fs.rmSync(tempDir, {
  recursive: true,
  force: true,
});

}
};