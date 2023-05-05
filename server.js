const express = require("express");
const multer = require("multer");
const fs = require("fs");
const util = require("util");
const axios = require("axios");
const FormData = require("form-data");

const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");

app.set("view engine", "ejs");
app.use(express.static("public"));

const OPENAI_API_KEY = "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";

// Define the multer middleware for handling file uploads
const upload = multer();

app.get("/", (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

app.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    // Save the received audio file temporarily
    const tempFilePath = "recording.mp3";
    await util.promisify(fs.writeFile)(tempFilePath, req.file.buffer);

    // Create a FormData object and append the audio file
    const formData = new FormData();
    formData.append("file", fs.createReadStream(tempFilePath), {
      filename: "recording.mp3",
    });
    formData.append("model", "whisper-1");

    // Make the API call to the Whisper ASR API
    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    // Delete the temporary audio file
    await util.promisify(fs.unlink)(tempFilePath);

    // Get the transcription from the response
    const transcription = response.data.text;

    // Send the transcription as a response
    res.send({ transcription });
  } catch (error) {
    console.error("Error during transcription:", error.response?.data);
    res.status(500).send({ error: "Error during transcription" });
  }
});

// Socket.io code for handling video connections
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });
});

server.listen(9999);
