import React, { useEffect, useRef, useState } from "react";
import JsSIP from "jssip";
import NumPad from "./components/DialPad.jsx";

export default function App() {
  const uaRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [status, setStatus] = useState("Disconnected");
  const [target, setTarget] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [incomingSession, setIncomingSession] = useState(null);
  const [activeSession, setActiveSession] = useState(null);

  const dial = (number = "") => {
    if (status === "registered") {
      setTarget(target + number);
    }
  };

  const clearTarget = () => {
    setTarget("");
  };

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
      setStatus("registered");
    });

    ua.on("registrationFailed", (e) => {
      setStatus("registration Failed");
      console.error("register fail :", e.cause);
    });

    // fired for an incoming or outgoing call
    ua.on("newRTCSession", (data) => {
      const session = data.session;

      session.connection.addEventListener("track", (e) => {
        const stream = e.streams[0];
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current
          .play(() => {
            console.log("sound started ");
          })
          .catch((err) => {
            console.log("Error getting the sound :", err);
          });
      });

      session.on("ended", () => {
        console.log("session ended : ");
        setActiveSession(null);
        setIncomingSession(null);
        setStatus("registered");
      });
      session.on("failed", () => {
        console.log("session failed : ");
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
        setStatus("calling");
        console.log("sending a call");
        console.log("calling someone");
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
    // setIncomingSession(null);
    setStatus("talking");
  };

  const hungUp = () => {
    if (activeSession) {
      activeSession.terminate();
      setActiveSession(null);
      setStatus("registered");
    }
  };

  return (
    <div className="main">
      <h4 style={{ textAlign: "center" }}>status : {status}</h4>

      {status === "Disconnected" && (
        <div className="stat">
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
        <div className="stat">
          <input
            type="text"
            value={target}
            placeholder="target (6001)"
            onChange={(e) => setTarget(e.target.value)}
          />

          <button type="button" onClick={clearTarget}>
            ⨉
          </button>
          <button type="button" onClick={makeCall}>
            Call
          </button>
        </div>
      )}

      {status === "incoming call" && (
        <div className="stat">
          <button type="button" onClick={anserCall}>
            anserCall
          </button>
          <button type="button" onClick={hungUp}>
            hangup
          </button>
        </div>
      )}

      {activeSession && (
        <div className="stat">
          <button type="button" onClick={hungUp}>
            hangup
          </button>
        </div>
      )}

      {status === "registered" && <NumPad dial={dial} />}
      <audio ref={remoteAudioRef} autoPlay />
    </div>
  );
}
