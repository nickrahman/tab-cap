const MAX_TABS = 5;
const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";
const WARNING_WINDOW_WIDTH = 380;
const WARNING_WINDOW_HEIGHT = 230;

let creatingOffscreenDocument;
let warningWindowId;

chrome.tabs.onCreated.addListener(async (newTab) => {
  const tabs = await chrome.tabs.query({ windowType: "normal" });
  const unpinnedTabs = tabs.filter((tab) => !tab.pinned);

  if (unpinnedTabs.length <= MAX_TABS || newTab.id === undefined) {
    return;
  }

  const warningWindowBounds = await getWarningWindowBounds(newTab.windowId);
  await chrome.tabs.remove(newTab.id);

  await Promise.allSettled([
    showWarningPopup(warningWindowBounds),
    playWarningSound()
  ]);
});

chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === warningWindowId) {
    warningWindowId = undefined;
  }
});

async function getWarningWindowBounds(sourceWindowId) {
  const [sourceWindow, displays] = await Promise.all([
    chrome.windows.get(sourceWindowId),
    chrome.system.display.getInfo()
  ]);
  const sourceCenter = {
    x: (sourceWindow.left ?? 0) + (sourceWindow.width ?? 0) / 2,
    y: (sourceWindow.top ?? 0) + (sourceWindow.height ?? 0) / 2
  };
  const sourceDisplay = displays.find(({ bounds }) =>
    sourceCenter.x >= bounds.left &&
    sourceCenter.x < bounds.left + bounds.width &&
    sourceCenter.y >= bounds.top &&
    sourceCenter.y < bounds.top + bounds.height
  );
  const display = sourceDisplay ?? displays.find(({ isPrimary }) => isPrimary);

  if (!display) {
    return {};
  }

  return {
    left: Math.round(
      display.workArea.left +
      (display.workArea.width - WARNING_WINDOW_WIDTH) / 2
    ),
    top: Math.round(
      display.workArea.top +
      (display.workArea.height - WARNING_WINDOW_HEIGHT) / 2
    )
  };
}

async function showWarningPopup(bounds) {
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
    width: WARNING_WINDOW_WIDTH,
    height: WARNING_WINDOW_HEIGHT,
    ...bounds
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
