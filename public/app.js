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
