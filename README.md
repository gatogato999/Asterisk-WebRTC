# Asterisk-WebRTC

A browser phone that connect clients to asterisk.

## Functionalities

- [x] Register an endpoint with name and password
- [x] Make a call by entering target phone
- [x] Receive a call with `asnwer` button
- [x] Cancel a call with `hangup` button
- [x] Make GUI dial buttons
- [ ] Fix the received audio problem
- [x] Add better CSS
- [ ] Refactor

## Reproduce

```md
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

```md
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

```md
; extensions.conf
[default]
exten => 111,1,Answer()
same => n, Playback(hello-world)
same => n, Hangup()

exten => 6XXX,1,Dial(PJSIP/{$EXTEN})
```

```md
; rtp.conf
[general]
rtpstart=10000
rtpend=20000

icesupport=yes
stunaddr=stun.1.google.com:19302
```

## Certificate Generation

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

1. restart the srevice after modifications

```bash
sudo systemctl restart asterisk
```

2. is it running ? `netstat -an | grep 8089 or ss -ant | grep 8089`
3. verify the load of modules with

```bash
sudo asterisk -rx "module show like crypto
# same for : websocket and opus
"
```

4. check the firewall settings
5. the /keys directory should be readable to Asterisk (chmod 644 /keys/\*)
6. useful commands inside the asterisk cli:

```bash
http status show
rtp set debug on
pjsip show endpoints
core restart now
```

6. use inside Asterisk cli to see if https is working
