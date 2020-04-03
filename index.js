global.__dir = __dirname;
const File = require(__dirname + '/driver/file');
const LRU = require(__dirname + '/driver/lru');
const TagManager = require(__dirname + '/lib/tag');

class HyBridCache {
    constructor(options) {
        if (typeof options === 'number') {
            options = {limit: options}
        }

        if (!options) {
            options = {}
        }
        //options.limit (mb)
        this.limit = options.limit * 1024 * 1024 || 1 * 1024 * 1024 * 1024;
        //default 24h
        this.maxAge = options.maxAge * 1000 || 24 * 60 * 60 * 1000;
        this.fileCache = new File(options);
        this.lruCache = new LRU(options);
        let debug = options.debug || false;
        if (!debug) {
            console.log = function() {}
        }
    }


    set(key, value, maxAge) {
        maxAge *= 1000;
        this.lruCache.set(key, value, maxAge);
        this.fileCache.set(key, value, maxAge);
    }

    put(key, value, maxAge) {
        this.set(key, value, maxAge);
    }

    get(key) {
        let retVal = this.lruCache.get(key);
        if (!retVal) {
            retVal = this.fileCache.get(key);
        }
        return retVal;
    }

    delTag(tag) {
        this.lruCache.delTag(tag);
        this.fileCache.delTag(tag);
    }

    forget(key) {
        this.lruCache.del(key);
        this.fileCache.del(key);
    }

    tags(tags) {
        return new TagManager(this, tags)
    }


}

module.exports = HyBridCache;





