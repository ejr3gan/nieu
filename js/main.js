var vid = document.getElementById("bgvid");
var pauseButton = document.querySelector("#pause");
var longButton = document.getElementById("long");
var shortButton = document.getElementById("short");
var bonusButton = document.getElementById("bonus");
var extremeButton = document.getElementById("extreme");

var originalLink = document.getElementById("originalLink");

function vidFade() {
    vid.classList.add("stopfade");
}

function vidUnFade() {
    vid.classList.remove("stopfade")
}

pauseButton.addEventListener("click", function () {
    vid.classList.toggle("stopfade");
    if (vid.paused) {
        vid.play();
        pauseButton.innerHTML = "Pause";
    } else {
        vid.pause();
        pauseButton.innerHTML = "Paused";
    }
});

longButton.addEventListener("click", function () {
    vidUnFade();
    pauseButton.innerHTML = "Pause";
    vid.src = "video/nooo-long.mp4"
    originalLink.href = "https://www.youtube.com/watch?v=faMh6OYfuNE&t=40s"
});

shortButton.addEventListener("click", function () {
    vidUnFade();
    pauseButton.innerHTML = "Pause";
    vid.src = "video/nooo-short.mp4"
    originalLink.href = "https://www.youtube.com/watch?v=Ep0z9UiI5io&feature=youtu.be&t=44"
});

bonusButton.addEventListener("click", function () {
    vidUnFade();
    pauseButton.innerHTML = "Pause";
    vid.src = "video/nooo-bonus.mp4"
    originalLink.href = "https://www.youtube.com/watch?v=1IZldRSGW50&t=8s"
});

extremeButton.addEventListener("click", function () {
    vidUnFade();
    pauseButton.innerHTML = "Pause";
    vid.src = "video/nooo-short.mp4"
    vid.playbackRate = 2.7;
    originalLink.href = "https://www.youtube.com/watch?v=1IZldRSGW50&t=8s"
});

// Get the modal
var modal = document.getElementById('myModal');

// Get the image and insert it inside the modal - use its "alt" text as a caption
var img = document.getElementById('myImg');
var modalImg = document.getElementById("img01");
var captionText = document.getElementById("caption");
img.onclick = function(){
    modal.style.display = "block";
    modalImg.src = this.src;
    captionText.innerHTML = this.alt;
}

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
}
