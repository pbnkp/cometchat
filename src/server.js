var sys = require('sys');
var createServer = require('http').createServer;
var fs = require('fs');
var urlParse = require('url').parse;

var path = require('path');
var dn = path.dirname;
var basedir = dn(dn(__filename));

var makeServer = function() {
  var handlers = {},
      errorHandlers = {},
      htdocs = fs.realpathSync( basedir + "/src/client");
  //sys.puts("HTDOCS: " + htdocs);

  errorHandlers[404] = function(req, res) {
      res.send(404, "text/html", "Error 404 - Not Found");
  }
  errorHandlers[405] = function(req, res) {
      res.send(405, "text/html", "Error 405 - Method Not Allowed");
  }

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

    path = urlParse(req.url).pathname;
    if(handlers[path]) {
      if(handlers[path][req.method]) {
        cb = handlers[path][req.method];
      } else {
        cb = errorHandlers[405];
      }
    } else {
      cb = errorHandlers[404];
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
  }

  srv.staticServer = function(relPath) {
    return function(req, res) {
      path = htdocs + "/" + relPath;
      //sys.puts("Serving static: " + path);
      fs.realpath(path, function(err, path) {
        if(path && path.match("^"+htdocs) == htdocs) {
            fs.readFile(path, function(err, data) {
              if(err) {
                //sys.puts("Error reading " + path);
                errorHandlers[404](req,res);
              } else {
                res.send(200, srv.mime(path), data);
              }
            });
        } else {
            //sys.puts("No match on " + path + " for " + htdocs);
            errorHandlers[404](req,res);
        }
      });
    }
  };
  srv.setHandler("GET", "/", srv.staticServer("index.html"));
  srv.setHandler("GET", "/index.html", srv.staticServer("index.html"));
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
