//const Variable = require('../../engine/variable');
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
//const { template } = require('@babel/core');

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSLlm77lsYJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiCgkgdmlld0JveD0iLTQxNSAyMTcgMTI4IDEyOCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAtNDE1IDIxNyAxMjggMTI4OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+Cgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0tMzA5LjIsMjc4LjVoLTYuOXYtMTguN2MwLTUtNC40LTkuNC05LjQtOS40aC0xOC43di03LjVjLTAuNi02LjktNi4yLTExLjktMTIuNS0xMS45Yy02LjksMC0xMS45LDUtMTEuOSwxMS45Cgl2Ni45aC0xOC43Yy01LjYsMC0xMCw0LjQtMTAsMTB2MTguMWg2LjljNi45LDAsMTMuMSw1LjYsMTMuMSwxMy4xYzAsNi45LTUuNiwxMy4xLTEzLjEsMTMuMWgtNi45djE4LjFjMCw0LjQsNC40LDguOCw5LjQsOC44aDE4LjEKCXYtNi45YzAtNi45LDUuNi0xMy4xLDEzLjEtMTMuMWM2LjksMCwxMy4xLDUuNiwxMy4xLDEzLjF2Ni45aDE4LjFjNSwwLDkuNC00LjQsOS40LTkuNHYtMTguN2g2LjljNi45LDAsMTEuOS01LDExLjktMTEuOQoJQy0yOTcuMywyODMuNS0zMDIuMywyNzguNS0zMDkuMiwyNzguNXogTS0zNDIuNywyOTEuNWMwLDguMS00LjMsMTQuOC0xMy42LDE0LjhjLTYuNSwwLTEwLjctMi41LTEzLjctNy42bDYuOC01LjEKCWMxLjQsMi44LDMuNiw0LjEsNS42LDQuMWMzLjIsMCw1LTEuNiw1LTdWMjY0aDEwVjI5MS41eiIvPgo8L3N2Zz4=';
const menuIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSLlm77lsYJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiCgkgdmlld0JveD0iLTQxNSAyMTcgMTI4IDEyOCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAtNDE1IDIxNyAxMjggMTI4OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxwYXRoIHN0eWxlPSJmaWxsOiMxMjk2REI7IiBkPSJNLTMwNC4yLDI3OC41aC02Ljl2LTE4LjdjMC01LTQuNC05LjQtOS40LTkuNGgtMTguN3YtNy41Yy0wLjYtNi45LTYuMi0xMS45LTEyLjUtMTEuOQoJYy02LjksMC0xMS45LDUtMTEuOSwxMS45djYuOWgtMTguN2MtNS42LDAtMTAsNC40LTEwLDEwdjE4LjFoNi45YzYuOSwwLDEzLjEsNS42LDEzLjEsMTMuMWMwLDYuOS01LjYsMTMuMS0xMy4xLDEzLjFoLTYuOXYxOC4xCgljMCw0LjQsNC40LDguOCw5LjQsOC44aDE4LjF2LTYuOWMwLTYuOSw1LjYtMTMuMSwxMy4xLTEzLjFjNi45LDAsMTMuMSw1LjYsMTMuMSwxMy4xdjYuOWgxOC4xYzUsMCw5LjQtNC40LDkuNC05LjR2LTE4LjdoNi45CgljNi45LDAsMTEuOS01LDExLjktMTEuOUMtMjkyLjMsMjgzLjUtMjk3LjMsMjc4LjUtMzA0LjIsMjc4LjV6IE0tMzM3LjcsMjkxLjVjMCw4LjEtNC4zLDE0LjgtMTMuNiwxNC44Yy02LjUsMC0xMC43LTIuNS0xMy43LTcuNgoJbDYuOC01LjFjMS40LDIuOCwzLjYsNC4xLDUuNiw0LjFjMy4yLDAsNS0xLjYsNS03VjI2NGgxMEwtMzM3LjcsMjkxLjVMLTMzNy43LDI5MS41eiIvPgo8L3N2Zz4=';

/**
 * Host for the Pen-related blocks in Scratch 3.0
 * @param {Runtime} runtime - the runtime instantiating this block package.
 * @constructor
 */
