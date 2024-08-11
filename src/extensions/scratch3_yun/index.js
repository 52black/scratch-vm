const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABh0lEQVRYR+2WvytGYRTHP98/gGxiNlESE1I2WU0mBqWIoiwmPyaLXmVAWViMysIkk0mUpCgGk03KYvrq6n15XZf7uL3uu7xP3e7wnPM9n3Pu85xzRZWXqhyfGkCtApkqYLsB6AT6gAfgUdJhlgP9JwDbw8A00JMQ7AQoSDr4C0gwgO1tYCxAfFXSXIDdu0kQgO11YCpUFFiRNB9inwpgewTYCRErs3mNPpOk8zS/EIAroC1N6If9F+ASuAaOJe3F7UIAnDF4ktuspLXyjUQA241Ae/G0L1YQIJKalLRR0vwGYHsBqHTQ8hxugG5JT99uge0tYLzCGSfJLUpa+gJguws4yyF4FGJf0lAcoADM5ARwJ6klDnABdOQE8CKpLg7wDNTnBHAqqTcOcAQM5ASwKWkiDvDf1688t0FJUcKfw8h2U/EWNP9zFXYljSY2ohya0DEwIen2t07YDywX/3YqWYyP5pM6CyID263FKRi9s65oCt5HT6n1xoVSp2HWyKF+NYBaBapegTe4K24hJbQtTgAAAABJRU5ErkJggg==';

/**
 * @typedef {object} PenState - the pen state associated with a particular target.
 * @property {Boolean} penDown - tracks whether the pen should draw for this target.
 * @property {number} color - the current color (hue) of the pen.
 * @property {PenAttributes} penAttributes - cached pen attributes for the renderer. This is the authoritative value for
 *   diameter but not for pen color.
 */

/**
 * Host for the Pen-related blocks in Scratch 3.0
 * @param {Runtime} runtime - the runtime instantiating this block package.
 * @constructor
 */
class Scratch3yunBlocks {
    constructor(runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo() {
        return {
            id: 'yun',
            name: 'yun',
            // blockIconURI: blockIconURI,
            color1:'#00BCD4',
            blocks: [
                {
                    opcode: 'yunload',
                    blockType: BlockType.REPORTER,
                    text: '获取云变量，变量名[TEXT]，来源[m]',
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'a'
                        },
                        m: {
                            type: ArgumentType.STRING,
                            defaultValue: '此作品',
                            menu: 'm2'
                        }
                    },
                },
                {
                    opcode: 'getlist',
                    blockType: BlockType.REPORTER,
                    text: '获取[TEXT]开头的云变量名，来源[m]',
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'a'
                        },
                        m: {
                            type: ArgumentType.STRING,
                            defaultValue: '此作品',
                            menu: 'm2'
                        }
                    },

                },
                {
                    opcode: 'yunsave',
                    blockType: BlockType.REPORTER,
                    text: '保存云变量，内容[TEXT]，变量名[TEXT2]，并返回错误值，来源[m]',
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'things'
                        },
                        TEXT2: {
                            type: ArgumentType.STRING,
                            defaultValue: 'a'
                        },
                        m: {
                            type: ArgumentType.STRING,
                            defaultValue: '此作品',
                            menu: 'm2'
                        }
                    }
                },
                {
                    opcode: 'yunsave2',
                    blockType: BlockType.COMMAND,
                    text: '保存云变量，内容[TEXT]，变量名[TEXT2]，来源[m]',
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'things'
                        },
                        TEXT2: {
                            type: ArgumentType.STRING,
                            defaultValue: 'a'
                        },
                        m: {
                            type: ArgumentType.STRING,
                            defaultValue: '此作品',
                            menu: 'm2'
                        }
                    },
                },
            ],
            menus: {
                m2: ['此作品','此作者']
            }
        };
    }
    auth(s) {
        let isczy;
        temp2.yunrun || (temp2.yunrun=0);
        temp2.s || (temp2.s=setInterval(()=>{temp2.yunrun=0},1000))
        if(typeof webpackJsonp!=='undefined'){
            return;
        }
        try {
            try {
                workinfo;
                temp2.isczy = 1;
            } catch (e) {
                temp2.isczy = 0;
            }
            if (isczy) {
                if (workinfo.isauthor) {
                    return true
                } else {
                    return false
                }
            } else {
                return true
            }
        } catch (e) {
            return false
        }
        
    }
    yunload(s) {
        if (!this.auth()) {
            // mdui.snackbar('创作页不可以使用云变量')
        }
        if(typeof webpackJsonp!=='undefined'){
            return;
        }
        if (temp2.yunrun <= 15) {
            temp2.yunrun++;
            return new Promise(resolve => {
                let t=0;
                if (s.m == '此作品') {
                    t=0
                } else if (s.m == '此作者') {
                    t=1
                } else {
                    resolve('');
                }
                $.ajax({
                    method: 'GET',
                    url: temp2.apihost+"cloud/load",
                    dataType: 'json',
                    data: {
                        t:t,
                        id:t?workinfo.author:id,
                        name:s.TEXT,
                        token:getCookie('token')
                    },
                    success: function (data) {
                        resolve(data.data);
                    },
                    Error: function () {
                        resolve('');
                    }
                }).then(res=>{console.log(res);return res;});
            });
        } else {
            mdui.snackbar('请求频率过高')
            return '';
        }
    }
    getlist(s) {
        if (!this.auth()) {
            // mdui.snackbar('创作页不可以使用云变量')
        }
        if(typeof webpackJsonp!=='undefined'){
            return;
        }
        if (temp2.yunrun <= 15) {
            temp2.yunrun++;
            return new Promise(resolve => {
                let t=0;
                if (s.m == '此作品') {
                    t=0
                } else if (s.m == '此作者') {
                    t=1
                } else {
                    resolve('');
                }
                $.ajax({
                    method: 'GET',
                    url: temp2.apihost+"cloud/loadlist",
                    dataType: 'json',
                    data: {
                        t:t,
                        id:t?workinfo.author:id,
                        name:s.TEXT,
                        token:getCookie('token')
                    },
                    success: function (data) {
                        resolve(data.data);
                    },
                    Error: function () {
                        resolve('');
                    }
                }).then(res=>{console.log(res);return res;});
            });
        } else {
            mdui.snackbar('请求频率过高')
            return '';
        }
    }
    yunsave(s) {
        if(typeof webpackJsonp!=='undefined'){
            return;
        }
        if (!this.auth()) {
            mdui.snackbar('创作页不可以使用云变量保存功能')
            return;
        }
        if (temp2.yunrun <= 15) {
            temp2.yunrun++;
            return new Promise(resolve => {
                let t=0;
                if (s.m == '此作品') {
                    t=0
                } else if (s.m == '此作者') {
                    t=1
                } else {
                    resolve('');
                }
                $.ajax({
                    method: 'POST',
                    url: temp2.apihost+"cloud/save?token="+getCookie('token'),
                    dataType: 'json',
                    data: {
                        t:t,
                        id:t?workinfo.author:id,
                        name:s.TEXT2,
                        data:s.TEXT,
                        token:getCookie('token')
                    },
                    success: function (data) {
                        data.msg && resolve(data.msg);
                        resolve()
                    },
                    Error: function () {
                        resolve('保存错误');
                    }
                }).then(res=>{console.log(res);return res;});
            });
        } else {
            mdui.snackbar('请求频率过高')
            return '';
        }
    }
    yunsave2(s){
        return this.yunsave(s)
    }
}

module.exports = Scratch3yunBlocks;
