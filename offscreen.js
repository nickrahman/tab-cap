chrome.runtime.onMessage.addListener((message) => {
  if (message.target !== "offscreen" || message.type !== "beep") {
    return;
  }

  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.frequency.value = 660;
  gain.gain.value = 0.15;

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();

  setTimeout(() => {
    oscillator.stop();
    void audioContext.close();
  }, 180);
});
