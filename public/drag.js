import interact from "https://cdn.interactjs.io/v1.10.11/interactjs/index.js";




const position = { x: 0, y: 0 };



// interact(".item").draggable({

//   inertia: true,
//       autoScroll: false,
//   modifiers: [
//     interact.modifiers.restrictRect({
//       restriction: "parent",
//       endOnly: true
//     })
//   ],


//   listeners: {
//     move(event) {
//       position.x += event.dx;
//       position.y += event.dy;

//       event.target.style.transform = `translate(${position.x}px, ${position.y}px)`;
//     }
//   }
// });


// target elements with the "draggable" class
interact('.item')
  .draggable({
    // enable inertial throwing
    inertia: true,
    // keep the element within the area of it's parent
    modifiers: [
      interact.modifiers.restrictRect({
        restriction: 'parent',
        endOnly: true
      })
    ],


    listeners: {
      // call this function on every dragmove event
      move: dragMoveListener,

      // call this function on every dragend event
      end (event) {
       
      }
    }
  })

function dragMoveListener (event) {
  var target = event.target
  // keep the dragged position in the data-x/data-y attributes
  var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
  var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

  // translate the element
  target.style.transform = 'translate(' + x + 'px, ' + y + 'px)'

  // update the posiion attributes
  target.setAttribute('data-x', x)
  target.setAttribute('data-y', y)
}

// this function is used later in the resizing and gesture demos
window.dragMoveListener = dragMoveListener
