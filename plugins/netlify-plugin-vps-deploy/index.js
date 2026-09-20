import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

function fail(message) {
  throw new Error(`[VPS deploy] ${message}`);
}

export const onSuccess = async ({ constants }) => {
  if (process.env.CONTEXT !== "production") {
    console.log("[VPS deploy] Skipping: not a production build.");
    return;
  }

  const required = [
    "VPS_DEPLOY_KEY",
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
    fs.writeFileSync(keyFile, process.env.VPS_DEPLOY_KEY, {
      mode: 0o600,
    });

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

    tar.stdout.pipe(ssh.stdin);

    const tarResult = new Promise((resolve, reject) => {
      tar.on("error", reject);

      tar.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`tar exited with code ${code}`));
        }
      });
    });

    const sshResult = new Promise((resolve, reject) => {
      ssh.on("error", reject);

      ssh.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`ssh exited with code ${code}`));
        }
      });
    });

    await Promise.all([tarResult, sshResult]);

    console.log("[VPS deploy] Deployment successful.");
  } finally {
    fs.rmSync(tempDir, {
      recursive: true,
      force: true,
    });
  }
};