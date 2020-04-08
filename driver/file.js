const fs = require('fs');
const {exec} = require('child_process');
const Util = require(__dir + '/lib/util.js');

class FileManager {
    constructor(options) {
        if (typeof options === 'number') {
            options = {limit: options}
        }
        if (!options) {
            options = {}
        }
        //default 24h
        this.maxAge = options.maxAge || 24 * 60 * 60 * 1000;
        this.path = options.path || __dir + '/resource/cache/';
        this.fs = fs;
        this.reset()
    }

    reset() {
        this.data = new Map();
    }

    keys(pattern) {
        if (!pattern) {
            return this.data.keys();
        }
        return Util.keyByPattern(this, pattern);
    }

    has(key) {
        let filePath = this.filePath(key);
        let isExists = fs.existsSync(filePath);
        let retVal = false;
        if (isExists) {
            let stat = fs.statSync(filePath);
            let node = this.data.get(key);
            if (!isStale(this, node, stat)) {
                retVal = true;
            } else {
                this.del(key);
            }
        }
        return retVal;
    }

    setNode(key, value, maxAge) {
        const node = new Node(key, maxAge);
        this.data.set(node.key, node);
    }

    //maxAge is ms
    set(key, value, maxAge) {
        let filePath = this.filePath(key);
        if (value && typeof value == 'object') {
            value = JSON.stringify(value);
        }
        fs.writeFile(filePath, value, function (err) {
            if (err) {
                return Util.log(err);
            }
            Util.log(key + " was saved!");
        });
        this.setNode(key, value, maxAge);
    }


    get(key) {
        let retVal = undefined;
        if (this.has(key)) {
            let filePath = this.filePath(key);
            retVal = fs.readFileSync(filePath, 'utf8');
            retVal = this.decode(retVal);
        }
        return retVal;
    }

    decode(value) {
        if (value && value.charAt(0) == '{') {
            try {
                value = JSON.parse(value)
            }catch (e) {
                Util.log('decode err', e, ' value: ', value);
            }
        }
        return value;
    }

    del(key) {
        let filePath = this.filePath(key);
        let isExists = fs.existsSync(filePath);
        if (isExists) {
            fs.unlink(filePath, (err) => {
                if (err) throw err;
                Util.log(key + ' was deleted');
            });
        }
    }

    delTag(tag) {
        Util.delTag(this, tag);
        this.delFileFromTag(tag);
    }

    delFileFromTag(label) {
        let filePath = this.filePath(label) + '*';
        exec("rm -f " + filePath, (error, stdout, stderr) => {
            if (error) {
                Util.error(`delTag ${label} exec error: ${error}`);
                return;
            }
            Util.log(`delTag ${label} success`);
        });
    }

    filePath(key) {
        if (key && key.replace) {
            key = key.replace(/[/\\?%*|"<>]/g, '-');
        }
        return this.path + key;
    }

}

const isStale = (self, node, stats) => {
    let maxAge = node && node.maxAge ? node.maxAge : self.maxAge;
    let cTime = stats && stats.ctimeMs ? stats.ctimeMs : 0;

    const diff = Date.now() - cTime;
    if (diff > maxAge) {
        return true;
    }
    return false;
}

class Node {
    constructor(key, maxAge) {
        this.key = key;
        this.createdAt = Date.now();
        this.maxAge = maxAge || 0;
    }
}


module.exports = FileManager;