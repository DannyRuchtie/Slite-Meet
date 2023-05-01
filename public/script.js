
let mediaRecorder;
let recordedChunks = [];
let audioBlob;

const { Storage } = require('@google-cloud/storage');
const storage = new Storage({
  keyFilename: 'slite-meet-30d93991103e.json',
  projectId: 'slite-meet',
});


function startRecording(stream) {
  const options = { mimeType: 'audio/webm;codecs=opus' };
  mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.addEventListener('dataavailable', (event) => {
    if (recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: 'audio/webm;codecs=opus' });
      // rest of the code
    } else {
      console.error('No data to send');
    }
  });

  mediaRecorder.start(1000); // Record in 1-second intervals
}


function stopRecording() {
  if (mediaRecorder) {
    mediaRecorder.stop();
    mediaRecorder = null;
  }
}

async function sendAudioToServer() {
  if (recordedChunks.length === 0) {
    console.error("No audio data to send");
    return;
  }

  const blob = new Blob(recordedChunks, { type: 'audio/webm;codecs=opus' });
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = new Uint8Array(arrayBuffer);
  const oggOpusBlob = new Blob([audioBuffer], { type: 'audio/ogg;codecs=opus' });
  const formData = new FormData();
  formData.append("audio", oggOpusBlob);

  try {
    const response = await fetch('/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      console.log(data);
    } else {
      throw new Error('Error occurred while transcribing audio');
    }
  } catch (error) {
    console.error(error);
  }
}





// Create a socket connection to the server
const socket = io("/");

// Get the video grid element from the DOM
const videoGrid = document.getElementById("video-grid");

// Create a new peer object
const myPeer = new Peer(undefined, {});

// Create a new video element
const myVideo = document.createElement("video");

// Set the id of the video element
myVideo.setAttribute("id", "Myface");

// Mute the video element
myVideo.muted = true;

// Create an empty peers object
const peers = {};

// Function to initialize the connections
function initializeConnections() {
  // Get user media (audio and video)
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: true,
    })
    .then((stream) => {
      // Set the peerId property on the stream object
      stream.peerId = myPeer.id;


      // Add the video stream to the video element
      addVideoStream(myVideo, stream);


      // Start recording the audio
      startRecording(stream);

      stopRecording() 
      sendAudioToServer() 

      // Listen for calls from other peers
      myPeer.on("call", (call) => {
        // Answer the call with the local stream
        call.answer(stream);

        // Create a new video element
        const video = document.createElement("video");
        video.classList.add("remoteVideo");

        // Listen for the stream from the remote peer
        call.on("stream", (userVideoStream) => {
          // Add the video stream to the video element
          addVideoStream(video, userVideoStream);
        });
      });

      // Listen for user connections
      socket.on("user-connected", (userId) => {
        // Connect to the new user with the local stream
        connectToNewUser(userId, stream);
      });

      // Listen for the clients list from the server
      socket.on("clients-list", (clients) => {
        // Connect to each client in the list
        clients.forEach((clientId) => {
          // Check if the clientId is not equal to the user's peer ID
          if (myPeer.id !== clientId) {
            connectToNewUser(clientId, stream);
          }
        });
      });

      // Emit a join room event to the server
      socket.emit("join-room", ROOM_ID, myPeer.id);
    });
}


// Listen for when the peer is open
myPeer.on("open", (id) => {
  // Initialize the connections after the peer ID is generated
  initializeConnections();
});

// Listen for user disconnections
socket.on("user-disconnected", (userId) => {
  // Close the connection to the disconnected user
  if (peers[userId]) peers[userId].close();

  // Remove the disconnected user's video element immediately
  removeDisconnectedVideo(userId);

  // Stop recording the audio and send it to the server
  stopRecording();
  sendAudioToServer();
});



// Function to remove the disconnected user's video element
function removeDisconnectedVideo(userId) {
  const disconnectedVideo = document.querySelector(`video[data-peer-id="${userId}"]`);
  if (disconnectedVideo) {
    disconnectedVideo.parentElement.remove();
  }
}


