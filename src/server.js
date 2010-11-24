var util = require('util'),
    createServer = require('http').createServer,
    fs = require('fs'),
    urlParse = require('url').parse,
    path = require('path'),
    querystring = require('querystring');

var dn = path.dirname;
var basedir = dn(dn(__filename));

var makeServer = function() {
  var handlers = {},
      errorHandlers = {},
      htdocs = fs.realpathSync( basedir + "/src/client");

  var channels = [],
      sessions = {};

  errorHandlers[403] = function(req, res, msg) {
      res.send(403, "text/html", "Error 403 - Forbidden" + 
                    (msg ? ": " + msg : ""));
  }
  errorHandlers[404] = function(req, res) {
      res.send(404, "text/html", "Error 404 - Not Found");
  }
  errorHandlers[405] = function(req, res) {
      res.send(405, "text/html", "Error 405 - Method Not Allowed");
  }

  var addUser = function(user) {
      sessions[user.getSessionId()] = user;
  };

  srv = createServer(function(req, res) {
    res.send = function(code, mime, data) {
      res.writeHead(
        code, {
          "Content-Type": mime,
          "Content-Length": data.length
        }
      );
      res.write(data);
      res.end();
    };

    res.sendJSON = function(code, data) {
      data = JSON.stringify(data)
      res.writeHead(
        code, {
          "Content-Type": "application/json",
          "Content-Length": data.length
        }
      );
      res.end(data);
    };

    path = urlParse(req.url).pathname;
    if(handlers[path]) {
      if(handlers[path][req.method]) {
        cb = handlers[path][req.method];
      } else {
        cb = errorHandlers[405];
      }
    } else {
      cb = srv.staticServer(path)
    }

    cb(req, res);
  });

  srv.setHandler = function(method, path, cb) {
    if(!handlers[path]) {
      handlers[path] = {};
    }

    handlers[path][method] = cb;
  };

  srv.mime = function(filename) {
    return {
      ".html": "text/html",
      ".css": "text/css",
      ".png": "image/png",
      ".js": "application/javascript"
    }[filename.substring(filename.lastIndexOf(".")).toLowerCase()] || "application/octet-stream";
  };

  srv.staticServer = function(relPath) {
    return function(req, res) {
      path = htdocs + "/" + relPath;
      //util.puts("Serving static: " + path);
      fs.realpath(path, function(err, path) {
        if(path && path.match("^"+htdocs) == htdocs) {
            fs.readFile(path, function(err, data) {
              if(err) {
                //util.puts("Error reading " + path);
                errorHandlers[404](req,res);
              } else {
                // Only GETs on static resources really make sense
                if(req.method !== "GET") {
                  errorHandlers[405](req,res);
                  return;
                }
                res.send(200, srv.mime(path), data);
              }
            });
        } else {
            //util.puts("No match on " + path + " for " + htdocs);
            errorHandlers[404](req,res);
        }
      });
    }
  };

  srv.userHandler = function(req, res) {
    req.data = "";
    req.on("data", function(chunk) {
        req.data += chunk;
    });
    req.on("end", function() {
        req.data = JSON.parse(req.data);
        var newUser = user.create(req.data.name);
        addUser(newUser);
        res.sendJSON(200, newUser);
    });
  };

  srv.isValidSession = function(sessid) {
      return ('object' === typeof sessions[sessid]);
  };

  srv.channelHandler = function(req, res) {
      var url = urlParse(req.url),
          query = querystring.parse(url.query);
      if(!query.s || !srv.isValidSession(query.s)) {
          errorHandlers[403](req, res, "No session id");
          return;
      }

      res.sendJSON(200, channels);
  };

  srv.setHandler("GET", "/", srv.staticServer("index.html"));
  srv.setHandler("POST", "/users", srv.userHandler);
  srv.setHandler("GET", "/channels", srv.channelHandler);
  return srv;
};

var server = makeServer();

exports.listen = function(port, host, cb) {
  cb = cb || function() {};
  server.listen(port, host, cb);
};

exports.stop = function() {
  server.close();
}

exports.makeServer = makeServer;

PORT = 8080;
HOST = "localhost";

// This file was executed
if(__filename == process.argv[1]) {
  PORT = process.argv[2] || PORT;
  HOST = process.argv[3] || HOST;
  exports.listen(PORT, HOST);
}
