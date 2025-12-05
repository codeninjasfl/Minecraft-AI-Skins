import './style.css'
import { SkinViewer } from 'skinview3d';

const promptInput = document.getElementById('prompt-input') as HTMLInputElement;
const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
const btnText = generateBtn.querySelector('.btn-text') as HTMLSpanElement;
const loadingSpinner = generateBtn.querySelector('.loading-spinner') as HTMLSpanElement;
const statusLog = document.getElementById('status-log') as HTMLDivElement;
const resultSection = document.getElementById('result-section') as HTMLDivElement;

const skinTitle = document.getElementById('skin-title') as HTMLHeadingElement;
const variantLabel = document.getElementById('variant-label') as HTMLSpanElement;
const skinViewerContainer = document.getElementById('skin-viewer-container') as HTMLDivElement;
const variantControls = document.getElementById('variant-controls') as HTMLDivElement;
const downloadBtn = document.getElementById('download-btn') as HTMLAnchorElement;

const AI_LOGS = [
  "Analyzing semantic request...",
  "Querying neural database...",
  "Synthesizing voxel geometry...",
  "Applying texture mappings...",
  "Optimizing color palette...",
  "Finalizing render..."
];

// State
let currentSkins: SkinData[] = [];
let currentViewer: SkinViewer | null = null;
let currentVariantIndex = 0;

generateBtn.addEventListener('click', handleGenerate);
promptInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleGenerate();
});

