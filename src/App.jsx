import React, { useEffect, useRef, useState } from "react";
import JsSIP from "jssip";

export default function App() {
  const uaRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [status, setStatus] = useState("Disconnected");
  const [target, setTarget] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [incomingSession, setIncomingSession] = useState(null);
  const [activeSession, setActiveSession] = useState(null);

  const register = () => {
    const socket = new JsSIP.WebSocketInterface("wss://192.168.9.200:8089/ws");

    const configuration = {
      sockets: [socket],
      uri: `sip:${userName}@192.168.9.200`,
      password: password,
    };

    const ua = new JsSIP.UA(configuration);

    ua.on("registered", (data) => {
      console.log("registered, response -> ", data.response);
      setStatus("endpoint registered ");
    });

    ua.on("registrationFailed", (e) => {
      setStatus("can't register this endpoint ");
      console.error("register fail :", e.cause);
    });

    // fired for an incoming or outgoing call
    ua.on("newRTCSession", (data) => {
      const session = data.session;

      session.on("track", (e) => {
        if (e.track.kind === "audio" && remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = e.streams[0];
          remoteAudioRef.current.play().catch(() => { });
        } else {
          console.log("depug the audio");
        }
      });

      session.on("ended", () => {
        setActiveSession(null);
        setIncomingSession(null);
        setStatus("registered");
      });

      if (data.originator === "remote") {
        setIncomingSession(session);
        setStatus("incoming call");
        console.log("call from a peer : now answering");
      } else {
        setActiveSession(session);
        setStatus("calling ...");
      }
    });
    console.log("connecting to the signaling server");
    ua.start();
    uaRef.current = ua;
  };

  const makeCall = () => {
    const session = uaRef.current.call(`sip:${target}@192.168.9.200`, {
      mediaConstraints: { audio: true, video: false },
    });
    setActiveSession(session);
  };

  const anserCall = () => {
    incomingSession.answer({
      mediaConstraints: { audio: true, video: false },
    });
    setActiveSession(incomingSession);
    setIncomingSession(null);
    setStatus("talking ...");
  };

  const hungUp = () => {
    if (activeSession) {
      activeSession.terminate();
      setActiveSession(null);
      setStatus("registered");
    }
  };

  return (
    <div>
      <h2 style={{ textAlign: "center" }}>endpoint status : {status}</h2>

      {status === "Disconnected" && (
        <div>
          <input
            type="text"
            value={userName}
            placeholder="username (6002)"
            onChange={(e) => setUserName(e.target.value)}
          />

          <input
            value={password}
            type="password"
            placeholder="password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="button" onClick={register}>
            register
          </button>
        </div>
      )}

      {status === "registered" && (
        <div>
          <input
            type="text"
            value={target}
            placeholder="target (6001)"
            onChange={(e) => setTarget(e.target.value)}
          />

          <button type="button" onClick={makeCall}>
            Call
          </button>
        </div>
      )}

      {status === "incoming call" && (
        <div>
          <button type="button" onClick={anserCall}>
            anserCall
          </button>
          <button type="button" onClick={hungUp}>
            hangup
          </button>
        </div>
      )}

      {activeSession && (
        <div>
          <button type="button" onClick={hungUp}>
            hangup
          </button>
        </div>
      )}
      <audio ref={remoteAudioRef} autoPlay controls playsInline muted={false} />
    </div>
  );
}
