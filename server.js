const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

// Define an empty object to store connected clients per room
const roomClients = {};

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    
    // If the room doesn't exist in the roomClients object, create an empty array
    if (!roomClients[roomId]) {
      roomClients[roomId] = [];
    }

    // Join the room
    socket.join(roomId);

    // Add the new user to the clients array of the room
    roomClients[roomId].push(userId);

    // Inform the other clients about the new user
    socket.to(roomId).emit("user-connected", userId);

    // Send the list of clients to the new user, excluding the local user
    socket.emit("clients-list", roomClients[roomId].filter((id) => id !== userId));


    socket.on("disconnect", () => {
      // Remove the user from the clients array of the room
      roomClients[roomId] = roomClients[roomId].filter((id) => id !== userId);

      socket.to(roomId).emit("user-disconnected", userId);
    });

    socket.on("update-video-position", ({ userId, x, y }) => {
      socket.to(roomId).emit("video-position-updated", { userId, x, y });
    });

  });
});

server.listen(9999);
