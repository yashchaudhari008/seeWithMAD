function createMessage(type,name,msg){
    let element = document.createElement("div");
    let nameP = document.createElement("p");
    let msgP = document.createElement("p");
    nameP.innerHTML = name;// +": " +msg;
    msgP.innerHTML = msg;
    nameP.classList.add("msg_name");
    element.appendChild(nameP);
    element.appendChild(msgP);
    
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
function gotoHOME(){
    window.location.href = '../';
}