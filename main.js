const DummyBackend = (function () {
    let instance = null;

    function sDummyBackend({ persister }) {
        if (instance) return instance;
        else instance = this;

        this.initialFetch = global.fetch;
        this.initialXHRSend = global.XMLHttpRequest.prototype.send;
        const pst = _choosePersister(persister);

        this.subscribeToFetch = function () {
            global.fetch = (function (_fetch) {
                return function () {
                    console.log("Hey, you called fetch!");

                    return _fetch.apply(this, arguments)
                        .then(response => {
                            if (response.ok) {
                                const pBody = response.clone().json();
                                pBody.then(pData => pst(response.url, pData));
                            }

                            return response;
                        });
                };
            })(global.fetch);
        };

        this.unSubscribeFromFetch = function () {
            global.fetch = this.initialFetch;
        }

        this.subscribeToXHR = function () {
            const send = global.XMLHttpRequest.prototype.send;

            function sendReplacement() {
                if (this.onreadystatechange) {
                    this._onreadystatechange = this.onreadystatechange;
                }

                if (!this.onreadystatechange) {
                    if (this.onload) {
                        this._onload = this.onload;
                    } else {
                        this._onload = function () { };
                    }

                    this.onload = onLoadStateChangeReplacement;
                }

                this.onreadystatechange = onReadyStateChangeReplacement;

                return send.apply(this, arguments);
            };

            function onReadyStateChangeReplacement() {
                if (this._onreadystatechange) {
                    _XHRResultCatcher(this);

                    return this._onreadystatechange.apply(this, arguments);
                }
            }

            function onLoadStateChangeReplacement() {
                if (this._onload) {
                    _XHRResultCatcher(this);

                    return this._onload.apply(this, arguments);
                }
            }

            function _XHRResultCatcher(context) {
                if (context.readyState == 4 && context.status == 200 && !context.responseText.includes('entropy')) {
                    console.log('Hey, you called XHR!', context.responseText);
                    pst(context.responseURL, JSON.parse(context.responseText));
                }
            }

            global.XMLHttpRequest.prototype.send = sendReplacement;
        }

        this.unSubscribeFromXHR = function () {
            global.XMLHttpRequest = this.initialXHR;
        }
    }

    function _choosePersister(persisterName) {
        switch (persisterName) {
            case 'localStorage':
                return _localStoragePersister;
            default:
                break;
        }
    }

    function _localStoragePersister(url, data) {
        const recordName = 'dummybackend';

        if (!localStorage.hasOwnProperty(recordName)) {
            localStorage.setItem(recordName, JSON.stringify({ [url]: data }));

            return;
        }

        var recordedData = JSON.parse(localStorage.getItem(recordName));
        recordedData[url] = data;

        localStorage.setItem(recordName, JSON.stringify(recordedData));
    }

    return sDummyBackend;
}());

export default DummyBackend;
