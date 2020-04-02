"use strict";

module.exports = class TaskQueue {
    constructor(concurrency, name = 'default') {
        this.concurrency = concurrency;
        this.running = 0;
        this.name = name;
        this.queue = [];
    }

    pushTask(task) {
        this.queue.push(task);
        this.next();
    }

    size() {
        return this.queue.length;
    }

    next() {
        while (this.running < this.concurrency && this.queue.length) {
            const task = this.queue.shift();
            task().then(() => {
                this.running--;
                console.log(this.name, 'running: ', this.running, 'length: ', this.queue.length);
                this.next();

            }).catch(function(e) {
                this.running--;
                console.log('error', this.name);
            });
            this.running++;
        }
    }
};
