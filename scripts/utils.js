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
function toggleChatBox(ele){
    let container = document.getElementById('sideContainer');
    container.classList.toggle('hide');
    if(container.classList.contains('hide')){
        ele.innerHTML = "Show ChatBox";
    }
    else {
        ele.innerHTML = "Hide ChatBox";
    }
}
function updateChatBoxBadge(){
    let container = document.getElementById('sideContainer');
    let ele = document.getElementById('toggleMsgMenu');
    if(container.classList.contains('hide')){
        ele.innerHTML = '<span class="badge">NEW MSG</span>'+"Show ChatBox";
    }
}
function toggleHide(ele){
    ele.classList.toggle('hide');
}