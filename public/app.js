// Move items
import interact from "https://cdn.interactjs.io/v1.10.11/interactjs/index.js";

const position = { x: 0, y: 0 };

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
      position.x += event.dx;
      position.y += event.dy;

      event.target.style.transform = `translate(${position.x}px, ${position.y}px)`;
    }
  }
});


// Share link
document.getElementById("copy-url-btn").addEventListener("click", () => {
  // Create a temporary textarea element to hold the URL
  const tempTextarea = document.createElement("textarea");

  // Set the value of the textarea to the current URL
  tempTextarea.value = window.location.href;

  // Add the textarea to the DOM, offscreen to make it invisible
  tempTextarea.style.position = "fixed";
  tempTextarea.style.left = "-9999px";
  document.body.appendChild(tempTextarea);

  // Select the content of the textarea
  tempTextarea.select();
  tempTextarea.setSelectionRange(0, 99999); // For mobile devices

  // Execute the copy command
  document.execCommand("copy");

  // Remove the textarea from the DOM
  document.body.removeChild(tempTextarea);

  // Get the button element
  const copyUrlBtn = document.getElementById("copy-url-btn");

  // Change the button text
  copyUrlBtn.textContent = "Copied to clipboard!";

  // Revert the button text back to the original after 4 seconds
  setTimeout(() => {
    copyUrlBtn.textContent = "Copy URL";
  }, 4000);
});

function setupStereoPanner(video) {
  const audioContext = new AudioContext();
  const source = audioContext.createMediaElementSource(video);
  const panner = audioContext.createStereoPanner();

  source.connect(panner);
  panner.connect(audioContext.destination);

  return panner;
}

function updatePanValue(video) {
  const rect = video.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth;
  const panValue = (rect.left + rect.width / 2) / viewportWidth * 2 - 1;
  video.panner.pan.value = panValue;
}

function ensureElementIsInsideWindow(element) {
  // Get the bounding rectangle of the element
  const rect = element.getBoundingClientRect();

  // Get the viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Calculate the maximum x and y positions of the element within the viewport
  const maxX = viewportWidth - rect.width;
  const maxY = viewportHeight - rect.height;

  // Calculate the new x and y positions of the element to ensure it is inside the viewport
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

  // Update the position of the element
  element.style.transform = `translate(${newX}px, ${newY}px)`;

  // Update the pan value based on the element's new position
  if (element.tagName === "VIDEO") {
    updatePanValue(element);
  }
}
