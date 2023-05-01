const express = require("express");
const bodyParser = require('body-parser');
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");
const speech = require("@google-cloud/speech"); // Add this line

const {Storage} = require('@google-cloud/storage');

const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});



// Add the following lines to set up the Google Cloud Speech client
const speechClient = new speech.SpeechClient();
const encoding = "OGG_OPUS";
const sampleRateHertz = 48000;
const languageCode = "en-US";


app.use(express.json());
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json()); // Add this line to support JSON-encoded bodies

app.get("/", (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

// Add this route for handling the audio transcription
app.post("/transcribe", async (req, res) => {
  if (!req.body.audio) {
    res.status(400).send("Invalid audio file");
    return;
  }

  const audio = {
    content: req.body.audio.toString("base64"),
  };

  // Call the Google Speech-to-Text API to transcribe the audio
  try {
    const response = await client.recognize(config, audio);
    const transcription = response[0].results[0].alternatives[0].transcript;
    console.log(`Transcription: ${transcription}`);
    res.send(transcription);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
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



//test 
async function testSpeechClient() {
  try {
    const config = {
      encoding: encoding,
      sampleRateHertz: sampleRateHertz,
      languageCode: languageCode,
    };

    const audio = {
      uri: "gs://cloud-samples-tests/speech/brooklyn_bridge.raw",
    };

    const [response] = await speechClient.recognize(config, audio);
    const transcription = response.results
      .map((result) => result.alternatives[0].transcript)
      .join("\n");
    console.log(`Transcription: ${transcription}`);
  } catch (error) {
    console.error(error);
  }
}

testSpeechClient();


server.listen(9999);
