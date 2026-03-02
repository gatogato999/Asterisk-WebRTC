import React, { useEffect, useRef, useState } from "react";
import JsSIP from "jssip";

export default function App() {
  const uaRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [status, setStatus] = useState("Disconnected");
  const [target, setTarget] = useState("6001");

  useEffect(() => {
    const socket = new JsSIP.WebSocketInterface("wss://192.168.9.200:8089/ws");

    const configuration = {
      sockets: [socket],
      uri: "sip:6002@192.168.9.200",
      password: "passpass",
    };

    const ua = new JsSIP.UA(configuration);

    ua.on("connected", () => {
      console.log("connected ");
      setStatus("connected to the socket");
    });

    ua.on("registered", () => {
      console.log("registered");
      setStatus("endpoint registered ");
    });

    ua.on("registrationFailed", (e) => {
      setStatus("can't register this endpoint ");
      console.error(e);
    });

    ua.on("newRTCSession", (data) => {
      const session = data.session;

      session.on("track", (e) => {
        remoteAudioRef.current.srcObject = e.streams[0];
      });

      if (data.originator === "remote") {
        session.answer({
          mediaConstraints: { audio: true, video: false },
        });
      }
    });

    ua.start();
    uaRef.current = ua;

    return () => {
      ua.stop();
    };
  }, []);

  const makeCall = () => {
    uaRef.current.call(`sip:${target}@192.168.9.200`, {
      mediaConstraints: { audio: true, video: false },
    });
  };

  return (
    <div>
      <h2>endpoint status : {status}</h2>

      <input value={target} onChange={(e) => setTarget(e.target.value)} />
      <button onClick={makeCall}>Call</button>

      <audio ref={remoteAudioRef} autoPlay />
    </div>
  );
}
