// Move items
import interact from "https://cdn.interactjs.io/v1.10.11/interactjs/index.js";

// Set initial position to (0, 0)
const position = { x: 0, y: 0 };

// Use interact library to make 'item' class draggable 
// and restrict movement to within 'body' element
interact(".item").draggable({
  // enable inertial throwing
  inertia: true,
  modifiers: [
    interact.modifiers.restrictRect({
      restriction: "body", // Changed from 'parent' to 'body'
      endOnly: true
    })
  ],
  listeners: {
    move(event) {
      // Update position based on the event dx and dy
      position.x += event.dx;
      position.y += event.dy;

      // Update the style of the target with the new position
      event.target.style.transform = `translate(${position.x}px, ${position.y}px)`;
    }
  }
});

// Get share link when click on button
// by creating a temporary textarea element
document.getElementById("copy-url-btn").addEventListener("click", () => {
  const tempTextarea = document.createElement("textarea");
  tempTextarea.value = window.location.href;
  tempTextarea.style.position = "fixed";
  tempTextarea.style.left = "-9999px";
  document.body.appendChild(tempTextarea);
  tempTextarea.select();
  tempTextarea.setSelectionRange(0, 99999); // For mobile devices
  document.execCommand("copy");
  document.body.removeChild(tempTextarea);

  // Change copy button text when clicked
  // and revert back after 4 seconds
  const copyUrlBtn = document.getElementById("copy-url-btn");
  copyUrlBtn.textContent = "Copied to clipboard!";
  setTimeout(() => {
    copyUrlBtn.textContent = "Copy URL";
  }, 4000);
});

// Function to setup StereoPanner for video element 
function setupStereoPanner(video) {
  const audioContext = new AudioContext();
  const source = audioContext.createMediaElementSource(video);
  const panner = audioContext.createStereoPanner();

  // Connect source to panner and then to destination
  source.connect(panner);
  panner.connect(audioContext.destination);

  return panner;
}

// Function to update the pan value based on
// the position of the video element relative
// to the viewport
function updatePanValue(video) {
  const rect = video.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth;
  const panValue = (rect.left + rect.width / 2) / viewportWidth * 2 - 1;
  video.panner.pan.value = panValue;
}

// Ensure element is always inside window
// by calculating its maximum x and y positions
function ensureElementIsInsideWindow(element) {
  const rect = element.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const maxX = viewportWidth - rect.width;
  const maxY = viewportHeight - rect.height;
  
  let newX = rect.left;
  let newY = rect.top;

  if (newX < 0) {
    newX = 0;
  } else if (newX > maxX) {
    newX = maxX;
  }

  if (newY < 0) {
    newY = 0;
  } else if (newY > maxY) {
    newY = maxY;
  }

  element.style.transform = `translate(${newX}px, ${newY}px)`;

  // If element is video, also update its pan value
  if (element.tagName === "VIDEO") {
    updatePanValue(element);
  }
}