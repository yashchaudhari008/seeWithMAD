const firebaseConfig = {
    apiKey: "AIzaSyDHG97oVjJH9tSCMzxrw_VMt6NBFgO4yK8",
    authDomain: "seewithmad.firebaseapp.com",
    databaseURL: "https://seewithmad-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "seewithmad",
    storageBucket: "seewithmad.appspot.com",
    messagingSenderId: "138068172326",
    appId: "1:138068172326:web:d9dc2a8dbdbc443f1450e7"
};

if (!firebase.apps.length){ firebase.initializeApp(firebaseConfig); }
const firestore = firebase.firestore();
const auth = firebase.auth();

const servers = {
    iceServers: [{
        urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },],
    iceCandidatePoolSize: 0,
};

let peerConnection = new RTCPeerConnection(servers);
let dataChannel = peerConnection.createDataChannel('messages'); 
let myStream = null;
let myName = null;

const connectionStatus = document.getElementById("connectionStatus");
const video = document.getElementById("hostVideo"); 
const hostID = document.getElementById("hostID");
const signInBTN = document.getElementById("signInBTN");
const setStreamBTN = document.getElementById("setStreamBTN");
const hostStreamBTN = document.getElementById("hostStreamBTN");
const closeStreamBTN = document.getElementById("closeStreamBTN");

auth.onAuthStateChanged((user) => {
    if (user) {
        toggleHide(setStreamBTN);
        myName = user.displayName;
        localStorage.setItem("userName",myName);
    } else {
        toggleHide(signInBTN);
    }
});

signInBTN.onclick = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithRedirect(provider);
}

setStreamBTN.onclick = async () => {
    myStream =  await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    myStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, myStream)
    })
    video.srcObject = myStream;
    toggleHide(setStreamBTN);
    toggleHide(hostStreamBTN);
}

hostStreamBTN.onclick = async () => {

    if (myStream === null){ return alert("Can't Host! Set Stream First") }
    const hostDoc = firestore.collection("hosts").doc();
    const offers = hostDoc.collection("offers");
    const answers = hostDoc.collection("answers");

    hostID.value = hostDoc.id;

    //Gets ice-candidates for caller and save it to DB
    peerConnection.onicecandidate = e => {
        e.candidate && offers.add(e.candidate.toJSON());
    }

    const offerDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offerDescription);

    const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
    };

    await hostDoc.set({offer})

    // Listen for remote answer
    hostDoc.onSnapshot((snapshot) => {
        const data = snapshot.data();
        if (!peerConnection.currentRemoteDescription && data?.answer) {
            const answerDescription = new RTCSessionDescription(data.answer);
            peerConnection.setRemoteDescription(answerDescription);
        }
    });

    // Listen for remote ICE candidates
    answers.onSnapshot(snapshot => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                peerConnection.addIceCandidate(candidate);
            }
        });
    });
    toggleHide(hostStreamBTN);
    toggleHide(closeStreamBTN);
}

closeStreamBTN.onclick = async () => {
    const hostDoc = await firestore.collection("hosts").doc(hostID.value);
    const offers = await hostDoc.collection("offers");
    const answers = await hostDoc.collection("answers");

    await offers.get().then( qS => qS.forEach( doc => doc.ref.delete()));
    await answers.get().then( qS => qS.forEach( doc => doc.ref.delete()));
    await hostDoc.delete(); 
    
    peerConnection.close();
    console.log(peerConnection.connectionState);

    myStream.getTracks().forEach(
        track => track.stop()
    )
    video.srcObject = null;
    gotoHOME();
}

function sendMSG(){
    let msgData = document.getElementById("sendInput").value;
    if(msgData.length <= 1){ return }
    let msg = {
        name: myName,
        message: msgData
    }
    dataChannel.send(JSON.stringify(msg));
    createMessage("s",msg.name,msg.message);
    document.getElementById("sendInput").value = "";
}

peerConnection.onconnectionstatechange = async () => {
    connectionStatus.innerHTML = peerConnection.connectionState.toLocaleUpperCase();

    if (peerConnection.connectionState == 'disconnected'){
        myStream.getTracks().forEach(
            track => track.stop()
        )
        video.srcObject = null;
        if (peerConnection){
            await peerConnection.close();
        }
        gotoHOME();
    }
    
}
dataChannel.onmessage = msg => {
    let m = JSON.parse(msg.data);
    createMessage("r",m.name,m.message);
    updateChatBoxBadge();
}
dataChannel.onopen = e => {
    document.getElementById('sendBTN').disabled = false;
}