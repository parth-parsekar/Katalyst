// Content script running on YouTube pages to get live playback timestamp
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_YOUTUBE_TIMESTAMP') {
    const video = document.querySelector('video');
    if (video && !isNaN(video.currentTime)) {
      const totalSeconds = Math.floor(video.currentTime);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const formatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      sendResponse({ timestamp: formatted, rawSeconds: totalSeconds });
    } else {
      sendResponse({ timestamp: null, error: 'No video element found or video not playing' });
    }
  }
  return true;
});
