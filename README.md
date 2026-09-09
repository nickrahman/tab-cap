# Tab Cap

Tab Cap is a tiny, local-first Chrome extension that keeps you from opening more than 5 unpinned tabs across all browser windows.

When you try to open tab 6, Tab Cap closes the new tab, briefly shows a small browser popup, and plays a short beep. Pinned tabs do not count toward the limit.

## Install

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select this repository's folder.

Chrome keeps the locally loaded extension installed. If you edit a file later, return to `chrome://extensions` and click the reload button on the Tab Cap card.

## Change the limit

Edit `MAX_TABS` at the top of `background.js`, then reload the extension from `chrome://extensions`.

## Privacy

Tab Cap runs entirely on your computer. It has no analytics, network requests, remote code, settings service, or access to page contents, URLs, or browsing history.

It requests only these Chrome permissions:

- `offscreen` to play the warning beep from a hidden local page.

The warning popup uses Chrome's built-in extension window API and does not require an additional permission.

The source is deliberately small enough to inspect yourself.

## Browser support

Tab Cap targets Chrome 116 or newer. It is not packaged for Firefox or Safari.
