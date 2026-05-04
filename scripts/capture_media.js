#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");
const { execFile, spawn } = require("node:child_process");
const { promisify } = require("node:util");
const { chromium } = require("playwright");

const execFileAsync = promisify(execFile);

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "assets", "demo");
const DEFAULT_URL = "http://localhost:8502";
const VIEWPORT = { width: 1600, height: 900 };
const VIDEO = { width: 1920, height: 1080, fps: 30 };
const CAPTURE_CHROME_CSS = `
  header[data-testid="stHeader"],
  [data-testid="stToolbar"],
  [data-testid="stDecoration"],
  [data-testid="stStatusWidget"],
  [data-testid="collapsedControl"],
  [data-testid="stSidebarCollapseButton"],
  [data-testid="baseButton-header"],
  button[kind="header"],
  #MainMenu {
    display: none !important;
    visibility: hidden !important;
  }

  .album-placeholder-capture {
    height: 180px !important;
    width: 180px !important;
    border-radius: 18px !important;
    background: linear-gradient(135deg, #1db954, #0f172a) !important;
    color: #f8fafc !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    text-align: center !important;
    font-weight: 800 !important;
    letter-spacing: 0.04em !important;
    text-transform: uppercase !important;
    box-shadow: 0 18px 44px rgba(15, 23, 42, 0.18) !important;
  }
`;

const STATES = [
  { file: "hero.png", nav: "Home", waitFor: "Currently playing", title: "Home dashboard" },
  { file: "dashboard.png", nav: "Listening History", waitFor: "Listening heatmap", title: "Listening history dashboard" },
  { file: "features.png", nav: "Audio Features", waitFor: "Average feature profile", title: "Audio feature analysis" },
  { file: "workflow.png", nav: "Playlists", waitFor: "Selected playlist tracks", title: "Playlist workflow" },
];

function parseArgs() {
  const args = new Map();
  for (let i = 2; i < process.argv.length; i += 1) {
    const value = process.argv[i];
    if (value.startsWith("--")) {
      const next = process.argv[i + 1];
      if (next && !next.startsWith("--")) {
        args.set(value, next);
        i += 1;
      } else {
        args.set(value, true);
      }
    }
  }
  return {
    url: args.get("--url") || process.env.SPOTIFY_CAPTURE_URL || DEFAULT_URL,
    startServer: Boolean(args.get("--start-server")),
    python: args.get("--python") || process.env.PYTHON || "python",
    skipVideo: Boolean(args.get("--skip-video")),
  };
}

async function waitForServer(url, timeoutMs = 45000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (_) {
      // Retry until the local Streamlit server is ready.
    }
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function startStreamlit(python) {
  const child = spawn(
    python,
    [
      "-m",
      "streamlit",
      "run",
      "app.py",
      "--server.port",
      "8502",
      "--server.headless",
      "true",
      "--browser.gatherUsageStats",
      "false",
    ],
    {
      cwd: ROOT,
      env: { ...process.env, SPOTIFY_DEMO_MODE: "true" },
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  );

  process.on("exit", () => child.kill());
  process.on("SIGINT", () => {
    child.kill();
    process.exit(130);
  });
  return child;
}

async function prepareOutput() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await Promise.all(
    ["hero.png", "dashboard.png", "features.png", "workflow.png", "demo-poster.png", "demo.mp4"].map((file) =>
      fs.rm(path.join(OUTPUT_DIR, file), { force: true }),
    ),
  );
}

async function settle(page) {
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1800);
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function removeCaptureChrome(page) {
  await page.addStyleTag({ content: CAPTURE_CHROME_CSS }).catch(() => {});
  await page.evaluate(() => {
    const remove = () => {
      document
        .querySelectorAll('[data-testid="baseButton-header"], button[kind="header"]')
        .forEach((element) => element.remove());

      document.querySelectorAll("div").forEach((element) => {
        if (element.textContent.trim() === "No artwork") {
          element.textContent = "Demo Rotation";
          element.removeAttribute("style");
          element.className = "album-placeholder-capture";
        }
      });
    };
    remove();
    if (!window.__spotifyCaptureChromeObserver) {
      window.__spotifyCaptureChromeObserver = new MutationObserver(remove);
      window.__spotifyCaptureChromeObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }
  });
  await page.waitForTimeout(250);
}

async function clickNavigation(page, label) {
  const text = page.getByText(label, { exact: true });
  if ((await text.count()) > 0) {
    await text.first().click();
    return;
  }

  const radio = page.getByRole("radio", { name: label });
  if ((await radio.count()) === 1) {
    await radio.check({ force: true });
    return;
  }

  throw new Error(`Could not find navigation item: ${label}`);
}

async function captureScreenshots(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    colorScheme: "light",
  });

  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".stApp", { timeout: 30000 });
  await removeCaptureChrome(page);
  await settle(page);

  for (const state of STATES) {
    await clickNavigation(page, state.nav);
    await page.getByText(state.waitFor, { exact: false }).first().waitFor({ state: "visible", timeout: 30000 });
    await settle(page);
    await removeCaptureChrome(page);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, state.file),
      fullPage: false,
      scale: "device",
    });
    console.log(`Captured ${state.file}`);
  }

  await browser.close();
  await fs.copyFile(path.join(OUTPUT_DIR, "hero.png"), path.join(OUTPUT_DIR, "demo-poster.png"));
}

