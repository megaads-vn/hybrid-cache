

module.exports.delTag = function(self, tag) {
    let keys = self.keys();
    let pattern = '^' + tag;
    let regex = new RegExp(pattern);
    for (let key of keys) {
        if (regex.test(key)) {
            self.del(key);
        }
    }
}

module.exports.log = function() {
}