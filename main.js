const introScreen = document.getElementById('introScreen');
const startBtn = document.getElementById('startBtn');
const gameContainer = document.getElementById('gameContainer');
const webcam = document.getElementById('webcam');
const canvas = document.getElementById('output');
const canvasCtx = canvas.getContext('2d');
const gestureDisplay = document.getElementById('gestureDisplay');
const healthBar = document.getElementById('healthFill');
const aiCharacter = document.getElementById('aiCharacter');

// Optional: sounds
const punchSound = new Audio('sounds/punch.mp3');
const chargeSound = new Audio('sounds/charge.mp3');
const vSignSound = new Audio('sounds/vsign.mp3');

let aiHealth = 100;

startBtn.addEventListener('click', () => {
  introScreen.style.display = 'none';
  gameContainer.style.display = 'flex';
  initCamera();  // <-- crucial
});

// MediaPipe Hands Setup
const hands = new Hands({
  locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});
hands.onResults(onResults);

// Camera start
function initCamera() {
  const camera = new Camera(webcam, {
    onFrame: async () => {
      await hands.send({ image: webcam });
    },
    width: 640,
    height: 480
  });
  camera.start();
}

// Gesture detection logic
function detectGesture(landmarks) {
  const tips = [4, 8, 12, 16, 20];
  const bases = [2, 6, 10, 14, 18];
  let fingers = [];

  fingers.push(landmarks[4].x > landmarks[3].x ? 1 : 0);
  for (let i = 1; i < 5; i++) {
    fingers.push(landmarks[tips[i]].y < landmarks[bases[i]].y ? 1 : 0);
  }

  if (fingers.every(f => f === 0)) return "FIST";
  if (fingers.every(f => f === 1)) return "OPEN";
  if (fingers[1] === 1 && fingers[2] === 1 && fingers[3] === 0 && fingers[4] === 0) return "V_SIGN";

  return "UNKNOWN";
}

// Handle detection results
function onResults(results) {
  canvas.width = webcam.videoWidth;
  canvas.height = webcam.videoHeight;
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  canvasCtx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00ffae', lineWidth: 4 });
      drawLandmarks(canvasCtx, landmarks, { color: '#ff00d4', lineWidth: 2 });

      const gesture = detectGesture(landmarks);
      gestureDisplay.innerText = `Gesture: ${gesture}`;
      updateGameLogic(gesture);
    }
  }

  canvasCtx.restore();
}

// Apply game logic
function updateGameLogic(gesture) {
  if (gesture === "FIST") {
    punchSound?.play();
    aiHealth = Math.max(0, aiHealth - 10);
    aiCharacter.classList.add('shake');
    setTimeout(() => aiCharacter.classList.remove('shake'), 300);
  } else if (gesture === "OPEN") {
    chargeSound?.play();
    aiCharacter.classList.add('glow');
    setTimeout(() => aiCharacter.classList.remove('glow'), 500);
  } else if (gesture === "V_SIGN") {
    vSignSound?.play();
    aiCharacter.style.opacity = 0.5;
    setTimeout(() => aiCharacter.style.opacity = 1, 300);
  }

  healthBar.style.width = `${aiHealth}%`;
}

