"use strict";

module.exports = class Tag {
    constructor(self, tags) {
        this.cacheManager = self;
        this.tags = tags;
    }

    flush() {
        const self = this;
        this.each(null, function (tag) {
            self.cacheManager.delTag(tag);
        })
    }

    get(key) {
        const result = [];
        const self = this;
        this.each(key, function (fKey) {
            let item = self.cacheManager.get(fKey);
            result.push(item);
        });
        return result;
    }

    put(key, value, maxAge) {
        const self = this;
        this.each(key, function (fKey) {
            self.cacheManager.put(fKey, value, maxAge);
        })
    }

    each(key, fn) {
        for (let tag of this.tags) {
            let fKey = this.buildKey(tag, key);
            fn(fKey)
        }
    }

    buildKey(tag, key = null) {
        return key ? `${tag}::${key}` : tag;
    }
};
