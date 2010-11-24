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

  self.request = function(method, url, data, cb) {
    var result = "";
        req = client.request(method, url);
    if(data) {
        req.write(data);
    }
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
  self.get = function(url, data, cb) {
      self.request("GET", url, null, cb);
  };
  self.post = function(url, data, cb) {
      self.request("POST", url, data, cb);
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

function contextFetch(postdata) {
    return function(client) {
      var request = this.context.name.split(/ +/);
      if(postdata) {
          postdata = JSON.stringify(postdata);
      }
      client[request[0].toLowerCase()](request[1], postdata, this.callback);
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

vows.describe('User Session').addBatch({
    "" : {
      topic : getClient,
      "POST /users" : {
          topic : contextFetch({name : "tester"}),
          "Returns 200 OK" : assertStatus(200),
          "Returns a JSON object" : function(err,res) {
              var data = JSON.parse(res.data);
              assert.isObject(data);
          },
          "Response contains a valid session id" : function(err,res) {
              var data = JSON.parse(res.data);
              assert.include(data, 'sessid');
              assert.isNumber(data.sessid);
          },
          "Response contains the requested name" : function(err,res) {
              var data = JSON.parse(res.data);
              assert.include(data, 'name');
              assert.equal(data.name, "tester");
          },
          "Response contains a proper last timestamp" : function(err,res) {
              var data = JSON.parse(res.data);
              assert.include(data, 'lastTime');
              assert.isNumber(data.lastTime);
          }
      },
      teardown : function(client) {
        setTimeout(client.close, 1000);
      }
    }
}).export(module);

vows.describe('Channel Fetch').addBatch({
    "" : {
      topic : getClient,
      "GET /channels without session id" : {
          topic : contextFetch(),
          "Returns 403 Forbidden" : assertStatus(403)
      },
      teardown : function(client) {
        setTimeout(client.close, 1000);
      }
    }
}).export(module);

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

// Test bad data to each location (No object, bad object, etc)
//    - Setting handlers to nonexistent functions throws 405 instead of 500
