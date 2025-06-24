const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
const output = document.getElementById('output');

let mediaRecorder;
let socket;
let stream;

startBtn.addEventListener('click', async () => {
  const apiKey = 'ed954791428be4efd45e8c113bc0cfa2d711eda5'; // Your Deepgram API Key
  const socketUrl = `wss://api.deepgram.com/v1/listen?punctuate=true`;

  socket = new WebSocket(socketUrl, ['token', apiKey]);

  socket.onopen = async () => {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

    mediaRecorder.ondataavailable = (event) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(event.data);
      }
    };

    mediaRecorder.start(250);
  };

  socket.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    const transcript = data.channel?.alternatives[0]?.transcript;
    if (transcript && data.is_final) {
      output.value += transcript + ' ';
    }
  };

  socket.onerror = (err) => console.error('WebSocket error:', err);
});

stopBtn.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }

  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close();
  }

  console.log('Stopped recording and closed connection.');
});
