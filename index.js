global.__dirHybridCache = __dirname;
const File = require(__dirHybridCache + '/driver/file');
const LRU = require(__dirHybridCache + '/driver/lru');
const TagManager = require(__dirHybridCache + '/lib/tag');
const Util = require(__dirHybridCache + '/lib/util.js');
class HybridCache {
    constructor(options) {
        if (typeof options === 'number') {
            options = {limit: options}
        }

        if (!options) {
            options = {}
        }
        //default 24h
        this.maxAge = options.maxAge ? options.maxAge : 24 * 60 ;
        this.maxAge *=  1000;
        options.maxAge = this.maxAge;
        //options.limit (mb)
        options.limit = options.limit ? options.limit : 1024;
        options.limit *= 1024 * 1024;
        this.fileCache = new File(options);
        this.lruCache = new LRU(options);
        this.data = new Map();
        global.__debug = options.debug ? options.debug : false;
    }

    keys(pattern) {
        if (!pattern) {
            return this.data.keys();
        }
        return Util.keyByPattern(this, pattern);
    }

    setNode(key, value, maxAge) {
        const node = new Node(key, maxAge);
        this.data.set(node.key, node);
    }


    set(key, value, maxAge) {
        if (maxAge && typeof maxAge !== 'number') {
            throw new TypeError('maxAge must be a number')
        }
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
            Util.log('file:', key);
            retVal = this.fileCache.get(key);
            if (retVal) {
                this.setAge(key, retVal);
            }
        } else {
            Util.log('ram:', key);
        }
        return retVal;
    }

    meta() {
        let result = [];
        let keys = this.data.keys();
        if (keys) {
            for (let key of keys) {
                let node = this.data.get(key);
                if (node) {
                    result.push({
                        key: node.key,
                        created_at: node.createdAt
                    })
                }
            }
        }
        return result;
    }

    info() {
        return this.lruCache.info();
    }

    resize() {
        return this.lruCache.autoResize();
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
        if (!node) {
            this.setNode(key, value, this.maxAge);
        }
        this.lruCache.set(key, value, this.maxAge);
    }

    flush() {
        this.lruCache.flush();
        this.fileCache.flush();
        this.data = new Map();
    }

    setOptions(options) {
        if (!options) {
            options = {}
        }
        if (options.limit) {
            options.limit *= 1024 * 1024;
        }
        if (options.maxAge) {
            this.maxAge = options.maxAge;
            this.maxAge *=  1000;
            options.maxAge = this.maxAge;
        }
        this.lruCache.setOptions(options);
        this.fileCache.setOptions(options);
    }

}

class Node {
    constructor(key, maxAge) {
        this.key = key;
        this.createdAt = Date.now();
        this.maxAge = maxAge || 0;
    }
}

module.exports = HybridCache;





