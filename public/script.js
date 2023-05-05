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
      // Add the video stream to the video element
      addVideoStream(myVideo, stream);

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
          // Check if the clientId is not equal to the user's peer ID and not already connected
          if (myPeer.id !== clientId && !connectedClients.has(clientId)) {
            connectToNewUser(clientId, stream);
            connectedClients.add(clientId);
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

  // Remove the disconnected user from the connectedClients set
  connectedClients.delete(userId);
});

// Function to remove the disconnected user's video element
function removeDisconnectedVideo(userId) {
  const disconnectedVideo = document.querySelector(
    `video[data-peer-id="${userId}"]`
  );
  if (disconnectedVideo) {
    // Remove the holder div containing the disconnected user's video element
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
  // Create a holder div element
  const holder = document.createElement("div");

  // Add a data-peer-id attribute to the video element
  video.setAttribute("data-peer-id", stream.peerId);

  // Add the item class to the holder div
  holder.classList.add("item");

  // Check if the video element is the local video
  if (video.getAttribute("id") === "Myface") {
    // If the local video is not already in the video grid, add it
    if (!document.getElementById("Myface")) {
      videoGrid.append(holder);
    }
  } else {
    // Add remote video to the video grid
    videoGrid.append(holder);
  }

  // Set the srcObject of the video element to the stream
  video.srcObject = stream;

  // Listen for when the video metadata has loaded
  video.addEventListener("loadedmetadata", () => {
    // Play the video
    video.play();
  });

  // Append the video element to the holder div
  holder.append(video);
}

// Global variable to store the media recorder and recorded chunks
let mediaRecorder;
let recordedChunks = [];


// Start or stop recording based on the current state
function toggleRecording(stream) {
  const recordButton = document.getElementById("recordButton");

  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    // Create a new media recorder
    mediaRecorder = new MediaRecorder(stream, {
      audioBitsPerSecond: 64000,
      mimeType: 'audio/webm'
    });
    // Start the media recorder
    mediaRecorder.start();

    // Listen for dataavailable events from the media recorder
    mediaRecorder.ondataavailable = (e) => {
      // Add the recorded chunk to the recordedChunks array
      recordedChunks.push(e.data);
    };
    mediaRecorder.onstop = (e) => {
      saveRecording();
    }

    // Update the button text and add the recording class
    recordButton.classList.add("recording");
  } else if (mediaRecorder.state === "recording") {
    // Stop the media recorder
    mediaRecorder.stop();

    // Update the button text and remove the recording class
    recordButton.classList.remove("recording");
  }
}

// Save the recording as a file and transcribe the audio
async function saveRecording() {
  // Create a blob from the recorded chunks
  const blob = new Blob(recordedChunks, {type: "audio/webm"});

  // Transcribe the recorded audio
  await transcribeAudio(blob);

  // Create a download link for the blob
  // const url = URL.createObjectURL(blob);
  // const a = document.createElement("a");
  // a.href = url;
  // a.download = "recording.webm";
  // a.style.display = "none";
  // document.body.appendChild(a);
  // Click the link to download the file
  // a.click();

  // Remove the link after the download
  // setTimeout(() => {
  //   document.body.removeChild(a);
  //   URL.revokeObjectURL(url);
  // }, 100);

  // Clear the recorded chunks
  recordedChunks = [];
}

// Add a click event listener to the record button
document.getElementById("recordButton").addEventListener("click", () => {
  // Get the local video element's stream
  const localVideo = document.getElementById("Myface");
  if (localVideo) {
    toggleRecording(localVideo.srcObject);
  } else {
    alert("Local video stream not found.");
  }
});

// Function to transcribe the recorded audio
async function transcribeAudio(blob) {
  try {
    // Create a FormData object and append the audio file
    const formData = new FormData();
    formData.append("audio", blob, "recording.mp3");

    // Send the audio file to the server for transcription
    const response = await fetch("/transcribe", {
      method: "POST",
      body: formData,
    });

    // Check if the response is ok
    if (response.ok) {
      // Get the transcription from the response
      const { transcription } = await response.json();

      // Display the transcription or use it as needed
      console.log("Transcription:", transcription);
    } else {
      console.error("Error during transcription:", response.status);
    }
  } catch (error) {
    console.error("Error during transcription:", error);
  }
}
