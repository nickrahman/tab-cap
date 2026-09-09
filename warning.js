async function centerWindow() {
  const currentWindow = await chrome.windows.getCurrent();

  if (currentWindow.id === undefined) {
    return;
  }

  const left = Math.round(
    window.screen.availLeft + (window.screen.availWidth - window.outerWidth) / 2
  );
  const top = Math.round(
    window.screen.availTop + (window.screen.availHeight - window.outerHeight) / 2
  );

  await chrome.windows.update(currentWindow.id, { left, top });
}

void centerWindow();
setTimeout(() => window.close(), 2500);
