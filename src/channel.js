exports.create = function(name) {
    users = [];
    messages = [];
    return {
        getName : function() {
            return name;
        },

        addUser : function(user) {
            // De-dupe additions
            for( i in users ) {
                if(user === users[i]) {
                    return;
                }
            }
            users.unshift(user);
        },

        getUsers : function() {
            return users;
        },

        getMessages : function() {
            return messages;
        }
    }
}
