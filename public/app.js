
/* Get the documentElement (<html>) to display the page in fullscreen */
var elem = document.documentElement;

/* View in fullscreen */
function openFullscreen() {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.mozRequestFullScreen) {
    /* Firefox */
    elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullscreen) {
    /* Chrome, Safari and Opera */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    /* IE/Edge */
    elem.msRequestFullscreen();
  }
}

//event listner

document.addEventListener("fullscreenchange", (event) => {
  if (document.fullscreenElement) {
    console.log(
      `Element: ${document.fullscreenElement.id} entered full-screen mode.`
    );
  } else {
    console.log("Leaving full-screen mode.");
  }
});


window.addEventListener("keydown", keyCheck); 



function keyCheck(event) {
  var x = event.keyCode;
  if (x == 70) {
    openFullscreen();
  } else {}
}



// Share
var shareLink = document.getElementById("share");
shareLink.addEventListener("click", share);


function share() {
var share = window.location.href;
var input = document.createElement("input");
input.setAttribute('type', 'text');
input.setAttribute('id', 'url');
input.setAttribute('value', share);
document.body.appendChild(input);

input.select();
input.setSelectionRange(0, 99999); /* For mobile devices */

document.execCommand("copy");

shareLink.classList.add("active");
input.remove();

setTimeout(function() {
      shareLink.classList.remove("active");

}, 3000);

}
