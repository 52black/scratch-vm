//const Variable = require('../../engine/variable');
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
// const { resolves } = require('tap');
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
class Scratch3JsonBlocks {
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
            id: 'ws',
            name: 'websocket',
            blockIconURI: blockIconURI,
            menuIconURI: menuIconURI,
            blocks: [
                {
                    opcode: 'create',
                    blockType: BlockType.COMMAND,
                    text: '建立webscoket连接[url]',
                    arguments: {
                        url: {
                            type: ArgumentType.STRING,
                            defaultValue: 'wss://',
                        },
                    }
                },
                {
                    opcode: 'state',
                    blockType: BlockType.REPORTER,
                    text: 'webscoket连接[url]的状态，以[s]显示',
                    arguments: {
                        url: {
                            type: ArgumentType.STRING,
                            defaultValue: 'wss://',
                        },
                        s:{
                            type: ArgumentType.STRING,
                            defaultValue: 1,
                            menu:'s'
                        }
                    }
                },
                {
                    opcode: 'data',
                    blockType: BlockType.REPORTER,
                    text: '[url]的数据',
                    arguments: {
                        url: {
                            type: ArgumentType.STRING,
                            defaultValue: 'wss://',
                        }
                    }
                },
                {
                    opcode: 'receive',
                    blockType: BlockType.HAT,
                    text: '当接收到[url]的数据',
                    arguments: {
                        url: {
                            type: ArgumentType.STRING,
                            defaultValue: 'wss://',
                        },
                    }
                },
            ],
            menus: {
                s:[{text:'数值',value:1},{text:'文字',value:0}]
            }
        };
    }
    _ad(a){
        if(!temp2.ws){
            temp2.ws={};
        }
        if(!temp2.ws2){
            temp2.ws2={};
        }
    }
    create({url}){
        this._ad()
        try {
            temp2.ws[url]=new WebSocket(url);
            temp2.ws[url].onmessage = function(event) {
                temp2.wsdata = event.data;
                temp2.ws2[url] = 1;
            };
        } catch (error) {
            return error;
        }
        
    }
    state({url,s}){
        let l=[
            'CONNECTING',
            'OPEN',
            'CLOSING',
            'CLOSED'
        ];
        if(s)
        return temp2.ws[url] && temp2.ws[url].readyState
        else
        return l[temp2.ws[url] && temp2.ws[url].readyState]
    }
    receive({url}){
        this._ad()
        let w=temp2.ws2[url];
        temp2.ws2[url]=null;
        return w;
    }
}

module.exports = Scratch3JsonBlocks;
