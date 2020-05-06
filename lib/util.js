const appConfig = require(__dirHybridCache + '/config/app');

module.exports.delTag = function(self, tag) {
    let keys = self.keys();
    let pattern = getPattern(tag);
    let dKeys = filterByPattern(keys, pattern);
    for (let key of dKeys) {
        self.del(key);
    }
}

module.exports.keyByPattern = function(self, tag) {
    let keys = self.keys();
    let pattern = getPattern(tag, true);
    return filterByPattern(keys, pattern);
}

function getPattern(pattern, exact = false) {
    if (pattern) {
        pattern = pattern.replace(/\*/g, '(.*)');
        pattern = '^' + pattern;
    }
    if (exact) {
        pattern = pattern + '$';
    }
    return pattern;
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