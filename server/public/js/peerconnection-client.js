// Generated by CoffeeScript 1.7.1
var DEBUGLOG, RTCIceCandidate, RTCPeerConnection, RTCSessionDescription, URL, constraints, createPeerConnection, mediaConstraints, onRemoteSdpError, onRemoteSdpSucces, onRemoteStreamAdded, onRemoteStreamRemoved, onSessionConnecting, onSessionOpened, pc, pcConfig, pcOptions, remoteStream, shareLocalMedia, streamOption;

pc = void 0;

pcConfig = {
  iceServers: [
    {
      url: "stun:stun.l.google.com:19302"
    }
  ]
};

pcOptions = {
  optional: [
    {
      DtlsSrtpKeyAgreement: true
    }
  ]
};

mediaConstraints = {
  mandatory: {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true
  }
};

remoteStream = void 0;

RTCPeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;

RTCSessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;

RTCIceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;

navigator.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;

constraints = {
  mandatory: {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true
  }
};

streamOption = {
  "audio": true,
  "video": true
};

URL = window.webkitURL || window.URL;

DEBUGLOG = function(str) {
  return console.log("Debug: " + str);
};

shareLocalMedia = function(peer_connection, peer_id) {
  console.log("debug share local pc is ", peer_connection);
  navigator.getUserMedia(streamOption, function(stream) {
    var localVideoElement;
    localVideoElement = document.getElementById("local-video");
    localVideoElement.src = URL.createObjectURL(stream);
    localVideoElement.play();
    peer_connection.addStream(stream);
    return peer_connection.createOffer(function(desc) {
      peer_connection.setLocalDescription(desc);
      return sendToPeer(peer_id, JSON.stringify(desc));
    }, function(err) {
      return console.error(err);
    }, constraints);
  }, function(err) {
    return conosle.log("getUserMedia faile, error is " + err.message);
  });
};

createPeerConnection = function(peer_id) {
  var e;
  console.log("debug : create peerconnection: peer_id = " + peer_id);
  try {
    pc = new RTCPeerConnection(pcConfig, pcOptions);
    pc.onicecandidate = function(event) {
      var candidate;
      if (event.candidate) {
        candidate = {
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          sdpMid: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        };
        sendToPeer(peer_id, JSON.stringify(candidate));
      } else {
        console.log("End of candidates.");
      }
    };
    pc.onconnecting = onSessionConnecting;
    pc.onopen = onSessionOpened;
    pc.onaddstream = onRemoteStreamAdded;
    pc.onremovestream = onRemoteStreamRemoved;
    console.log("Created RTCPeerConnnection with config: " + JSON.stringify(pcConfig));
    shareLocalMedia(pc, peer_id);
  } catch (_error) {
    e = _error;
    console.log("Failed to create PeerConnection with " + connectionId + ", exception: " + e.message);
  }
};

onRemoteStreamAdded = function(event) {
  var remoteVideoElement;
  console.log("Remote stream added:", URL.createObjectURL(event.stream));
  remoteVideoElement = document.getElementById("remote-video");
  console.log("remote video", remoteVideoElement);
  remoteVideoElement.src = URL.createObjectURL(event.stream);
  remoteVideoElement.play();
};

onSessionConnecting = function(message) {
  console.log("Session connecting.");
};

onSessionOpened = function(message) {
  console.log("Session opened.");
};

onRemoteStreamRemoved = function(event) {
  console.log("Remote stream removed.");
};

onRemoteSdpError = function(event) {
  console.error("onRemoteSdpError", event.name, event.message);
};

onRemoteSdpSucces = function() {
  console.log("onRemoteSdpSucces");
};