require('./common');
var http = require('http'),
    PORT = 9999,
    HOST = "localhost",
    chatclient = http.createClient(PORT, HOST),
    util = require('util');

gently = new Gently();
chatapi = require('server');

var TESTER = { 
  count : 0,
  tested : function() {
  },
  test : function(fn) {
    var testcount = fn() || 1;
    TESTER.count += testcount;

    // Give each test some time to finish
    var timeout = setTimeout( function() {
      TESTER.finished();
    }, 2000);

    gently.expect(TESTER, 'tested', testcount, function() {
      clearTimeout(timeout);
      TESTER.count--;
      if(TESTER.count === 0) {
        TESTER.finished();
      }
    });
  },
  finished : function() {}
};

// Test functions are expected to return the number of expected callbacks
function test(fn) { TESTER.test(fn); }
function tested() { TESTER.tested(); }

TESTER.finished = function() {
  chatapi.stop();
}

var getNextPort = (function() {
  var port = 10000;
  return function() {
    return port++;
  };
})();

function Client(host, cb) {
  var self = this,
      port = getNextPort(),
      api = chatapi.makeServer(),
      client = http.createClient(port, host);
  api.listen(port, host, cb);

  self.request = function(method, url, cb) {
    var result = "";
        req = client.request(method, url);
    req.end();
    req.on("response", function(res) {
      res.on("data", function(chunk) {
        result += chunk;
      });
      res.on("end", function() {
        res.data = result;
        cb(null, res);
      });
    });
  }
  self.get = function(url, cb) {
      self.request("GET", url, cb);
  };
  self.post = function(url, cb) {
      self.request("POST", url, cb);
  };
  self.close = function() {
    api.close();
  };
}

function getClient() {
    var that = this;
    var client = new Client("localhost", function() {
      that.callback(null, client);
    });
}

function assertStatus(code) {
    return function (e, res) {
        assert.equal (res.statusCode, code);
    };
}

function contextFetch() {
    return function(client) {
      var request = this.context.name.split(/ +/);
      client[request[0].toLowerCase()](request[1], this.callback);
    }
}

vows.describe('Fetching Static').addBatch({
    "" : {
      topic : getClient,
      "GET /" : {
          topic : contextFetch(),
          "Should return 200 OK" : assertStatus(200),
          "Should contain HTML" : function(err,res) {
              assert.match(res.data, /<html>/);
              assert.match(res.data, /<\/html>/);
          }
      },
      "GET /index.html" : {
          topic : contextFetch(),
          "Should return 200 OK" : assertStatus(200),
          "Should contain HTML" : function(err,res) {
              assert.match(res.data, /<html>/);
              assert.match(res.data, /<\/html>/);
          }
      },
      "GET /style.css" : {
          topic : contextFetch(),
          "Should return 200 OK" : assertStatus(200),
          "Should contain CSS" : function(err,res) {
              assert.match(res.data, /display:/);
          }
      },
      "GET /notfound" : {
          topic : contextFetch(),
          "Should return 404 Not Found" : assertStatus(404)
      },
      "POST /notfound" : {
          topic : contextFetch(),
          "Should return 404 Not Found" : assertStatus(404)
      },
      "POST /" : {
          topic : contextFetch(),
          "Should return 405 Method Not Allowed" : assertStatus(405)
      },
      "POST /index.html" : {
          topic : contextFetch(),
          "Should return 405 Method Not Allowed" : assertStatus(405)
      },
      teardown : function(client) {
        setTimeout(client.close, 1000);
      }
    }
}).export(module);

// Get user Session
  // Post a username to /users
  // Get back a session id

// Get Channel list
  // Get /channels without sessid, access denied
  // Get /channels with sessid, get empty channel list

// Create Channel
  // POST a channel name to /channels

// Join new Channel
  // GET /channels, get channel list with 1 channel
  // GET /channels/newchannel, empty user list
  // POST to /channels/newchannel, access denied
  // POST join message to /channels/newchannel

// Send Message to Channel
  // Log in second user, join channel
  // Send message with one user, receive it with the other

// Receive Message from Channel
