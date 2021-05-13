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

const servers = {
    iceServers: [{
        urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },],
    iceCandidatePoolSize: 10,
};

let peerConnection = new RTCPeerConnection(servers);
let dataChannel = peerConnection.createDataChannel('messages'); 
let myStream = null;

const video = document.getElementById("hostVideo"); 
const hostID = document.getElementById("hostID");
const setStreamBTN = document.getElementById("setStreamBTN");
const hostStreamBTN = document.getElementById("hostStreamBTN");
const closeStreamBTN = document.getElementById("closeStreamBTN");

setStreamBTN.onclick = async () => {
    myStream =  await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    myStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, myStream)
    })
    video.srcObject = myStream;
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
}

closeStreamBTN.onclick = async () => {
    
    peerConnection.close();
}

function sendMSG(){
    let msg = document.getElementById("sendInput")
    if(msg.value.length <= 1){ return }
    dataChannel.send(msg.value);
    createMessage("s",msg.value);
    msg.value = "";
}

peerConnection.onconnectionstatechange = () => {
    console.log(peerConnection.connectionState);
}
dataChannel.onmessage = message => {
    createMessage("r",message.data);
}