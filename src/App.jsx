import React, { useEffect, useRef, useState } from "react";
import JsSIP from "jssip";
import NumPad from "./components/DialPad.jsx";

const SOCKURL = "wss://192.168.9.200:8089/ws";
const SIPDOMAIN = "192.168.9.200";
const USEAUDIO = true;
const USEVIDEO = false;
export default function App() {
  const uaRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [status, setStatus] = useState("Disconnected");
  const [target, setTarget] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [incomingSession, setIncomingSession] = useState(null);
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    return () => {
      if (uaRef.current && uaRef.current.isConnected()) {
        uaRef.current.stop();
        uaRef.current = null;
      }
    };
  }, []);

  const dial = (number = "") => {
    if (status === "registered") {
      setTarget(target + number);
    }
  };

  const clearTarget = () => {
    setTarget("");
  };

  const register = () => {
    if (!password || !userName) {
      alert("username and password are required !");
      return;
    }
    if (uaRef.current && uaRef.current.isStarted()) {
      uaRef.current.stop();
      uaRef.current = null;
    }
    setStatus("connecting...");
    const socket = new JsSIP.WebSocketInterface(SOCKURL);

    const configuration = {
      sockets: [socket],
      uri: `sip:${userName}@${SIPDOMAIN}`,
      password: password,
      stun_servers: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun.example.org:3478",
      ],
      connection_recovery_min_interval: 2,
      connection_recovery_max_interval: 30,
    };

    const ua = new JsSIP.UA(configuration);

    ua.on("connected", () => {
      setStatus("connected");
    });
    ua.on("disconnected", () => {
      setStatus("Disconnected");
      console.log("reconnecting...");
    });

    ua.on("registered", (data) => {
      console.log("registered, response -> ", data.response);
      setStatus("registered");
    });

    ua.on("registrationFailed", (e) => {
      setStatus("registration Failed");
      alert(`registrationFailed : ${e.cause}`);
      console.error("register fail :", e.cause);
    });

    ua.on("unregistered", () => {
      setStatus("unregistered");
      alert(`unregistered`);
    });

    // fired for an incoming or outgoing call
    ua.on("newRTCSession", (data) => {
      const session = data.session;

      session.on("peerconnection", (conn) => {
        conn.peerconnection.addEventListener("track", (e) => {
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
      });

      session.on("ended", () => {
        console.log("session ended : ");
        setActiveSession(null);
        setIncomingSession(null);
        setStatus("registered");
      });
      session.on("failed", (e) => {
        console.log(`session failed : ${e.cause}`);
        setActiveSession(null);
        setIncomingSession(null);
        remoteAudioRef.current.srcObject = null;
        setStatus("registered");
        alert(`call failed : ${e.cause}`);
      });

      session.on("accepted", () => {
        setStatus("talking ...");
      });

      if (data.originator === "remote") {
        setIncomingSession(session);
        setStatus("incoming call");
        console.log("call from a peer : now answering");
      } else {
        setActiveSession(session);
        setStatus("calling");
        console.log("sending a call");
      }
    });
    ua.start();
    console.log("connected to the signaling server");
    uaRef.current = ua;
  };

  const makeCall = async () => {
    if (!target) {
      alert("can't call with an  empty input");
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({
        audio: USEAUDIO,
        video: USEVIDEO,
      });
    } catch (err) {
      alert(`microphone access denied : ${err}`);
      return;
    }
    const session = uaRef.current.call(
      `sip:${target}@192.168.9.200`,
      USEAUDIO,
      USEVIDEO,
    );
    setActiveSession(session);
    setStatus("calling");
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

  const logout = () => {
    if (uaRef.current && uaRef.current.isConnected()) {
      uaRef.current.unregister(true);
      alert("you've logged out");
      console.info("logged out");
    }
  };

  return (
    <div className="main">
      <h4 style={{ textAlign: "center" }}>status : {status}</h4>

      {(status === "Disconnected" || status === "unregistered" ||
        status === "registration Failed") && (
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
          <button type="button" onClick={logout}>
            Unregister
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

      {(activeSession || status === "calling") && (
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
