global.__dir = __dirname;
const File = require(__dirname + '/driver/file');
const LRU = require(__dirname + '/driver/lru');
const TagManager = require(__dirname + '/lib/tag');
const Util = require(__dir + '/lib/util.js');
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
        this.data = new Map();
    }

    keys() {
        return this.data.keys();
    }

    setNode(key, value, maxAge) {
        const node = new Node(key, maxAge);
        this.data.set(node.key, node);
    }


    set(key, value, maxAge) {
        maxAge *= 1000;
        this.lruCache.set(key, value, maxAge);
        this.fileCache.set(key, value, maxAge);
        this.setNode(key, value, maxAge);
    }

    put(key, value, maxAge) {
        this.set(key, value, maxAge);
    }

    get(key) {
        let retVal = this.lruCache.get(key);
        if (!retVal) {
            retVal = this.fileCache.get(key);
            if (retVal) {
                this.setAge(key, retVal);
            }
        }
        return retVal;
    }

    delTag(tag) {
        Util.delTag(this, tag);
        this.fileCache.delFileFromTag(tag);
    }

    forget(key) {
        this.lruCache.del(key);
        this.fileCache.del(key);
        this.data.delete(key);
    }

    del(key) {
        this.forget(key);
    }

    tags(tags) {
        return new TagManager(this, tags)
    }

    setAge(key, value) {
        let node = this.data.get(key);
        let maxAge = node ? node.maxAge - node.createdAt : this.maxAge;
        if (!node) {
            this.setNode(key, value, maxAge);
        }
        this.lruCache.set(key, value, maxAge);
    }


}

class Node {
    constructor(key, maxAge) {
        this.key = key;
        this.createdAt = Date.now();
        this.maxAge = maxAge || 0;
    }
}
module.exports = HyBridCache;





