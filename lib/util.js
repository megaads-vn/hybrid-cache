const appConfig = require(__dirHybridCache + '/config/app');

module.exports.delTag = function(self, tag) {
    let keys = self.keys();
    let pattern = '^' + tag;
    let dKeys = filterByPattern(keys, pattern);
    for (let key of dKeys) {
        self.del(key);
    }
}

module.exports.keyByPattern = function(self, tag) {
    let keys = self.keys();
    let pattern = '^' + tag;
    return filterByPattern(keys, pattern);
}

function filterByPattern(items, pattern) {
    let regex = new RegExp(pattern);
    let result = [];
    for (let val of items) {
        if (regex.test(val)) {
            result.push(val);
        }
    }
    return result;
}

module.exports.log = function() {
    if (appConfig.debug) {
        console.log(...arguments)

    }
}