async function createVideo() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: VIDEO.width, height: VIDEO.height } });
  const slides = await Promise.all(
    STATES.map(async (state) => ({
      title: state.title,
      dataUrl: `data:image/png;base64,${await fs.readFile(path.join(OUTPUT_DIR, state.file), "base64")}`,
    })),
  );

  const result = await page.evaluate(
    async ({ slides, video }) => {
      const mimeType = MediaRecorder.isTypeSupported("video/mp4") ? "video/mp4" : "video/webm;codecs=vp9";

      const canvas = document.createElement("canvas");
      canvas.width = video.width;
      canvas.height = video.height;
      document.body.appendChild(canvas);
      const ctx = canvas.getContext("2d");
      const stream = canvas.captureStream(video.fps);
      const chunks = [];
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 1500000,
      });

      function loadImage(src) {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      }

      function drawImage(img, alpha = 1) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#f7faf7";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const width = img.width * scale;
        const height = img.height * scale;
        ctx.drawImage(img, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
        ctx.restore();
      }

      function frame() {
        return new Promise((resolve) => requestAnimationFrame(resolve));
      }

      async function hold(img, seconds) {
        const frames = Math.round(seconds * video.fps);
        for (let i = 0; i < frames; i += 1) {
          drawImage(img);
          await frame();
        }
      }

      async function fade(from, to, seconds) {
        const frames = Math.round(seconds * video.fps);
        for (let i = 0; i < frames; i += 1) {
          const t = i / Math.max(1, frames - 1);
          drawImage(from, 1);
          drawImage(to, t);
          await frame();
        }
      }

      const images = [];
      for (const slide of slides) {
        images.push(await loadImage(slide.dataUrl));
      }

      const stopped = new Promise((resolve) => {
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        };
        recorder.onstop = resolve;
      });

      recorder.start();
      await hold(images[0], 2.3);
      for (let i = 1; i < images.length; i += 1) {
        await fade(images[i - 1], images[i], 0.55);
        await hold(images[i], 2.45);
      }
      recorder.stop();
      await stopped;

      const blob = new Blob(chunks, { type: mimeType });
      const buffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
      return { base64: btoa(binary), mimeType };
    },
    { slides, video: VIDEO },
  );

  await browser.close();
  const targetPath = path.join(OUTPUT_DIR, "demo.mp4");
  if (result.mimeType === "video/mp4") {
    await fs.writeFile(targetPath, Buffer.from(result.base64, "base64"));
  } else {
    const webmPath = path.join(OUTPUT_DIR, "demo-source.webm");
    await fs.writeFile(webmPath, Buffer.from(result.base64, "base64"));
    try {
      await execFileAsync("ffmpeg", [
        "-y",
        "-i",
        webmPath,
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        "-crf",
        "24",
        "-preset",
        "veryfast",
        targetPath,
      ]);
    } catch (error) {
      throw new Error("MP4 recording is not supported and ffmpeg was not available to convert WebM output.");
    } finally {
      await fs.rm(webmPath, { force: true });
    }
  }
  console.log("Captured demo.mp4");
}

async function main() {
  const options = parseArgs();
  let server;
  if (options.startServer) {
    server = startStreamlit(options.python);
  }

  await prepareOutput();
  await waitForServer(options.url);
  await captureScreenshots(options.url);
  if (!options.skipVideo) {
    await createVideo();
  }

  if (server) {
    server.kill();
  }

  console.log(`Media saved to ${path.relative(ROOT, OUTPUT_DIR)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
