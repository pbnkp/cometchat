require('./common');

sys = require('sys');
user = require('user');

username = "test";
testuser = user.create(username);

assert.strictEqual( testuser.getName(), username);
var now = new Date();
var deltaTime =  now - testuser.getLastTime();
assert.ok( deltaTime >= 0, deltaTime );
assert.ok( deltaTime <= 5, deltaTime );

