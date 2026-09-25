/**
 * ICT Assistant Service Worker (Background)
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('[ICT Assistant] Chrome Extension installed successfully.');
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'ICT_PROBE_DATA') {
    console.log('[Background] Received probe data from content script:', message.payload);
    // Persist latest probe status into Chrome Storage
    chrome.storage.local.set({ lastProbeData: message.payload });
    sendResponse({ status: 'OK' });
  }
  return true;
});
