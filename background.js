const MAX_TABS = 10;
const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";

let creatingOffscreenDocument;

chrome.tabs.onCreated.addListener(async (newTab) => {
  const tabs = await chrome.tabs.query({});
  const unpinnedTabs = tabs.filter((tab) => !tab.pinned);

  if (unpinnedTabs.length <= MAX_TABS || newTab.id === undefined) {
    return;
  }

  await chrome.tabs.remove(newTab.id);

  await chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: "Tab limit reached",
    message: `You already have ${MAX_TABS} tabs open. Close one first.`
  });

  await ensureOffscreenDocument();
  await chrome.runtime.sendMessage({ target: "offscreen", type: "beep" });
});

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
