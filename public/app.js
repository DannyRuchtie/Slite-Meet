function jquery() {
  $(".item").click(function () {

    $(this)
      .addClass("move")
      .draggable({ containment: "window", scroll: false, zIndex: 100 });
  });

  $(".close").click(function (e) {
    $(this).parent().removeClass("move").removeAttr("style");
    e.stopPropagation();
  });
}



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
}

