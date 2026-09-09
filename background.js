const MAX_TABS = 5;
const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";

let creatingOffscreenDocument;
let warningWindowId;

chrome.tabs.onCreated.addListener(async (newTab) => {
  const tabs = await chrome.tabs.query({ windowType: "normal" });
  const unpinnedTabs = tabs.filter((tab) => !tab.pinned);

  if (unpinnedTabs.length <= MAX_TABS || newTab.id === undefined) {
    return;
  }

  await chrome.tabs.remove(newTab.id);

  await Promise.allSettled([
    showWarningPopup(),
    playWarningSound()
  ]);
});

chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === warningWindowId) {
    warningWindowId = undefined;
  }
});

async function showWarningPopup() {
  if (warningWindowId !== undefined) {
    try {
      await chrome.windows.update(warningWindowId, { focused: true });
      return;
    } catch {
      warningWindowId = undefined;
    }
  }

  const warningWindow = await chrome.windows.create({
    url: chrome.runtime.getURL("warning.html"),
    type: "popup",
    focused: true,
    width: 380,
    height: 230
  });

  warningWindowId = warningWindow?.id;
}

async function playWarningSound() {
  await ensureOffscreenDocument();
  await chrome.runtime.sendMessage({ target: "offscreen", type: "beep" });
}

async function ensureOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    return;
  }

  if (!creatingOffscreenDocument) {
    creatingOffscreenDocument = chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: ["AUDIO_PLAYBACK"],
      justification: "Play a warning sound when the tab limit is exceeded."
    });
  }

  try {
    await creatingOffscreenDocument;
  } finally {
    creatingOffscreenDocument = undefined;
  }
}
