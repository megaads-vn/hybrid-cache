const Util = require(__dirHybridCache + '/lib/util.js')

class LRUCache {
    constructor(options) {
        if (typeof options === 'number') {
            options = {limit: options}
        }

        if (!options) {
            options = {}
        }
        this.limit = options.limit || 1024 * 1024 * 1024;
        this.maxAge = options.maxAge || 24 * 60 * 60 * 1000;
        this.reset()
    }

    reset() {
        this.tail = null;
        this.head = null;
        this.data = new Map();
        this.itemCount = 0;
        this.length = 0;
    }

    count() {
        return this.itemCount
    }

    keys(pattern) {
        if (!pattern) {
            return this.data.keys();
        }
        return Util.keyByPattern(this, pattern);
    }

    values() {
        return this.data.values()
    }

    has(key) {
        if (!this.data.has(key)) return false;
        const node = this.data.get(key)
        return !isStale(this, node)
    }

    set(key, value, maxAge = 1000) {
        if (maxAge && typeof maxAge !== 'number') {
            throw new TypeError('maxAge must be a number')
        }
        maxAge *= 1000;
        const now = Date.now();
        const vLength = value.length;
        const node = new Node(key, value, vLength, now, maxAge);
        if (this.data.has(key)) {
            this.del(key)
        }
        if (this.validateLength(vLength)) {
            this.moveHead(node);
            return true;
        }
        return false;
    }

    get(key) {
        let node = this.data.get(key);
        if (node) {
            if (isStale(this, node)) {
                this.del(key);
            } else {
                this.moveHead(node);
                return node.value;
            }
        }
        return undefined
    }


    del(key) {
        let node = this.data.get(key);
        if (node) {
            if (node.prev !== null) {
                node.prev.next = node.next;
            } else {
                this.head = node.next;
            }

            if (node.next !== null) {
                node.next.prev = node.prev;
            } else {
                this.tail = node.prev;
            }
            this.length -= node.length;
            this.itemCount--;
            this.data.delete(key);
        }

    }

    delTag(tag) {
        Util.delTag(this, tag);
    }

    flush() {
        this.reset();
    }


    moveHead(node) {
        node.next = this.head;
        node.prev = null;
        if (this.head != null) {
            this.head.prev = node;
        }
        if (this.tail === null) {
            this.tail = node;
        }
        this.head = node;
        this.data.set(node.key, node);
        this.itemCount++;
        this.length += node.length;
    }

    validateLength(vLength) {
        if (this.length + vLength > this.limit) {
            Util.log('Error validateLength', this.length + vLength, this.limit);
            return false;
        }
        return true;
    }


}

const isStale = (self, node) => {
    if (!node || !node.maxAge) {
        return false
    }

    const diff = Date.now() - node.createdAt;
    return node.maxAge ? diff > node.maxAge : self.maxAge && (diff > self.maxAge)
}

class Node {
    constructor(key, value, length, createdAt, maxAge) {
        this.key = key;
        this.value = value;
        this.length = length;
        this.createdAt = createdAt;
        this.maxAge = maxAge || 0;
        this.next = null;
        this.prev = null;
    }
}


module.exports = LRUCache