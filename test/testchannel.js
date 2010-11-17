require('./common');

sys = require('sys');
channel = require('channel');
user = require('user');

var chanName = "testChannel";
var testChannel = channel.create(chanName);

assert.equal( testChannel.getName(), chanName );

user1 = user.create("user1");
user2 = user.create("user2");

// Add a user to the channel
testChannel.addUser(user1);
assert.equal(testChannel.getUsers().length, 1);
assert.strictEqual(testChannel.getUsers()[0], user1);

// Add a second user
testChannel.addUser(user2);
assert.equal(testChannel.getUsers().length, 2);

// Add the same user twice (shouldn't do anything)
testChannel.addUser(user1);
assert.equal(testChannel.getUsers().length, 2);

// Messages
assert.equal(testChannel.getMessages().length, 0);
