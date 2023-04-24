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
      audio: false,
    })
    .then((stream) => {
      // Set the peerId property on the stream object
      stream.peerId = myPeer.id;

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
