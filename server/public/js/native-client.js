// Generated by CoffeeScript 1.7.1
var connect, disconnect, handlePeerMessage, handleServerNotification, hangingGet, hangingGetCallback, localName, messageCounter, myId, onHangingGetTimeout, otherPeers, parseIntHeader, request, room, send, sendToPeer, server, signIn, signInCallback, startHangingGet, toggleMe, trace;

request = null;

hangingGet = null;

localName = void 0;

room = void 0;

server = void 0;

myId = -1;

otherPeers = {};

messageCounter = 0;

handlePeerMessage = function(peer_id, data) {
  var candidate, dataJson, str;
  ++messageCounter;
  str = "Message from '" + otherPeers[peer_id] + "'&nbsp;";
  str += "<span id='toggle_" + messageCounter + "' onclick='toggleMe(this);' ";
  str += "style='cursor: pointer'>+</span><br>";
  str += "<blockquote id='msg_" + messageCounter + "' style='display:none'>";
  str += data + "</blockquote>";
  trace(str);
  dataJson = JSON.parse(data);
  console.log("received ", dataJson);
  if (data.search("offer") !== -1) {
    createPeerConnection(peer_id);
    pc.setRemoteDescription(new RTCSessionDescription(dataJson), onRemoteSdpSucces, onRemoteSdpError);
    pc.createAnswer((function(sessionDescription) {
      console.log("Create answer:", sessionDescription);
      pc.setLocalDescription(sessionDescription);
      data = JSON.stringify(sessionDescription);
      sendToPeer(peer_id, data);
    }), (function(error) {
      console.log("Create answer error:", error);
    }), mediaConstraints);
  } else {
    console.log("Adding ICE candiate ", dataJson);
    candidate = new RTCIceCandidate({
      sdpMLineIndex: dataJson.sdpMLineIndex,
      candidate: dataJson.candidate
    });
    pc.addIceCandidate(candidate);
  }
};

trace = function(txt) {
  var elem;
  elem = document.getElementById("debug");
  elem.innerHTML += txt + "<br>";
};

handleServerNotification = function(data) {
  var parsed;
  trace("Server notification: " + data);
  parsed = data.split(",");
  if (parseInt(parsed[2]) !== 0) {
    otherPeers[parseInt(parsed[1])] = parsed[0];
  }
};

parseIntHeader = function(r, name) {
  var val;
  val = r.getResponseHeader(name);
  if ((val != null) && val.length) {
    return parseInt(val);
  } else {
    return -1;
  }
};

hangingGetCallback = function() {
  var e, peer_id;
  try {
    console.log(hangingGet);
    if (hangingGet.readyState !== 4) {
      return;
    }
    if (hangingGet.status !== 200) {
      trace("server error: " + hangingGet.statusText);
      disconnect();
    } else {
      peer_id = parseIntHeader(hangingGet, "Pragma");
      console.log("Message from:", peer_id, ":", hangingGet.responseText);
      if (peer_id === myId) {
        handleServerNotification(hangingGet.responseText);
      } else {
        handlePeerMessage(peer_id, hangingGet.responseText);
      }
    }
    if (hangingGet) {
      hangingGet.abort();
      hangingGet = null;
    }
    if (myId !== -1) {
      window.setTimeout(startHangingGet, 0);
    }
  } catch (_error) {
    e = _error;
    trace("Hanging get error: " + e.message);
  }
};

startHangingGet = function() {
  var e;
  try {
    hangingGet = new XMLHttpRequest();
    hangingGet.onreadystatechange = hangingGetCallback;
    hangingGet.ontimeout = onHangingGetTimeout;
    hangingGet.open("GET", "" + server + "/wait?peer_id=" + myId, true);
    DEBUGLOG("server is " + server);
    hangingGet.send();
  } catch (_error) {
    e = _error;
    trace("error" + e.message);
  }
};

onHangingGetTimeout = function() {
  trace("hanging get timeout. issuing again.");
  hangingGet.abort();
  hangingGet = null;
  if (myId !== -1) {
    window.setTimeout(startHangingGet, 0);
  }
};

signInCallback = function() {
  var e, i, parsed, peers;
  try {
    if (request.readyState === 4) {
      if (request.status === 200) {
        peers = request.responseText.split("\n");
        myId = parseInt(peers[0].split(",")[1]);
        trace("My id: " + myId);
        i = 1;
        while (i < peers.length) {
          if (peers[i].length > 0) {
            trace("Peer " + i + ": " + peers[i]);
            parsed = peers[i].split(",");
            otherPeers[parseInt(parsed[1])] = parsed[0];
          }
          ++i;
        }
        startHangingGet();
        request = null;
      }
    }
  } catch (_error) {
    e = _error;
    trace("error: " + e.message);
  }
};

signIn = function() {
  var e;
  try {
    request = new XMLHttpRequest();
    request.onreadystatechange = signInCallback;
    request.open("GET", "" + server + "/sign_in?name=" + localName + "&room=" + room);
    request.send();
  } catch (_error) {
    e = _error;
    trace("error: " + e.message);
  }
};

sendToPeer = function(peer_id, data) {
  var dataJson, e, r;
  try {
    console.log(peer_id, " Send ", data);
    if (myId === -1) {
      alert("Not connected");
      return;
    }
    if (peer_id === myId) {
      alert("Can't send a message to oneself :)");
      return;
    }
    r = new XMLHttpRequest();
    r.open("POST", server + "/message?peer_id=" + myId + "&to=" + peer_id, false);
    DEBUGLOG("server is " + server);
    r.setRequestHeader("Content-Type", "text/plain");
    r.send(data);
    console.log(peer_id, " Send ", data);
    dataJson = JSON.parse(data);
    console.log(peer_id, " send ", data);
    r = null;
  } catch (_error) {
    e = _error;
    trace("send to peer error: " + e.message);
  }
};

connect = function() {
  localName = document.getElementById("name").value.toLowerCase();
  room = document.getElementById("room").value;
  server = document.getElementById("server").value.toLowerCase();
  DEBUGLOG("server is " + server);
  if (localName.length === 0) {
    alert("I need a name please.");
    document.getElementById("name").focus();
  } else {
    document.getElementById("connect").disabled = true;
    document.getElementById("disconnect").disabled = false;
    signIn();
  }
};

disconnect = function() {
  var e;
  try {
    if (request) {
      request.abort();
      request = null;
    }
    if (hangingGet) {
      hangingGet.abort();
      hangingGet = null;
    }
    if (myId !== -1) {
      request = new XMLHttpRequest();
      request.open("GET", server + "/sign_out?peer_id=" + myId, false);
      DEBUGLOG("sign_out server is " + server);
      request.send();
      request = null;
      myId = -1;
    }
  } catch (_error) {
    e = _error;
    console.log("Failed to sign_out " + server + ", id = " + connectionId + " , msg=" + e.message);
  }
  document.getElementById("connect").disabled = false;
  document.getElementById("disconnect").disabled = true;
};

send = function() {
  var peer_id, text;
  text = document.getElementById("message").value;
  peer_id = parseInt(document.getElementById("peer_id").value);
  if (!text.length || peer_id === 0) {
    alert("No text supplied or invalid peer id");
  } else {
    sendToPeer(peer_id, text);
  }
};

toggleMe = function(obj) {
  var id, t;
  id = obj.id.replace("toggle", "msg");
  t = document.getElementById(id);
  if (obj.innerText === "+") {
    obj.innerText = "-";
    t.style.display = "block";
  } else {
    obj.innerText = "+";
    t.style.display = "none";
  }
};
