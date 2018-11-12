class Comm {
    constructor(host = window, targetFrame = null, targetOrigin = '*') {
        this.targetOrigin = targetOrigin;
        this.targetFrame = targetFrame;
        this.host = host;
        this.handlers = {};
        this.deferredMessages = [];
        this.listen();

        if (!this.targetFrame) {
            this.waitConnection();
        } else {
            this.connect();
        }

    }

    static get MESSAGE() {
        return {
            CONNECT: "establish:connection"
        };
    }

    connect() {
        this.send(Comm.MESSAGE.CONNECT, true);
    }

    waitConnection() {
        this.on(Comm.MESSAGE.CONNECT, frame => {
            this.targetFrame = frame;
            this.sendDeferred();
        });
    }

    listen() {
        this.host.addEventListener('message', e => {
            let data = {};
            try {
                data = JSON.parse(e.data);
            } catch (e) {
                return;
            }
            if (!this.handlers[data.message]) {
                console.log("Comm: No listener for messasge: ", data.message);
            } else if (this.handlers[data.message] && data.message === Comm.MESSAGE.CONNECT) {
                this.handlers[data.message].forEach(cb => {
                    if(e.source !== e.origin) {
                        cb.call(this, this.crossFrame(e.origin));
                    } else {
                        cb.call(this, e.source);
                    }
                });
            } else {
                this.handlers[data.message].forEach(cb => {
                    cb.call(this, ...data.data);
                });
            }
        });
    }

    crossFrame(host) {
        let iframes = document.querySelectorAll('iframe')
        for (let i = 0; i < iframes.length; i++) {
            if (iframes[i].src.indexOf(host)==0) {
                return iframes[i];
            }
        }
    }

    sendDeferred() {
        this.deferredMessages.forEach(m => {
            this.send(m.message, ...m.data);
        });
        this.deferredMessages = [];
    }

    send(message, ...data) {
        if (!this.targetFrame) {
            this.deferredMessages.push({message: message, data: data});
            console.log("Comm: Message delayed till connection establish!");
            return;
        }

        this.targetFrame.contentWindow.postMessage(JSON.stringify({
            message: message,
            data: data
        }), this.targetOrigin);
    }

    on(message, callback) {
        this.handlers[message] = [];
        this.handlers[message].push(callback);
    }
}
