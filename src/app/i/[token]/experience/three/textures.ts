import * as THREE from "three";

/** The font family next/font registered for a CSS variable, e.g. --font-great-vibes. */
function fontFamily(cssVar: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return value || fallback;
}

function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void, fonts: string[] = []) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const render = () => {
    ctx.clearRect(0, 0, width, height);
    draw(ctx);
    texture.needsUpdate = true;
  };
  render();
  // Redraw once the web fonts are ready (the first draw may use a fallback font).
  Promise.all(fonts.map((f) => document.fonts.load(f))).then(render, () => {});
  return texture;
}

function goldGradient(ctx: CanvasRenderingContext2D, x0: number, x1: number) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, "#a8822f");
  g.addColorStop(0.35, "#f3e6c0");
  g.addColorStop(0.55, "#c9a24d");
  g.addColorStop(0.75, "#ead39a");
  g.addColorStop(1, "#a8822f");
  return g;
}

function drawMortarboard(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  const s = size / 64;
  ctx.save();
  ctx.translate(cx - 32 * s, cy - 32 * s);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.fill(new Path2D("M32 12 4 24l28 12 28-12-28-12Z"));
  ctx.globalAlpha = 0.85;
  ctx.fill(new Path2D("M16 30v11c0 4 7.2 8 16 8s16-4 16-8V30l-16 7-16-7Z"));
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.stroke(new Path2D("M56 26v14"));
  ctx.beginPath();
  ctx.arc(56, 43, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Fine random grain, used as a bump map so the paper doesn't look like plastic. */
export function paperGrain() {
  const size = 256;
  const texture = canvasTexture(size, size, (ctx) => {
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 110 + Math.random() * 40;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  });
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

/** The face of the card inside the envelope. */
export function cardFace(classYear: string | null) {
  const w = 1024;
  const h = 660;
  const script = fontFamily("--font-great-vibes", "cursive");
  const sans = fontFamily("--font-inter", "sans-serif");
  return canvasTexture(
    w,
    h,
    (ctx) => {
      ctx.fillStyle = "#fbf7ee";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#c9a24d";
      ctx.lineWidth = 3;
      ctx.strokeRect(28, 28, w - 56, h - 56);
      ctx.lineWidth = 6;
      ctx.strokeRect(44, 44, w - 88, h - 88);
      drawMortarboard(ctx, w / 2, 190, 120, "#c9a24d");
      ctx.textAlign = "center";
      ctx.fillStyle = "#0e1b3a";
      ctx.font = `130px ${script}`;
      ctx.fillText("You're invited", w / 2, 390);
      if (classYear) {
        ctx.fillStyle = "#a8822f";
        ctx.font = `500 30px ${sans}`;
        ctx.letterSpacing = "12px";
        ctx.fillText(`THE CLASS OF ${classYear}`.toUpperCase(), w / 2 + 6, 500);
      }
    },
    [`130px ${script}`, `500 30px ${sans}`],
  );
}

/** The guest's name written on the front of the envelope in gold script. */
export function envelopeName(name: string) {
  const w = 1200;
  const h = 260;
  const script = fontFamily("--font-great-vibes", "cursive");
  return canvasTexture(
    w,
    h,
    (ctx) => {
      let size = 150;
      ctx.font = `${size}px ${script}`;
      while (ctx.measureText(name).width > w - 80 && size > 50) {
        size -= 6;
        ctx.font = `${size}px ${script}`;
      }
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = goldGradient(ctx, 100, w - 100);
      ctx.fillText(name, w / 2, h / 2);
    },
    [`150px ${script}`],
  );
}

/** The face of the wax seal: brushed gold with an embossed graduation cap. */
export function sealFace() {
  const size = 512;
  return canvasTexture(size, size, (ctx) => {
    const c = size / 2;
    const bg = ctx.createRadialGradient(c * 0.7, c * 0.6, 20, c, c, c);
    bg.addColorStop(0, "#f6e3ae");
    bg.addColorStop(0.55, "#d6ad57");
    bg.addColorStop(1, "#9c7428");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
    // Raised rim
    ctx.lineWidth = 14;
    ctx.strokeStyle = "rgba(255,240,200,0.75)";
    ctx.beginPath();
    ctx.arc(c - 3, c - 3, c * 0.78, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(110,80,25,0.6)";
    ctx.beginPath();
    ctx.arc(c + 3, c + 3, c * 0.78, 0, Math.PI * 2);
    ctx.stroke();
    // Embossed cap: dark edge, light edge, then the face
    drawMortarboard(ctx, c + 5, c + 7, 260, "rgba(90,62,18,0.75)");
    drawMortarboard(ctx, c - 4, c - 4, 260, "rgba(255,245,215,0.85)");
    drawMortarboard(ctx, c, c + 2, 260, "#c39a45");
  });
}
