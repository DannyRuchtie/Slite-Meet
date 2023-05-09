require('dotenv').config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
ffmpeg.setFfmpegPath(ffmpegPath);

const path = require("path");



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

    console.log(`Received audio file: ${req.file.originalname}, type: ${req.file.mimetype}, size: ${req.file.size} bytes`);

    // Save the received video file temporarily
    const tempVideoPath = `temp-${req.file.originalname}`;
    await util.promisify(fs.writeFile)(tempVideoPath, req.file.buffer);

    // Extract audio from the video file
    const tempAudioPath = path.join("public", `temp-${path.basename(req.file.originalname, path.extname(req.file.originalname))}.wav`);

    //For testing the audio file
    //const tempAudioPath = `temp-${path.basename(req.file.originalname, path.extname(req.file.originalname))}.wav`;
    
    
    await new Promise((resolve, reject) => {
      ffmpeg(tempVideoPath)
        .output(tempAudioPath)
        .on("start", (commandLine) => {
          console.log("Start audio extraction:", commandLine);
        })
        .on("end", () => {
          console.log("Audio extraction completed.");
          resolve();
        })
        .on("error", (error) => {
          console.error("Audio extraction error:", error);
          reject(error);
        })
        .run();
    });
    

    // Create a FormData object and append the extracted audio file
    const formData = new FormData();
    formData.append("file", fs.readFileSync(tempAudioPath), {
      filename: path.basename(tempAudioPath),
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

// Log the entire response object
console.log("ASR API Response:", JSON.stringify(response.data, null, 2));


 // Extract the transcription from the response
 const transcription = response.data.text;
console.log("Transcription:", transcription);



  // Get the transcription from the response
await util.promisify(fs.unlink)(tempVideoPath);

// Delete the temporary audio file
await util.promisify(fs.unlink)(tempAudioPath);

    const gptJson = {
      model: 'gpt-3.5-turbo',
      max_tokens: 512,
      temperature: 0.01,
      top_p: 1,
      messages: [
        {
          role: 'system',
          content:'',
        },
        { role: 'user',
          content: `The following text is a converation between multiple people can you summarize it for me:
          """
          ${transcription}
          """   and write the entire text underneath `
     
        }
      ],
    }

    const gptResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      gptJson,
      {
        headers: {
          'Content-type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );
    console.log("GPT-3 Request:", JSON.stringify(gptJson, null, 2));


    // Send the transcription as a response
    res.send({ 
      transcription: transcription,
      gptResponse: gptResponse.data.choices[0].message.content 
    });
  } catch (error) {
    //console.error("Error during transcription:", error.response?.data);
    console.error("Error during transcription:", error.message, error.response?.data || error);

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