class Scratch3JsBlocks {
    constructor(runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
        //this.runtime.on('PROJECT_STOP_ALL', this._init.bind(this));
        //this.runtime.on('PROJECT_START', this._init.bind(this));
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo() {
        return {
            id: 'js',
            name: 'JavaScript',
            // blockIconURI: blockIconURI,
            // menuIconURI: menuIconURI,
            blocks: [
                {
                    opcode: 'sb',
                    blockType: BlockType.COMMAND,
                    text: '设置JS变量[a]的值是[b]',
                    arguments: {
                        a: {
                            type: ArgumentType.STRING,
                            defaultValue: 'index'
                        },
                        b: {
                            type: ArgumentType.STRING,
                            defaultValue: 'thing'
                        }
                    }
                },
                {
                    opcode: 'gv',
                    blockType: BlockType.REPORTER,
                    text: '获取JS变量[a]的值',
                    arguments: {
                        a: {
                            type: ArgumentType.STRING,
                            defaultValue: 'index'
                        }
                    }
                },
                {
                    opcode: 'dx',
                    blockType: BlockType.REPORTER,
                    text: '将字符串[a]转换成json对象',
                    arguments: {
                        a: {
                            type: ArgumentType.STRING,
                            defaultValue: '{"Fruits":["apple","banana"],"app":"scratch"}'
                        }
                    }
                },
                {
                    opcode: 'dx2',
                    blockType: BlockType.REPORTER,
                    text: 'json对象[a]的第[b]项',
                    arguments: {
                        a: {
                            type: ArgumentType.STRING,
                            defaultValue: '{"Fruits":["apple","banana"],"app":"sccode"}'
                        },
                        b:{
                            type: ArgumentType.STRING,
                            defaultValue: 'app'
                        }
                    }
                },
                {
                    opcode: 'len',
                    blockType: BlockType.REPORTER,
                    text: '[a]的长度',
                    arguments: {
                        a: {
                            type: ArgumentType.STRING,
                            defaultValue: '["a","b","c"]'
                        },
                       
                    }
                },
                {
                    opcode: 'dx3',
                    blockType: BlockType.REPORTER,
                    text: '设置json对象[a]的第[b]项为[c]并返回',
                    arguments: {
                        a: {
                            type: ArgumentType.STRING,
                            defaultValue: '{"Fruits":["apple","banana"],"app":"scratch"}'
                        },
                        b:{
                            type: ArgumentType.STRING,
                            defaultValue: 'app'
                        },
                        c:{
                            type: ArgumentType.STRING,
                            defaultValue: 'sccode'
                        }
                    }
                },
                {
                    opcode: 'tos',
                    blockType: BlockType.REPORTER,
                    text: '将json对象[a]转换成字符串',
                    arguments: {
                        a: {
                            type: ArgumentType.STRING,
                            defaultValue: ' '
                        }
                    }
                },
                {
                    opcode: 'stos',
                    blockType: BlockType.REPORTER,
                    text: '按[a]拆分[b]',
                    arguments: {
                        a: {
                            type: ArgumentType.STRING,
                            defaultValue: '_'
                        },
                        b: {
                            type: ArgumentType.STRING,
                            defaultValue: 'I_want_an_apple'
                        },
                    }
                },
                {
                    opcode: 'stos2',
                    blockType: BlockType.REPORTER,
                    text: '使用[a]连接[b]',
                    arguments: {
                        a: {
                            type: ArgumentType.STRING,
                            defaultValue: '_'
                        },
                        b: {
                            type: ArgumentType.STRING,
                            defaultValue: '["I","want","an","apple"]'
                        },
                    }
                },
                {
                    opcode: 'setv',
                    blockType: BlockType.COMMAND,
                    text: '设置局部变量[a]的值为[b]',
                    arguments: {
                        a: {
                            type: ArgumentType.STRING,
                            defaultValue: 'a'
                        },
                        b: {
                            type: ArgumentType.STRING,
                            defaultValue: 'b'
                        },
                    }
                },
                {
                    opcode: 'getv',
                    blockType: BlockType.REPORTER,
                    text: '获取局部变量[a]的值',
                    arguments: {
                        a: {
                            type: ArgumentType.STRING,
                            defaultValue: 'a'
                        },
                    }
                }
            ],
            menus: {
                /*urlNames: {
                    acceptReporters: true,
                    items: [{
                        text: '云空间',
                        value: 'cloudSpace'
                    }]
                },*/
            }
        };
    }
    _ad(a){
        if(!temp2.bl){
            temp2.bl={};
        }
    }
    sb(a){
        this._ad();
        let v=Cast.toString(a.a);
        let v2=a.b;
        temp2.bl[v]=v2;
    }
    
    gv(a){
        this._ad();
        let v=Cast.toString(a.a);
        return temp2.bl[v];
    }
    dx(a){
        try{
            return JSON.parse(a.a);
        }catch(e){
            return '';
        }
    }
    len({a}){
        try{
            return JSON.parse(a).length;
        }catch(e){
            return 'NaN'
        }
        
    }
    dx2(a){
        try{
            return JSON.parse(a.a)[a.b];
        }catch(e){
            try{
                return a.a[a.b];
            }catch(e){
                return '';
            }
        }
    }
    dx3(a){
        try{
            let v=JSON.parse(a.a);
            v[a.b]=a.c;
            return v;
        }catch(e){
            try{
                let v=a.a;
                v[a.b]=a.c;
                return v;
            }catch(e){
                return '';
            }
        }
    }
    tos(a){
        try{
            return JSON.stringify(a.a);
        }catch(e){
            return '';
        }
    }
    stos(a){
        try{
            return a.b.split(a.a);
        }catch(e){
            return '';
        }
    }
    stos2(a){
        try{
            return JSON.parse(a.b).join(a.a);
        }catch(e){
            return '';
        }
    }
    setv({a,b},util){
        console.log(util.thread)
        util.thread.values || (util.thread.values={});
        util.thread.values.a=b
    }
    getv({a,b},util){
        console.log(util.thread)
        util.thread.values || (util.thread.values={});
        return util.thread.values.a
    }
}

module.exports = Scratch3JsBlocks;
