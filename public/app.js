	const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const peerConnectionConfig = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

const ws = new WebSocket('ws://localhost:8080');
const peerConnection = new RTCPeerConnection(peerConnectionConfig);

ws.onmessage = async (message) => {
  const signal = JSON.parse(message.data);

  if (signal.offer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    ws.send(JSON.stringify({ answer: answer }));
  } else if (signal.answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.answer));
  } else if (signal.iceCandidate) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(signal.iceCandidate));
  }
};

peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    ws.send(JSON.stringify({ iceCandidate: event.candidate }));
  }
};

peerConnection.ontrack = (event) => {
  remoteVideo.srcObject = event.streams[0];
};

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then((stream) => {
    localVideo.srcObject = stream;
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    
    peerConnection.createOffer()
      .then(offer => peerConnection.setLocalDescription(offer))
      .then(() => ws.send(JSON.stringify({ offer: peerConnection.localDescription })));
  })
  .catch(error => console.error('Error accessing media devices.', error));
