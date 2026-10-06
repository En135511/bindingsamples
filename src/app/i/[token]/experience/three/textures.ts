import * as THREE from "three";

/** The font family next/font registered for a CSS variable, e.g. --font-great-vibes. */
function fontFamily(cssVar: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return value || fallback;
}

/**
 * A texture drawn on a canvas. `waitFor` lists things (fonts, images) to wait for; the
 * texture is drawn immediately and again once they are ready.
 */
function canvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
  waitFor: Promise<unknown>[] = [],
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const render = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    draw(ctx);
    ctx.restore();
    texture.needsUpdate = true;
  };
  render();
  Promise.allSettled(waitFor).then(render);
  return texture;
}

const loadFont = (font: string) => document.fonts.load(font);

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function foil(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, "#a87c27");
  g.addColorStop(0.22, "#f3e0a6");
  g.addColorStop(0.4, "#c9a24d");
  g.addColorStop(0.55, "#fff3c4");
  g.addColorStop(0.75, "#b8892e");
  g.addColorStop(1, "#e9cf86");
  return g;
}

function drawMortarboard(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string | CanvasGradient) {
  const s = size / 64;
  ctx.save();
  ctx.translate(cx - 32 * s, cy - 32 * s);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.fill(new Path2D("M32 12 4 24l28 12 28-12-28-12Z"));
  ctx.fill(new Path2D("M16 30v11c0 4 7.2 8 16 8s16-4 16-8V30l-16 7-16-7Z"));
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.stroke(new Path2D("M56 26v14"));
  ctx.beginPath();
  ctx.arc(56, 43, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Two arcs of pointed leaves around a circle — the graduate's laurel. */
function drawLaurel(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string | CanvasGradient) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI / 2 + side * 0.25, Math.PI / 2 + side * 2.6, side < 0);
    ctx.stroke();
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + side * (0.42 + i * 0.235);
      const len = r * (0.2 - i * 0.006);
      ctx.save();
      ctx.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      // Along the wreath (tangent), tipped slightly outward.
      ctx.rotate(a + side * -0.4);
      ctx.beginPath();
      ctx.moveTo(0, -len);
      ctx.quadraticCurveTo(len * 0.5, 0, 0, len);
      ctx.quadraticCurveTo(-len * 0.5, 0, 0, -len);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawCorner(ctx: CanvasRenderingContext2D, x: number, y: number, sx: number, sy: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, sy);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.lineTo(0, 0);
  ctx.lineTo(size, 0);
  ctx.moveTo(12, size * 0.7);
  ctx.quadraticCurveTo(12, 12, size * 0.7, 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(22, 22, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** The front of the card that flies out: personal, with the graduate's photo. */
export function cardFront(opts: { classYear: string | null; honoreeName: string; photoUrl: string | null }) {
  const w = 1200;
  const h = 780;
  const script = fontFamily("--font-great-vibes", "cursive");
  const serif = fontFamily("--font-playfair", "serif");
  const sans = fontFamily("--font-inter", "sans-serif");
  let photo: HTMLImageElement | null = null;
  const photoReady = opts.photoUrl
    ? loadImage(opts.photoUrl).then((img) => {
        photo = img;
      })
    : Promise.resolve();

  return canvasTexture(
    w,
    h,
    (ctx) => {
      // Ivory paper with a soft warm vignette
      const bg = ctx.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, w * 0.7);
      bg.addColorStop(0, "#fffdf8");
      bg.addColorStop(1, "#f3e9d2");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const gold = foil(ctx, 0, 0, w, h);
      ctx.strokeStyle = gold;
      ctx.fillStyle = gold;
      ctx.lineWidth = 10;
      ctx.strokeRect(30, 30, w - 60, h - 60);
      ctx.lineWidth = 2.5;
      ctx.strokeRect(52, 52, w - 104, h - 104);
      const c = 70;
      drawCorner(ctx, c, c, 1, 1, 90);
      drawCorner(ctx, w - c, c, -1, 1, 90);
      drawCorner(ctx, c, h - c, 1, -1, 90);
      drawCorner(ctx, w - c, h - c, -1, -1, 90);

      const hasPhoto = !!photo;
      const textX = hasPhoto ? 780 : w / 2;
      if (photo) {
        const px = 330;
        const py = h / 2;
        const r = 175;
        drawLaurel(ctx, px, py + 10, r + 40, gold);
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.clip();
        const scale = Math.max((2 * r) / photo.width, (2 * r) / photo.height);
        const iw = photo.width * scale;
        const ih = photo.height * scale;
        // Bias the crop upward so faces stay in the circle.
        ctx.drawImage(photo, px - iw / 2, py - ih * 0.38, iw, ih);
        ctx.restore();
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        drawMortarboard(ctx, textX, 170, 120, gold);
      }

      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      if (opts.classYear) {
        ctx.fillStyle = "#a87c27";
        ctx.font = `600 26px ${sans}`;
        ctx.letterSpacing = "10px";
        ctx.fillText(`THE CLASS OF ${opts.classYear}`, textX + 5, hasPhoto ? 230 : 290);
        ctx.letterSpacing = "0px";
      }
      ctx.fillStyle = "#1b2a52";
      ctx.font = `120px ${script}`;
      ctx.fillText("You're invited", textX, hasPhoto ? 380 : 420);

      ctx.fillStyle = "#5b5040";
      ctx.font = `italic 30px ${serif}`;
      ctx.fillText("to celebrate the graduation of", textX, hasPhoto ? 455 : 495);

      let size = 58;
      ctx.font = `600 ${size}px ${serif}`;
      const maxWidth = hasPhoto ? 640 : 1000;
      while (ctx.measureText(opts.honoreeName).width > maxWidth && size > 30) {
        size -= 2;
        ctx.font = `600 ${size}px ${serif}`;
      }
      const deep = ctx.createLinearGradient(textX - maxWidth / 2, 0, textX + maxWidth / 2, 0);
      deep.addColorStop(0, "#6e4f12");
      deep.addColorStop(0.35, "#a87c27");
      deep.addColorStop(0.5, "#c9a24d");
      deep.addColorStop(0.65, "#8a6420");
      deep.addColorStop(1, "#6e4f12");
      ctx.fillStyle = deep;
      ctx.fillText(opts.honoreeName, textX, hasPhoto ? 545 : 585);
    },
    [
      loadFont(`120px ${script}`),
      loadFont(`italic 30px ${serif}`),
      loadFont(`600 58px ${serif}`),
      loadFont(`600 26px ${sans}`),
      photoReady,
    ],
  );
}

/** The back of the card: rich gold foil with a lattice and a crest. */
export function cardBack() {
  const w = 1200;
  const h = 780;
  return canvasTexture(w, h, (ctx) => {
    ctx.fillStyle = foil(ctx, 0, 0, w, h);
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(120, 85, 20, 0.35)";
    ctx.lineWidth = 2;
    for (let x = -h; x < w + h; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + h, h);
      ctx.moveTo(x + h, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    ctx.fillStyle = "#fffaf0";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#a87c27";
    ctx.lineWidth = 8;
    ctx.stroke();
    drawMortarboard(ctx, w / 2, h / 2 + 6, 170, "#1b2a52");
  });
}

/** The face of the wax seal: navy wax with an embossed gold cap. */
export function sealFace() {
  const size = 512;
  return canvasTexture(size, size, (ctx) => {
    const c = size / 2;
    const bg = ctx.createRadialGradient(c * 0.75, c * 0.65, 20, c, c, c);
    bg.addColorStop(0, "#3a5596");
    bg.addColorStop(0.6, "#1d2f63");
    bg.addColorStop(1, "#101b3d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
    ctx.lineWidth = 12;
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.arc(c - 3, c - 3, c * 0.74, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.arc(c + 3, c + 3, c * 0.74, 0, Math.PI * 2);
    ctx.stroke();
    drawMortarboard(ctx, c + 5, c + 7, 250, "rgba(0,0,0,0.45)");
    drawMortarboard(ctx, c, c + 2, 250, foil(ctx, c - 120, c - 120, c + 120, c + 120));
  });
}

/** The guest's name written on the front of the envelope. */
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
      ctx.fillStyle = "#1b2a52";
      ctx.fillText(name, w / 2, h / 2);
    },
    [loadFont(`150px ${script}`)],
  );
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

/** A soft round glow. */
export function glow() {
  const size = 256;
  return canvasTexture(size, size, (ctx) => {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255, 246, 214, 1)");
    g.addColorStop(0.35, "rgba(246, 214, 130, 0.6)");
    g.addColorStop(1, "rgba(246, 214, 130, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  });
}

/** A diagonal band of light, slid across the card for a glossy shine. */
export function shineBand() {
  const w = 1024;
  const h = 256;
  const texture = canvasTexture(w, h, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.42, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,0.9)");
    g.addColorStop(0.58, "rgba(255,255,255,0)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  texture.wrapS = THREE.ClampToEdgeWrapping;
  return texture;
}
