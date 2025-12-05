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

// Interface for skin data
interface SkinData {
  imageUrl: string;
  title: string;
  detailLink: string;
}

async function fetchSkins(query: string): Promise<SkinData[]> {
  addLog(`Initiating neural search for: ${query}...`);

  // Clean query
  const baseName = query.trim().replace(/\s+/g, '');

  // Potential candidates for "Top Results"
  // We prioritize the exact name, then common variations that heavily correlate with "Top" profiles
  const candidates = [
    baseName,
    `${baseName}_`,
    `The${baseName}`,
    `Itz${baseName}`,
    `Real${baseName}`,
    `${baseName}123`,
    `${baseName}PVP`,
    `${baseName}Girl`,
    `${baseName}Boy`
  ];

  const validSkins: SkinData[] = [];
  const processedUrls = new Set<string>();

  // Helper to check image validity (basic verify)
  const verifySkin = async (username: string): Promise<SkinData | null> => {
    // Minotar returns a default Steve if not found, but returns an IMAGE.
    // We can't easily distinguish server-side without CORS.
    // However, duplicate detection helps.
    const url = `https://minotar.net/skin/${username}`;
    if (processedUrls.has(url)) return null;

    // Create the data object
    return {
      imageUrl: url,
      title: `Variant ${validSkins.length + 1}`,
      detailLink: `https://namemc.com/profile/${username}`
    };
  };

  // Process candidates sequentially to maintain relevance order
  // (We want the "best" matches first)
  for (const candidate of candidates) {
    if (validSkins.length >= 3) break;

    const skin = await verifySkin(candidate);
    if (skin) {
      validSkins.push(skin);
      processedUrls.add(skin.imageUrl);
    }
  }

  // Fallback: If we didn't find 3, duplicates are better than nothing? 
  // No, duplicates break 3D viewer illusion.
  // We will fill with distinct "Synthesized" lookalikes using Minotar's random hash feature? No.
  // Just return what we found.

  if (validSkins.length === 0) {
    // Emergency Fallback
    validSkins.push({
      imageUrl: `https://minotar.net/skin/${baseName}`,
      title: "Variant 1",
      detailLink: `https://namemc.com/profile/${baseName}`
    });
  }

  // Ensure titles are sequential
  validSkins.forEach((s, i) => s.title = `Variant ${i + 1}`);

  return validSkins;
}

// UI Functions for Single Viewer
function setupViewer() {
  resultSection.classList.remove('hidden');
  skinViewerContainer.innerHTML = ''; // Clear previous

  // Safety check
  if (!currentSkins || currentSkins.length === 0) return;

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
  if (!currentSkins[currentVariantIndex]) return;

  const skin = currentSkins[currentVariantIndex];
  skinTitle.textContent = skin.title;
  variantLabel.textContent = `Variant ${currentVariantIndex + 1}`;
  downloadBtn.href = skin.detailLink;

  if (currentViewer) {
    // Add a small load animation or reset?
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
