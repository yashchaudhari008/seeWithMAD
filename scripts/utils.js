function createMessage(type,msg){
    let element = document.createElement("p");
    element.innerHTML = msg;
    
    let div = document.getElementById("msgs");
    div.appendChild(element);
    element.classList.add(type);
    element.scrollIntoView();
}
function fullscreen(ele){
    if (document.fullscreenElement) {
        ele.innerHTML = "Fullscreen";
		document.exitFullscreen();
	} else {
        ele.innerHTML = "Exit Fullscreen";
		document.documentElement.requestFullscreen();
	}
}