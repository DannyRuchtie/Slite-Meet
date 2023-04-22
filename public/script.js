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

// Get user media (audio and video)
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: false
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
  });

// Listen for user disconnections
socket.on("user-disconnected", (userId) => {
  // Close the connection to the disconnected user
  if (peers[userId]) peers[userId].close();
});

// Listen for when the peer is open
myPeer.on("open", (id) => {
  // Emit a join room event to the server
  socket.emit("join-room", ROOM_ID, id);
});

// Function to connect to a new user
function connectToNewUser(userId, stream) {
  // Call the new user with the local stream
  const call = myPeer.call(userId, stream);

  // Create a new video element
  const video = document.createElement("video");

  // Listen for the stream from the remote peer
  call.on("stream", (userVideoStream) => {
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

// Function to add the video stream to the video element
function addVideoStream(video, stream) {
  // Create a holder div element
  const holder = document.createElement("div");

  // Add the item class to the holder div
  holder.classList.add("item");

  // Append the holder div to the video grid
  videoGrid.append(holder);

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