const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const required = [
  "VPS_DEPLOY_KEY",
  "VPS_HOST",
  "VPS_USER",
  "VPS_KNOWN_HOSTS",
];

for (const name of required) {
  if (!process.env[name]) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
}

const distDir = path.resolve("dist");

if (!fs.existsSync(path.join(distDir, "index.html"))) {
  console.error(`Build output not found: ${path.join(distDir, "index.html")}`);
  process.exit(1);
}

const tempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "enemy-vps-deploy-")
);

const keyFile = path.join(tempDir, "deploy_key");
const knownHostsFile = path.join(tempDir, "known_hosts");

fs.writeFileSync(keyFile, process.env.VPS_DEPLOY_KEY, { mode: 0o600 });
fs.writeFileSync(knownHostsFile, `${process.env.VPS_KNOWN_HOSTS}\n`, {
  mode: 0o600,
});

console.log("==> Deploying dist to VPS...");

const sshArgs = [
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
];

const ssh = spawn("ssh", sshArgs, {
  stdio: ["pipe", "inherit", "inherit"],
});

const tar = spawn(
  "tar",
  ["-czf", "-", "-C", distDir, "."],
  {
    stdio: ["ignore", "pipe", "inherit"],
  }
);

tar.stdout.pipe(ssh.stdin);

let tarCode = null;
let sshCode = null;

function finish() {
  if (tarCode === null || sshCode === null) {
    return;
  }

  fs.rmSync(tempDir, { recursive: true, force: true });

  if (tarCode !== 0 || sshCode !== 0) {
    console.error(
      `VPS deployment failed (tar=${tarCode}, ssh=${sshCode})`
    );
    process.exit(1);
  }

  console.log("==> VPS deployment successful.");
}

tar.on("close", (code) => {
  tarCode = code;
  finish();
});

ssh.on("close", (code) => {
  sshCode = code;
  finish();
});

tar.on("error", (error) => {
  console.error(`tar failed: ${error.message}`);
  process.exit(1);
});

ssh.on("error", (error) => {
  console.error(`ssh failed: ${error.message}`);
  process.exit(1);
});