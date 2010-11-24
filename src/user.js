exports.create = function(name) {
    var sessid = Math.floor(Math.random()*999999999);
    var User = function() {
        var that = this;
        this.sessid = sessid;
        this.name = name;
        this.lastTime = (new Date()).getTime();
    }

    User.prototype = {
        getName: function() {
            return this.name;
        },
        getLastTime: function() {
            return this.lastTime;
        },
        poke: function() {
            this.lastTime = (new Date()).getTime();
        },
        getSessionId: function() {
            return this.sessid;
        },
    };

    return new User();
}
