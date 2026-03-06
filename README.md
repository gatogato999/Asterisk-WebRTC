# Asterisk-WebRTC

A browser phone that connect clients to asterisk.

## Functionalities

- [x] Register an endpoint with name and password
- [x] Make a call by entering target phone
- [x] Receive a call with `asnwer` button
- [x] Cancel a call with `hangup` button
- [x] Make GUI dial buttons
- [x] Fix the received audio problem
- [x] better error handling
- [x] add a `unregister` button
- [x] check for microphone permission.
- [x] add many `STUN` server backups.
- [x] added `basic-ssl` to enable `https` in development stage (see end of file).
- [ ] site should uses only microphone permission.
- [ ] Refactor the code :
  - [ ] modularize it
  - [ ] better UI
  - [ ] use alternative to `ALERT`

## Reproduce

> [!NOTE]
> here is asterisk configurations (usually in /etc/asterisk/)

```CONL
; http.conf
[general]
enabled=yes
bindaddr=0.0.0.0; http session
bindport=8080 ;
;
tlsenable=yes ; https support, must have certificates (in /keys)
tlsbindaddr=0.0.0.0:8089 ;
tlscertfile=/etc/asterisk/keys/asterisk.crt
tlsprivatekey=/etc/asterisk/keys/asterisk.key
```

```CONL
    ; pjsip.conf
    [transpot-wss]
    type=transport
    protocol=wss ; webrtc only use wss
    bind=0.0.0.0
    ;
    [6001]
    type=aor
    remove_existing=yes
    [6001]
    type=auth
    auth_type=userpass
    username=6001
    password=somepassword
    [6001]
    type=endpoint
    aors=6001
    auth=6001
    rewirte_contact=yes
    disallow=all
    allow=opus,ulaw
    context=default
    webrtc=yes
    ; same goes for 6002
```

```CONL
; extensions.conf
[default]
exten => 111,1,Answer()
same => n, Playback(hello-world)
same => n, Hangup()

exten => 6XXX,1,Dial(PJSIP/{$EXTEN})
```

```CONL
; rtp.conf
[general]
rtpstart=10000
rtpend=20000

icesupport=yes
stunaddr=stun.1.google.com:19302
```

## Certificate Generation

> [!TIP]

1. server certificates

```bash
cd /etc/asterisk/keys
sudo su
# use the script from asterisk/contrib/scripts
sudo ./ast_tls_cert -C <ip> -O "any name" -d /etc/asterisk/keys -b 2048

```

2. for client certification

```bash

# use the script from asterisk/contrib/scripts
sudo ./ast_tls_cert -m client -c /etc/asterisk/key/ca.crt \
    -k ../keys/ca.key -C <ip> -O "same name" -d ../keys \
    -o mood -b 2028
# then send the ca.crt to the client
# or :
# go to https://<ip>:8089/wss
# and add the address as an exception for the browser
```

## Notes

> [!IMPORTANT]

> 1. restart the srevice after modifications

```bash
sudo systemctl restart asterisk
```

> 2. is it running ? `netstat -an | grep 8089 or ss -ant | grep 8089`
> 3. verify the load of modules with

```bash
sudo asterisk -rx "module show like crypto
# same for : websocket and opus
"
```

> 4. check the firewall settings
> 5. the /keys directory should be readable to Asterisk (chmod 644 /keys/\*)
> 6. useful commands inside the asterisk cli:

```bash
http status show
rtp set debug on
pjsip show endpoints
core restart now
pjsip set logger on
```

## Use with caution

> [!WARNING]
>
> - TURN is normally used as the last resort when endpoints cannot talk directly.
>   > (when STUN fails);because of its drawbacks as added latency, resource intensity,
>   > and potential for unresponsiveness or high CPU usage if the TURN server
>   > is unavailable or blocked.

> - a `TURN` server (Traversal Using Relay NAT) can be configured
>   > through the `turnaddr` property in `rtp.conf` file .

> - `TURN` servers often require authentication so options are provided for
>   > configuring the username and password.`turnusername=relayme turnpassword=please`
> - The `turnport` option can also be used if the TURN server is running on a non-standard port.
>   > If omitted, Asterisk uses the standard port number `3478`.

> [!CAUTION]
>
> `getUserMedia()` does not work on insecure origins (HTTP) in modern browsers,
>
> > except for localhost for development purposes. using it without a `https`
> > will result in `TypeError: Cannot read properties of undefined
(reading 'getUserMedia')` error because your webpage is trying to
> > access the camera or microphone in an insecure context, which modern browsers
> > block for security reasons.

> to overcame this (for local tests): Using `@vitejs/plugin-basic-ssl`
>
> > which is official Vite plugin automatically creates a self-signed certificate.

```bash
pnpm install -D @vitejs/plugin-basic-ssl
# then configure vite.config.js
#  plugins: [
#   react(),
#   basicSsl()
# ],
```