// Function to connect to a new user
function connectToNewUser(userId, stream) {
  // Call the new user with the local stream
  const call = myPeer.call(userId, stream);

  // Create a new video element
  const video = document.createElement("video");

  // Listen for the stream from the remote peer
  call.on("stream", (userVideoStream) => {
    // Set the peerId property on the user video stream object
    userVideoStream.peerId = userId;

    // Add the video stream to the video element
    addVideoStream(video, userVideoStream);
  });

  // Listen for when the call is closed
  call.on("close", () => {
    // Remove the video element
    video.remove();
  });

  // Add the call to the peers object
  peers[userId] = call;

  // Stop recording the audio and send it to the server
  stopRecording();
}





function addVideoStream(video, stream) {
  if (!stream.peerId) {
    console.warn('Stream object missing peerId property:', stream);
    return;
  }

  // Create a holder div element
  const holder = document.createElement("div");

  // Add a data-peer-id attribute to the video element
  video.setAttribute("data-peer-id", stream.peerId);

  // Add the item class to the holder div
  holder.classList.add("item");

  // Check if the video element is the local video
  if (video.getAttribute("id") === "Myface") {
    // Only add the local video element if it has a valid data-peer-id attribute
    if (video.getAttribute("data-peer-id")) {
      videoGrid.append(holder);
    }
  }

  // Check if the video element is a remote video
  if (video.getAttribute("id") !== "Myface") {
    // Only add remote video to the video grid if it has a valid data-peer-id attribute
    if (video.getAttribute("data-peer-id")) {
      videoGrid.append(holder);
    }
  }

  // Set the srcObject of the video element to the stream
  video.srcObject = stream;

  // Uncomment to mute the local video element
  if (video.getAttribute("id") === "Myface") {
    video.muted = true;
  }

  // Listen for when the video metadata has loaded
  video.addEventListener("loadedmetadata", () => {
    // Play the video
    video.play();
  });

  // Append the video element to the holder div
  holder.append(video);
}








// Listen for when the peer is open
myPeer.on("open", (id) => {
  // Initialize the connections after the peer ID is generated
  initializeConnections();
});

// Listen for user disconnections
socket.on("user-disconnected", (userId) => {
  // Close the connection to the disconnected user
  if (peers[userId]) peers[userId].close();

  // Remove the disconnected user's video element immediately
  removeDisconnectedVideo(userId);
});

// Function to remove the disconnected user's video element
function removeDisconnectedVideo(userId) {
  const disconnectedVideo = document.querySelector(`video[data-peer-id="${userId}"]`);
  if (disconnectedVideo) {
    disconnectedVideo.parentElement.remove();
  }
}


// Function to connect to a new user
function connectToNewUser(userId, stream) {
  // Call the new user with the local stream
  const call = myPeer.call(userId, stream);

  // Create a new video element
  const video = document.createElement("video");

  // Listen for the stream from the remote peer
  call.on("stream", (userVideoStream) => {
    // Set the peerId property on the user video stream object
    userVideoStream.peerId = userId;

    // Add the video stream to the video element
    addVideoStream(video, userVideoStream);
  });

  // Listen for when the call is closed
  call.on("close", () => {
    // Remove the video element
    video.remove();
  });

  // Add the call to the peers object
  peers[userId] = call;
}





function addVideoStream(video, stream) {
  // Check if the stream has a peerId property
  if (!stream.peerId) {
    console.error("Invalid stream - missing peerId property");
    return;
  }

  // Create a holder div element
  const holder = document.createElement("div");

  // Add a data-peer-id attribute to the video element
  video.setAttribute("data-peer-id", stream.peerId);

  // Add the item class to the holder div
  holder.classList.add("item");

  // Check if the video element is the local video
  if (video.getAttribute("id") === "Myface") {
    // Only add the local video element if it has a valid data-peer-id attribute
    if (video.getAttribute("data-peer-id")) {
      videoGrid.append(holder);
    }
  }

  // Check if the video element is a remote video
  if (video.getAttribute("id") !== "Myface") {
    // Only add remote video to the video grid if it has a valid data-peer-id attribute
    if (video.getAttribute("data-peer-id")) {
      videoGrid.append(holder);
    }
  }

  // Set the srcObject of the video element to the stream
  video.srcObject = stream;

  // Uncomment to mute the local video element
  if (video.getAttribute("id") === "Myface") {
    video.muted = true;
  }

  // Listen for when the video metadata has loaded
  video.addEventListener("loadedmetadata", () => {
    // Play the video
    video.play();
  });

  // Append the video element to the holder div
  holder.append(video);
}
