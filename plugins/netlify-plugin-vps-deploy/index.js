import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

function fail(message) {
throw new Error(`[VPS deploy] ${message}`);
}

function waitForProcess(child, name) {
return new Promise((resolve, reject) => {
child.on("error", (error) => {
reject(new Error(`${name} failed: ${error.message}`));
});

```
child.on("close", (code) => {
  if (code === 0) {
    resolve();
  } else {
    reject(new Error(`${name} exited with code ${code}`));
  }
});
```

});
}

export const onSuccess = async ({ constants }) => {
// Отправляем на VPS только production-сборку.
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
fail(`Missing environment variable: ${name}`);
}
}

const publishDir = constants.PUBLISH_DIR;

if (!publishDir) {
fail("Netlify PUBLISH_DIR is not available.");
}

const indexFile = path.join(publishDir, "index.html");

if (!fs.existsSync(indexFile)) {
fail(`Build output not found: ${indexFile}`);
}

const tempDir = fs.mkdtempSync(
path.join(os.tmpdir(), "enemy-vps-deploy-")
);

const keyFile = path.join(tempDir, "deploy_key");
const knownHostsFile = path.join(tempDir, "known_hosts");

try {
// Восстанавливаем приватный SSH-ключ из Base64.
const privateKey = Buffer.from(
process.env.VPS_DEPLOY_KEY_B64,
"base64"
).toString("utf8");

```
if (!privateKey.includes("BEGIN OPENSSH PRIVATE KEY")) {
  fail("Decoded SSH key does not look like a valid OpenSSH private key.");
}

fs.writeFileSync(keyFile, privateKey, {
  mode: 0o600,
});

// Записываем заранее известный host key VPS.
fs.writeFileSync(
  knownHostsFile,
  `${process.env.VPS_KNOWN_HOSTS}\n`,
  { mode: 0o600 }
);

console.log(`[VPS deploy] Uploading ${publishDir}...`);

const tar = spawn(
  "tar",
  ["-czf", "-", "-C", publishDir, "."],
  {
    stdio: ["ignore", "pipe", "inherit"],
  }
);

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
    `UserKnownHostsFile=${knownHostsFile}`,
    "-o",
    "BatchMode=yes",
    "-o",
    "ConnectTimeout=20",
    `${process.env.VPS_USER}@${process.env.VPS_HOST}`,
  ],
  {
    stdio: ["pipe", "inherit", "inherit"],
  }
);

// Передаём tar-архив напрямую в SSH.
tar.stdout.pipe(ssh.stdin);

const tarPromise = waitForProcess(tar, "tar");

const sshPromise = waitForProcess(ssh, "ssh");

// Если SSH завершился раньше tar, не оставляем tar писать
// в закрытый pipe и не получаем необработанный EPIPE.
ssh.on("close", () => {
  if (!tar.killed) {
    tar.kill("SIGTERM");
  }
});

try {
  await Promise.all([tarPromise, sshPromise]);
} catch (error) {
  if (tar.exitCode === null) {
    tar.kill("SIGTERM");
  }

  if (ssh.exitCode === null) {
    ssh.kill("SIGTERM");
  }

  throw error;
}

console.log("[VPS deploy] Deployment successful.");
```

} finally {
fs.rmSync(tempDir, {
recursive: true,
force: true,
});
}
};
