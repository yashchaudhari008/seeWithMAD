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
let dataChannel = null;
let remoteStream = null;
let myName = null;

const connectionStatus = document.getElementById("connectionStatus");
const video = document.getElementById("hostVideo"); 
const hostID = document.getElementById("hostID");
const signInBTN = document.getElementById("signInBTN");
const joinStreamBTN = document.getElementById("joinStreamBTN");
const closeStreamBTN = document.getElementById("closeStreamBTN");

auth.onAuthStateChanged((user) => {
    if (user) {
        toggleHide(hostID);
        toggleHide(joinStreamBTN);
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

joinStreamBTN.onclick = async () => {
    if (hostID.value.length <1 ){ return alert("Enter Host ID to join a stream!")}
    remoteStream = new MediaStream();
    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach(
            track => {
                remoteStream.addTrack(track);
            });
    };
    video.srcObject = remoteStream;

    const hostDoc = firestore.collection("hosts").doc(hostID.value);
    const offers = hostDoc.collection("offers");
    const answers = hostDoc.collection("answers");

    peerConnection.onicecandidate = e => {
        e.candidate && answers.add(e.candidate.toJSON());
    }

    const callData = (await hostDoc.get()).data();
    const offerDescription = callData.offer;
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offerDescription));
    const answerDescription = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answerDescription);
      
    const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
    };
    await hostDoc.update({ answer });
    
    hostID.readonly = true;
    // Listen to offer candidates    
    offers.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
        // console.log(change)
        if (change.type === 'added') {
            let data = change.doc.data();
            peerConnection.addIceCandidate(new RTCIceCandidate(data));
        }
        });
    });
    toggleHide(joinStreamBTN);
    toggleHide(closeStreamBTN);
}

closeStreamBTN.onclick = async () => {

    const hostDoc = await firestore.collection("hosts").doc(hostID.value);
    const offers = await hostDoc.collection("offers");
    const answers = await hostDoc.collection("answers");

    await offers.get().then( qS => qS.forEach( doc => doc.ref.delete()));
    await answers.get().then( qS => qS.forEach( doc => doc.ref.delete()));
    await hostDoc.delete(); 
    
    await peerConnection.close();
    console.log(peerConnection.connectionState);

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
        video.srcObject = null;
        if (peerConnection){
            await peerConnection.close();
        }
        gotoHOME();
    }
}

peerConnection.ondatachannel = e => {
    dataChannel = e.channel;
    dataChannel.onmessage = msg => {
        let m = JSON.parse(msg.data);
        createMessage("r",m.name,m.message);
        updateChatBoxBadge();
    }
    dataChannel.onopen = e => {
        document.getElementById('sendBTN').disabled = false;
    }
}
