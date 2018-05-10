class Comm {
    static get MESSAGE() {
        return {
            CONNECT: "establish:connection"
        };
    }
    constructor(host = window, targetWindow = null, targetOrigin = '*') {
        this.targetWindow = targetWindow;
        this.targetOrigin = targetOrigin;
        this.host = host;
        this.handlers = {};
        this.deferredMessages = [];
        this.listen();

        if(!targetWindow) {
            this.waitConnection();
        } else {
            this.connect();
        }

    }
    connect() {
        this.send(Comm.MESSAGE.CONNECT, true);
    }
    waitConnection() {
        this.on(Comm.MESSAGE.CONNECT, source => {
            this.targetWindow = source;
            this.sendDeferred();
        });
    }
    listen() {
        this.host.addEventListener('message', e => {
            let data = {};
            try {
                data = JSON.parse(e.data);
            } catch (e){
                return;
            }
            if(!this.handlers[data.message]) {
                console.log("Comm: No listener for messasge: ", data.message);
            } else if(this.handlers[data.message] && data.message === Comm.MESSAGE.CONNECT) {
                this.handlers[data.message].forEach(cb => {
                    cb.call(this, e.source);
                });
            } else {
                this.handlers[data.message].forEach(cb => {
                    cb.call(this, ...data.data);
                });
            }
        });
    }
    sendDeferred() {
        this.deferredMessages.forEach(m => {
            this.send(m.message, ...m.data);
        });
        this.deferredMessages = [];
    }
    send(message, ...data) {
        if(!this.targetWindow) {
            this.deferredMessages.push({message: message, data: data});
            console.log("Comm: Message delayed till connection establish!");
            return;
        }

        this.targetWindow.postMessage(JSON.stringify({
            message: message,
            data: data
        }), this.targetOrigin);
    }
    on(message, callback) {
        this.handlers[message] = [];
        this.handlers[message].push(callback);
    }
}
