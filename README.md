## Slite Meet

![Meet](/public/images/meet.png)

## Client

This code is used to create a video chat application using the web server. It uses JavaScript and the Socket.io library to establish a connection between the web server and the client. The code creates a socket connection to the server, gets the video grid element from the DOM, creates a new Peer object, a new video element, sets the id of the video element, mutes the video element, and creates an empty peers object. A function is then defined to initialize the connections. This function retrieves the user media (audio and video) and sets the peerID property on the stream object. The video stream is added to the video element. It also listens for calls from other peers, user connections, and clients list from the server. After the peer is open, it initializes the connections and listens for user disconnections. It closes the connection to the disconnected user and removes the disconnected user's video element immediately. Lastly, it defines a function to connect to a new user, remove the disconnected user's video element, and adds the video stream to the video element.

## Server

Server.js shows an example of a realtime video conferencing application using Node.js, Express.js, Socket.io and UUID. The functionality is implemented by creating an Express server and setting up a Socket.io server to handle communication between connected clients. When a user visits the main page, they are redirected to a unique room using UUIDs and the Express view engine is used to render the page for the specified room. An empty object is then used to store all the connected clients per room and Socket.io is used to join, inform, update and disconnect users. Finally, the server listens on port 9999.
