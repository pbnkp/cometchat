var sys = require('sys');
var createServer = require('http').createServer;
var fs = require('fs');
var urlParse = require('url').parse;

var path = require('path');
var dn = path.dirname;
var basedir = dn(dn(__filename));

var makeServer = function() {
  var getMap = {};
  var postMap = {};
  var htdocs = fs.realpathSync( basedir + "/src/client");
  //sys.puts("HTDOCS: " + htdocs);

  srv = createServer(function(req, res) {
    path = urlParse(req.url).pathname;
    //sys.puts("Request: " + path);
    var urlMap = {};
    if(req.method === "GET") {
      urlMap = getMap;
    } else if(req.method === "POST") {
      urlMap = postMap;
    }
    callback = urlMap[path];
    if(callback) {
      callback(req, res);
    } else {
      srv.staticServer(path)(req, res);
    }
  });

  srv.setHandler = function(method, path, callback) {
    if(method === "GET") {
      getMap[path] = callback;
    }
    if(method === "POST") {
      postMap[path] = callback;
    }
  };

  srv.mime = function(filename) {
    return {
      ".html": "text/html",
      ".css": "text/css",
      ".png": "image/png",
      ".js": "application/javascript"
    }[filename.substring(filename.lastIndexOf(".")).toLowerCase()] || "application/octet-stream";
  }

  srv.staticServer = function(relPath) {
    return function(req, res) {
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
      res.sendNotFound = function() {
        res.send(404, "text/html", "Error 404 - Not Found");
      };
      path = htdocs + "/" + relPath;
      //sys.puts("Serving static: " + path);
      fs.realpath(path, function(err, path) {
        if(path && path.match("^"+htdocs) == htdocs) {
            fs.readFile(path, function(err, data) {
              if(err) {
                //sys.puts("Error reading " + path);
                res.sendNotFound();
              } else {
                res.send(200, srv.mime(path), data);
              }
            });
        } else {
            //sys.puts("No match on " + path + " for " + htdocs);
            res.sendNotFound();
        }
      });
    }
  };
  srv.setHandler("GET", "/", srv.staticServer("index.html"));
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
