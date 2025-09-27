import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";

/* State */
let originalFile = null;
let originalImage = null;
let slices = []; // {blob, url, width, height, name}

/* Elements */
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const browseBtn = document.getElementById("browseBtn");
const btnSlice = document.getElementById("btnSlice");
const btnZip = document.getElementById("btnZip");
const btnPDF = document.getElementById("btnPDF");
const btnReset = document.getElementById("btnReset");
const info = document.getElementById("info");
const grid = document.getElementById("grid");

/* Helpers */
const pad2 = n => n.toString().padStart(2, "0");
const baseName = file => {
  const n = file.name || "image";
  const dot = n.lastIndexOf(".");
  return dot > 0 ? n.slice(0, dot) : n;
};
function enableActions(hasImage, hasSlices) {
  btnSlice.disabled = !hasImage;
  btnZip.disabled = !hasSlices;
  btnPDF.disabled = !hasSlices;
  btnReset.disabled = !(hasImage || hasSlices);
}

function revokeSliceURLs() {
  for (const s of slices) URL.revokeObjectURL(s.url);
}

/* Loaders */
function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = e => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

/* UI */
function clearPreview() {
  grid.innerHTML = "";
  info.textContent = "尚未上傳檔案";
  revokeSliceURLs();
  slices = [];
  enableActions(false, false);
}

function renderSlices() {
  grid.innerHTML = "";
  if (!slices.length) {
    info.textContent = "尚未切割";
    return;
  }
  info.textContent = `已切割 ${slices.length} 張（2:3）`;
  for (const s of slices) {
    const card = document.createElement("div");
    card.className = "card";
    const thumb = document.createElement("div");
    thumb.className = "thumb-wrap";
    const img = document.createElement("img");
    img.src = s.url;
    img.alt = s.name;
    thumb.appendChild(img);

    const meta = document.createElement("div");
    meta.className = "meta";
    const fn = document.createElement("div");
    fn.className = "filename";
    fn.textContent = s.name;
    const dim = document.createElement("div");
    dim.className = "dim";
    dim.textContent = `${s.width}×${s.height}`;
    meta.appendChild(fn);
    meta.appendChild(dim);

    card.appendChild(thumb);
    card.appendChild(meta);
    grid.appendChild(card);
  }
}

/* Core slicing: portrait 2:3 using full image width */
async function sliceImage(img, filenameBase) {
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  const sliceH = Math.round((width * 3) / 2); // 2:3 -> H = W * 3/2

  const slicesOut = [];
  if (height <= sliceH) {
    const blob = await drawToBlob(img, 0, 0, width, height);
    const url = URL.createObjectURL(blob);
    slicesOut.push({ blob, url, width, height, name: `${filenameBase}_01.png` });
    return slicesOut;
  }

  let y = 0;
  let index = 1;
  while (y + sliceH <= height) {
    const blob = await drawToBlob(img, 0, y, width, sliceH);
    const url = URL.createObjectURL(blob);
    slicesOut.push({ blob, url, width, height: sliceH, name: `${filenameBase}_${pad2(index)}.png` });
    index += 1;
    y += sliceH;
  }

  // Handle remainder: align last slice to bottom to keep full height
  if (y < height) {
    const yStart = Math.max(0, height - sliceH);
    const lastH = Math.min(sliceH, height - yStart);
    const blob = await drawToBlob(img, 0, yStart, width, lastH);
    const url = URL.createObjectURL(blob);
    slicesOut.push({ blob, url, width, height: lastH, name: `${filenameBase}_${pad2(index)}.png` });
  }

  // If the last piece is shorter than sliceH, this is expected due to bottom alignment.
  // Keep as-is to avoid duplicating content.

  // Normalize names to 01..NN even if small count
  const total = slicesOut.length;
  slicesOut.forEach((s, i) => {
    const num = pad2(i + 1);
    s.name = `${filenameBase}_${num}.png`;
  });

  return slicesOut;
}

function drawToBlob(img, sx, sy, sw, sh) {
  return new Promise(resolve => {
    const c = document.createElement("canvas");
    c.width = sw;
    c.height = sh;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    c.toBlob(b => resolve(b), "image/png");
  });
}

/* Downloads */
async function downloadZip() {
  const zip = new JSZip();
  const folder = zip.folder(baseName(originalFile)) || zip;
  for (const s of slices) {
    const arrBuf = await s.blob.arrayBuffer();
    folder.file(s.name, arrBuf);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, `${baseName(originalFile)}_slices.zip`);
}

async function downloadPDF() {
  const pdfDoc = await PDFDocument.create();

  for (const s of slices) {
    const bytes = new Uint8Array(await s.blob.arrayBuffer());
    const pngImage = await pdfDoc.embedPng(bytes);

    // Use image pixel dimensions as page size (portrait)
    const page = pdfDoc.addPage([s.width, s.height]);
    page.drawImage(pngImage, { x: 0, y: 0, width: s.width, height: s.height });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  triggerDownload(blob, `${baseName(originalFile)}_slices.pdf`);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* Events */
browseBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", async e => {
  if (!e.target.files || !e.target.files[0]) return;
  await handleFile(e.target.files[0]);
});

["dragenter","dragover"].forEach(evt =>
  dropzone.addEventListener(evt, e => {
    e.preventDefault(); e.stopPropagation();
    dropzone.classList.add("dragover");
  })
);
["dragleave","drop"].forEach(evt =>
  dropzone.addEventListener(evt, e => {
    e.preventDefault(); e.stopPropagation();
    dropzone.classList.remove("dragover");
  })
);
dropzone.addEventListener("drop", async e => {
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (file) await handleFile(file);
});

btnSlice.addEventListener("click", async () => {
  if (!originalImage || !originalFile) return;
  info.textContent = "切割中...";
  slices = await sliceImage(originalImage, baseName(originalFile));
  renderSlices();
  enableActions(true, slices.length > 0);
});

btnZip.addEventListener("click", downloadZip);
btnPDF.addEventListener("click", downloadPDF);
btnReset.addEventListener("click", () => {
  clearPreview();
  originalFile = null;
  originalImage = null;
  fileInput.value = "";
});

/* Main */
async function handleFile(file) {
  if (!file.type.startsWith("image/")) {
    info.textContent = "請上傳圖片檔案";
    return;
  }
  clearPreview();
  originalFile = file;
  originalImage = await loadImageFromFile(file);
  info.textContent = `已載入：${file.name}（${originalImage.naturalWidth}×${originalImage.naturalHeight}）`;
  enableActions(true, false);
}

