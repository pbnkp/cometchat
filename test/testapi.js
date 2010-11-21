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

  self.get = function(url, cb) {
    var result = "";
        req = client.request("GET", url);
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
  };
  self.close = function() {
    api.close();
  };
}

// Connect to api
  // Request /
  // Get back html

vows.describe('Fetching Static').addBatch({
    "Create the client" : {
      topic : function() {
        var that = this;
        var client = new Client("localhost", function() {
          that.callback(null, client);
        });
      },
      "GET /" : {
          topic : function(client) { 
              client.get("/", this.callback);
          },
          "Should return 200 OK" : function(err,res) {
              assert.equal(res.statusCode, 200);
          },
          "Should contain HTML" : function(err,res) {
              assert.match(res.data, /<html>/);
              assert.match(res.data, /<\/html>/);
          }
      },
      "GET /index.html" : {
          topic : function(client) { 
              client.get("/", this.callback);
          },
          "Should return 200 OK" : function(err,res) {
              assert.equal(res.statusCode, 200);
          },
          "Should contain HTML" : function(err,res) {
              assert.match(res.data, /<html>/);
              assert.match(res.data, /<\/html>/);
          }
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