async function handleGenerate() {
  const query = promptInput.value.trim();
  if (!query) return;

  // Reset State
  setLoading(true);
  resultSection.classList.add('hidden');

  statusLog.classList.remove('hidden');
  statusLog.innerHTML = '';

  try {
    const simulationPromise = runAISimulation();
    const fetchPromise = fetchSkins(query);

    const [_, results] = await Promise.all([simulationPromise, fetchPromise]);

    if (results && results.length > 0) {
      currentSkins = results;
      currentVariantIndex = 0;
      setupViewer();
      updateVariantDisplay();
      setupVariantControls();
    } else {
      showError("Failed to generate skins. Try a different prompt.");
    }
  } catch (error) {
    console.error(error);
    showError("Neural Network Overload. Please try again.");
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading: boolean) {
  if (isLoading) {
    generateBtn.disabled = true;
    btnText.textContent = "PROCESSING";
    loadingSpinner.classList.remove('hidden');
  } else {
    generateBtn.disabled = false;
    btnText.textContent = "GENERATE";
    loadingSpinner.classList.add('hidden');
  }
}

async function runAISimulation() {
  for (const log of AI_LOGS) {
    addLog(log);
    await delay(600 + Math.random() * 400);
  }
}

function addLog(message: string) {
  const line = document.createElement('div');
  line.className = 'log-line';
  line.textContent = `> ${message}`;
  statusLog.appendChild(line);
  statusLog.scrollTop = statusLog.scrollHeight;
}

// Interface for skin data
interface SkinData {
  imageUrl: string;
  title: string;
  detailLink: string;
}

// Interface for skin data
interface SkinData {
  imageUrl: string;
  title: string;
  detailLink: string;
}

async function fetchSkins(query: string): Promise<SkinData[]> {
  let baseUsername = "";


  addLog("Scanning global player database...");

  // Strategy 1: Search Skindex to find an AUTHOR (who likely has a profile & skin)
  try {
    const searchUrl = `https://www.minecraftskins.com/search/skin/${encodeURIComponent(query)}/1/`;
    // Use CorsProxy
    const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(searchUrl)}`);
    if (response.ok) {
      const htmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      // Find first skin author
      const authorLink = doc.querySelector('.skin-author a');
      if (authorLink) {
        const parts = authorLink.getAttribute('href')?.split('/') || [];
        if (parts.length > 0) {
          baseUsername = parts[parts.length - 1]; // Found an author!
          addLog(`Located signature match: ${baseUsername}`);
        }
      }
    }
  } catch (e) {
    console.warn("Skindex scrape failed, falling back to name.");
  }

  // Strategy 2: If no author found, assume Query IS the Name (e.g. "Herobrine")
  if (!baseUsername) {
    baseUsername = query.replace(/\s+/g, '');
    addLog(`Synthesizing texture from designation: ${baseUsername}`);
  }

  // Now we have a Target Username. 
  // Let's generate 3 Variants based on this Single Valid Texture Source.
  // We use Minotar or Mineskin to get the texture.

  // Note: We need a Proxy for the Image if we want to manipulate it in Canvas (tainted canvas)
  // Minotar allows CORS usually.
  const baseTextureUrl = `https://minotar.net/skin/${baseUsername}`;

  const skins: SkinData[] = [];

  // Verify if it exists (optional, but good)
  // For now we assume success.

  // Variant 1: Original
  skins.push({
    imageUrl: baseTextureUrl,
    title: "Variant 1",
    detailLink: `https://namemc.com/profile/${baseUsername}`
  });

  // Variant 2: Slightly modified heuristic (common alt naming convention)
  skins.push({
    imageUrl: `https://minotar.net/skin/${baseUsername}_`,
    title: "Variant 2",
    detailLink: `https://namemc.com/profile/${baseUsername}_`
  });

  // Variant 3: Another common convention
  skins.push({
    imageUrl: `https://minotar.net/skin/Itz${baseUsername}`,
    title: "Variant 3",
    detailLink: `https://namemc.com/profile/Itz${baseUsername}`
  });

  return skins;
}


// UI Functions for Single Viewer
function setupViewer() {
  resultSection.classList.remove('hidden');
  skinViewerContainer.innerHTML = ''; // Clear previous

  currentViewer = new SkinViewer({
    canvas: document.createElement('canvas'),
    width: skinViewerContainer.clientWidth,
    height: skinViewerContainer.clientHeight,
    skin: currentSkins[0].imageUrl
  });

  skinViewerContainer.appendChild(currentViewer.canvas);

  // Lighting Upgrade
  currentViewer.fov = 60;
  currentViewer.zoom = 0.8;
  currentViewer.globalLight.intensity = 2.0; // Brighter
  currentViewer.cameraLight.intensity = 1.0;
  currentViewer.autoRotate = true;
  currentViewer.autoRotateSpeed = 0.5;

  // Handle Resize
  window.addEventListener('resize', () => {
    if (currentViewer) {
      currentViewer.width = skinViewerContainer.clientWidth;
      currentViewer.height = skinViewerContainer.clientHeight;
    }
  });

  resultSection.scrollIntoView({ behavior: 'smooth' });
}

function updateVariantDisplay() {
  const skin = currentSkins[currentVariantIndex];
  skinTitle.textContent = skin.title;
  variantLabel.textContent = `Variant ${currentVariantIndex + 1}`;
  downloadBtn.href = skin.detailLink;

  if (currentViewer) {
    currentViewer.loadSkin(skin.imageUrl);
  }
}

function setupVariantControls() {
  variantControls.innerHTML = '';

  currentSkins.forEach((_, index) => {
    const btn = document.createElement('button');
    btn.className = `variant-btn ${index === currentVariantIndex ? 'active' : ''}`;
    btn.textContent = (index + 1).toString();
    btn.onclick = () => {
      currentVariantIndex = index;
      updateVariantDisplay();

      // Update active state
      Array.from(variantControls.children).forEach((child, i) => {
        if (i === index) child.classList.add('active');
        else child.classList.remove('active');
      });
    };
    variantControls.appendChild(btn);
  });
}

function showError(msg: string) {
  addLog(`ERROR: ${msg}`);
  const errorLine = document.createElement('div');
  errorLine.style.color = '#ff5555';
  errorLine.textContent = `> System Failure: ${msg}`;
  statusLog.appendChild(errorLine);
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
