crypto = require('crypto');

exports.create = function(name) {
    lastTime = new Date();
    sessionId = Math.floor(Math.random()*999999999);
    return {
        getName: function() {
            return name;
        },
        getLastTime: function() {
            return lastTime;
        },
        poke: function() {
            lastTime = new Date();
        },
        getSessionId: function() {
            return sessionId;
        }
    }
}
