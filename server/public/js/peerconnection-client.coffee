
pc = undefined
pcConfig = iceServers: [url: "stun:stun.l.google.com:19302"]
pcOptions = optional: [DtlsSrtpKeyAgreement: true]
mediaConstraints = mandatory:
  OfferToReceiveAudio: true
  OfferToReceiveVideo: true

remoteStream = undefined
RTCPeerConnection = window.mozRTCPeerConnection or window.webkitRTCPeerConnection
RTCSessionDescription = window.mozRTCSessionDescription or window.RTCSessionDescription
RTCIceCandidate = window.mozRTCIceCandidate or window.RTCIceCandidate
navigator.getUserMedia = navigator.mozGetUserMedia or navigator.webkitGetUserMedia

constraints =
  mandatory:
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true

streamOption =
  "audio": true
  "video": true


URL = window.webkitURL or window.URL
DEBUGLOG = (str) ->
  console.log("Debug: #{str}")



shareLocalMedia = (peer_connection,peer_id)->
  console.log("debug share local pc is ",peer_connection)
  navigator.getUserMedia streamOption,
    (stream)->
      localVideoElement = document.getElementById("local-video")
      localVideoElement.src = URL.createObjectURL(stream)
      localVideoElement.play()
      peer_connection.addStream(stream)
      peer_connection.createOffer (desc)->
          peer_connection.setLocalDescription(desc)
          sendToPeer peer_id, JSON.stringify(desc)
        ,(err)->
          console.error(err)
        ,constraints
    , (err)->
      conosle.log("getUserMedia faile, error is #{err.message}")

  return

createPeerConnection = (peer_id) ->
  console.log("debug : create peerconnection: peer_id = #{peer_id}")
  try
    pc = new RTCPeerConnection(pcConfig, pcOptions)
    pc.onicecandidate = (event) ->
      if event.candidate
        candidate =
          sdpMLineIndex: event.candidate.sdpMLineIndex
          sdpMid: event.candidate.sdpMid
          candidate: event.candidate.candidate

        sendToPeer peer_id, JSON.stringify(candidate)


      else
        console.log "End of candidates."
      return

    pc.onconnecting = onSessionConnecting
    pc.onopen = onSessionOpened
    pc.onaddstream = onRemoteStreamAdded
    pc.onremovestream = onRemoteStreamRemoved
    console.log "Created RTCPeerConnnection with config: " + JSON.stringify(pcConfig)
    shareLocalMedia(pc,peer_id)
  catch e
    console.log "Failed to create PeerConnection with " + connectionId + ", exception: " + e.message
  return


onRemoteStreamAdded = (event) ->
  console.log "Remote stream added:", URL.createObjectURL(event.stream)
  remoteVideoElement = document.getElementById("remote-video")
  console.log("remote video",remoteVideoElement)
  remoteVideoElement.src = URL.createObjectURL(event.stream)
  remoteVideoElement.play()
  return


onSessionConnecting = (message) ->
  console.log "Session connecting."
  return
onSessionOpened = (message) ->
  console.log "Session opened."
  return
onRemoteStreamRemoved = (event) ->
  console.log "Remote stream removed."
  return
onRemoteSdpError = (event) ->
  console.error "onRemoteSdpError", event.name, event.message
  return
onRemoteSdpSucces = ->
  console.log "onRemoteSdpSucces"
  return
