
request = null
hangingGet = null
localName = undefined
server = undefined
myId = -1
otherPeers = {}
messageCounter = 0


handlePeerMessage = (peer_id, data) ->
  ++messageCounter
  str = "Message from '" + otherPeers[peer_id] + "'&nbsp;"
  str += "<span id='toggle_" + messageCounter + "' onclick='toggleMe(this);' "
  str += "style='cursor: pointer'>+</span><br>"
  str += "<blockquote id='msg_" + messageCounter + "' style='display:none'>"
  str += data + "</blockquote>"
  trace str
  dataJson = JSON.parse(data)
  console.log "received ", dataJson
  unless data.search("offer") is -1
    createPeerConnection peer_id
    pc.setRemoteDescription new RTCSessionDescription(dataJson), onRemoteSdpSucces, onRemoteSdpError
    pc.createAnswer ((sessionDescription) ->
      console.log "Create answer:", sessionDescription
      pc.setLocalDescription sessionDescription
      data = JSON.stringify(sessionDescription)
      sendToPeer peer_id, data
      return
    ), ((error) -> # error
      console.log "Create answer error:", error
      return
    ), mediaConstraints # type error  ); //}, null
  else
    console.log "Adding ICE candiate ", dataJson
    candidate = new RTCIceCandidate(
      sdpMLineIndex: dataJson.sdpMLineIndex
      candidate: dataJson.candidate
    )
    pc.addIceCandidate candidate
  return
trace = (txt) ->
  elem = document.getElementById("debug")
  elem.innerHTML += txt + "<br>"
  return
handleServerNotification = (data) ->
  trace "Server notification: " + data
  parsed = data.split(",")
  otherPeers[parseInt(parsed[1])] = parsed[0]  unless parseInt(parsed[2]) is 0
  return
parseIntHeader = (r, name) ->
  val = r.getResponseHeader(name)
  (if val? and val.length then parseInt(val) else -1)

hangingGetCallback = ->
  try
    console.log(hangingGet)
    return  unless hangingGet.readyState is 4
    unless hangingGet.status is 200
      trace "server error: " + hangingGet.statusText
      disconnect()
    else
      peer_id = parseIntHeader(hangingGet, "Pragma")
      console.log "Message from:", peer_id, ":", hangingGet.responseText
      if peer_id is myId
        handleServerNotification hangingGet.responseText
      else
        handlePeerMessage peer_id, hangingGet.responseText
    if hangingGet
      hangingGet.abort()
      hangingGet = null
    window.setTimeout startHangingGet, 0  unless myId is -1
  catch e
    trace "Hanging get error: " + e.description
  return
startHangingGet = ->
  try
    hangingGet = new XMLHttpRequest()
    hangingGet.onreadystatechange = hangingGetCallback
    hangingGet.ontimeout = onHangingGetTimeout
    #hangingGet.open "GET", server + "/wait?peer_id=" + myId, true
    hangingGet.open "GET", "#{server}/wait?peer_id=#{myId}", true
    DEBUGLOG("server is #{server}")
    hangingGet.send()
  catch e
    trace "error" + e.description
  return
onHangingGetTimeout = ->
  trace "hanging get timeout. issuing again."
  hangingGet.abort()
  hangingGet = null
  window.setTimeout startHangingGet, 0  unless myId is -1
  return
signInCallback = ->
  try
    if request.readyState is 4
      if request.status is 200
        peers = request.responseText.split("\n")
        myId = parseInt(peers[0].split(",")[1])
        trace "My id: " + myId
        i = 1

        while i < peers.length
          if peers[i].length > 0
            trace "Peer " + i + ": " + peers[i]
            parsed = peers[i].split(",")
            otherPeers[parseInt(parsed[1])] = parsed[0]
          ++i
        startHangingGet()
        request = null
  catch e
    trace "error: " + e.description
  return
signIn = ->
  try
    request = new XMLHttpRequest()
    request.onreadystatechange = signInCallback
    request.open "GET", server + "/sign_in?" + localName, true
    DEBUGLOG("sign server is #{server}")
    request.send()
  catch e
    trace "error: " + e.description
  return
sendToPeer = (peer_id, data) ->
  try
    console.log peer_id, " Send ", data
    if myId is -1
      alert "Not connected"
      return
    if peer_id is myId
      alert "Can't send a message to oneself :)"
      return
    r = new XMLHttpRequest()
    r.open "POST", server + "/message?peer_id=" + myId + "&to=" + peer_id, false
    DEBUGLOG("server is #{server}")
    r.setRequestHeader "Content-Type", "text/plain"
    r.send data
    console.log peer_id, " Send ", data
    dataJson = JSON.parse(data)
    console.log peer_id, " send ", data
    r = null
  catch e
    trace "send to peer error: " + e.description
  return
connect = ->
  localName = document.getElementById("name").value.toLowerCase()
  server = document.getElementById("server").value.toLowerCase()

  DEBUGLOG("server is #{server}")

  if localName.length is 0
    alert "I need a name please."
    document.getElementById("name").focus()
  else
    document.getElementById("connect").disabled = true
    document.getElementById("disconnect").disabled = false
    
    #document.getElementById("send").disabled = false;
    signIn()
  return
disconnect = ->
  try
    if request
      request.abort()
      request = null

    if hangingGet
      hangingGet.abort()
      hangingGet = null
    unless myId is -1
      request = new XMLHttpRequest()
      request.open "GET", server + "/sign_out?peer_id=" + myId, false
      DEBUGLOG("sign_out server is #{server}")
      request.send()
      request = null
      myId = -1
  catch e
    console.log "Failed to sign_out #{server}, id = #{connectionId} , msg=#{e.message}"

  document.getElementById("connect").disabled = false
  document.getElementById("disconnect").disabled = true
  #document.getElementById("send").disabled = true
  return
send = ->
  text = document.getElementById("message").value
  peer_id = parseInt(document.getElementById("peer_id").value)
  if not text.length or peer_id is 0
    alert "No text supplied or invalid peer id"
  else
    sendToPeer peer_id, text
  return
toggleMe = (obj) ->
  id = obj.id.replace("toggle", "msg")
  t = document.getElementById(id)
  if obj.innerText is "+"
    obj.innerText = "-"
    t.style.display = "block"
  else
    obj.innerText = "+"
    t.style.display = "none"
  return
