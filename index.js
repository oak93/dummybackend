"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

const DummyBackend = function () {
  let instance = null;

  function sDummyBackend(_ref) {
    let {
      persister
    } = _ref;
    if (instance) return instance;else instance = this;
    this.initialFetch = global.fetch;
    this.initialXHRSend = global.XMLHttpRequest.prototype.send;

    this.subscribeToFetch = function () {
      const pst = _choosePersister(persister);

      global.fetch = function (_fetch) {
        return function () {
          console.log("Hey, you called fetch!");
          return _fetch.apply(this, arguments).then(response => {
            if (response.ok) {
              const pBody = response.clone().json();
              pBody.then(pData => pst(response.url, pData));
            }

            return response;
          });
        };
      }(global.fetch);
    };

    this.unSubscribeFromFetch = function () {
      global.fetch = this.initialFetch;
    };

    this.subscribeToXHR = function () {
      const send = global.XMLHttpRequest.prototype.send;

      function sendReplacement() {
        if (this.onreadystatechange) {
          this._onreadystatechange = this.onreadystatechange;
        }

        this.onreadystatechange = onReadyStateChangeReplacement;
        return send.apply(this, arguments);
      }

      ;

      function onReadyStateChangeReplacement() {
        if (this._onreadystatechange) {
          if (this.readyState == 4 && this.status == 200) {
            console.log('Hey, you called XHR!', this.responseText);
          }

          return this._onreadystatechange.apply(this, arguments);
        }
      }

      global.XMLHttpRequest.prototype.send = sendReplacement;
    };

    this.unSubscribeFromXHR = function () {
      global.XMLHttpRequest = this.initialXHR;
    };
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
      localStorage.setItem(recordName, JSON.stringify({
        [url]: data
      }));
      return;
    }

    var recordedData = JSON.parse(localStorage.getItem(recordName));
    recordedData[url] = data;
    localStorage.setItem(recordName, JSON.stringify(recordedData));
  }

  return sDummyBackend;
}();

var _default = DummyBackend;
exports.default = _default;
