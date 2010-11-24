var path = require('path');
var dn = path.dirname;
var base = dn(dn(__filename));
require.paths.unshift(base +'/src');

global.Gently = require('gently');
global.assert = require('assert');
global.vows = require('vows');

// Convenience print methods
global.util = require('util');
global.puts = util.puts;
global.inspect = util.inspect;
