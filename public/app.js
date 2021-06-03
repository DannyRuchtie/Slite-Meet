
import interact from "https://cdn.interactjs.io/v1.10.11/interactjs/index.js";

const position = { x: 0, y: 0 };

interact(".item").draggable({
  // enable inertial throwing
  inertia: true,
  modifiers: [
    interact.modifiers.restrictRect({
      restriction: "parent",
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


function share() {
  /* Get the text field */

var share = window.location.href;

var input = document.createElement("input");
input.setAttribute('type', 'text');
input.setAttribute('id', 'url');
input.setAttribute('value', share);

document.body.appendChild(input);

 /* Select the text field */
 input.select();
 input.execCommand("copy");


}

share();