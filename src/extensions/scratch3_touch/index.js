const ArgumentType = require('../../../src/extension-support/argument-type');
const BlockType = require('../../../src/extension-support/block-type');
const MathUtil = require('../../../src/util/math-util');

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0i5Zu+5bGCXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSItMjMzIDM1Ni45IDEyOC4zIDEyOCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAtMjMzIDM1Ni45IDEyOC4zIDEyODsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4NCgkuc3Qwe2ZpbGw6IzdGM0Y5ODt9DQo8L3N0eWxlPg0KPHBhdGggY2xhc3M9InN0MCIgZD0iTS0xNDQuOCw0MjQuMWMtMiwwLTMuOCwwLjgtNS4yLDEuOWwtMTkuNi0xMS4xYzAuNC0xLjQsMC42LTIuOCwwLjYtNC4yYzAtMS4yLTAuMS0yLjMtMC41LTMuNWwxMy43LTYuOA0KCWMxLjQsMS40LDMuNSwyLjMsNS42LDIuM2M0LjUsMCw4LjEtMy42LDguMS04LjFjMC00LjUtMy42LTguMS04LjEtOC4xcy04LjEsMy42LTguMSw4LjF2MWwtMTMuNyw2LjhjLTIuNC0zLjEtNi4zLTUuMS0xMC42LTUuMQ0KCWMtNy40LDAtMTMuNCw2LTEzLjQsMTMuNGMwLDUuOCwzLjYsMTAuNiw4LjYsMTIuNWwtMS44LDExLjZjLTMuOCwwLjYtNi43LDQtNi43LDcuOWMwLDQuNSwzLjYsOC4xLDguMSw4LjFzOC4xLTMuNiw4LjEtOC4xDQoJYzAtMy4xLTEuNy01LjYtNC4yLTdsMS45LTExLjhjMy44LTAuMSw3LjMtMS45LDkuNi00LjZsMTkuNiwxMS4xYy0wLjEsMC41LTAuMSwwLjktMC4xLDEuNGMwLDQuNSwzLjYsOC4xLDguMSw4LjENCgljNC41LDAsOC4xLTMuNiw4LjEtOC4xQy0xMzYuNyw0MjcuOC0xNDAuNSw0MjQuMS0xNDQuOCw0MjQuMXoiLz4NCjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0tMTM2LjksMzY0LjdILTIwMWwtMzIsNTUuNmwzMi4xLDU1LjZoNjRsMzIuMS01NS42TC0xMzYuOSwzNjQuN3ogTS0xNDIuOCw0NjUuNmgtNTIuNGwtMjYuMS00NS4zbDI2LjEtNDUuMw0KCWg1Mi40bDI2LjEsNDUuM0MtMTE2LjYsNDIwLjMtMTQyLjgsNDY1LjYtMTQyLjgsNDY1LjZ6Ii8+DQo8L3N2Zz4=';

/**
 * Host for the Pen-related blocks in Scratch 3.0
 * @param {Runtime} runtime - the runtime instantiating this block package.
 * @constructor
 */
class Scratch3Blocks {
    constructor(runtime) {
        let c = $('canvas')
        temp2.touch = {
            cl: (event) => {
                temp2.touch.touchNum = event.touches.length
                temp2.touch.touches = event.touches
            },
            onTouchStart: (event) => {
                console.log(event)
                event.preventDefault();
                temp2.touch.start = 1;
                temp2.touch.cl(event)
            },
            onTouchMove: (event) => {
                event.preventDefault();
                temp2.touch.move = 1;
                temp2.touch.cl(event)
            }, onTouchEnd: (event) => {
                event.preventDefault();
                temp2.touch.end = 1;
                temp2.touch.cl(event)
            }
        };
        temp2.touch._canvas = c[0] && c[0].width && c[0] || c[1] && c[1].width && c[1] || c[2] && c[2].width && c[2];
        temp2.touch.rect = temp2.touch._canvas.getBoundingClientRect()
        console.log(temp2.touch)
        // var touchable = 'createTouch' in document;
        // if (touchable) {
        temp2.touch._canvas.addEventListener('touchstart', temp2.touch.onTouchStart, false);
        temp2.touch._canvas.addEventListener('touchmove', temp2.touch.onTouchMove, false);
        temp2.touch._canvas.addEventListener('touchend', temp2.touch.onTouchEnd, false);
        // }

        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }
    getInfo() {
        return {
            id: 'touch',
            name: '触碰',
            // blockIconURI: blockIconURI,
            // color1:'#3F51B5',
            blocks: [
                {
                    opcode: 'num',
                    blockType: BlockType.REPORTER,
                    text: '手指数量',
                    arguments: {
                    }
                },
                {
                    opcode: 'x',
                    blockType: BlockType.REPORTER,
                    text: '第[num]个手指的x',
                    arguments: {
                        num: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '1'
                        },
                    }
                },
                {
                    opcode: 'y',
                    blockType: BlockType.REPORTER,
                    text: '第[num]个手指的y',
                    arguments: {
                        num: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '1'
                        },
                    }
                },
                {
                    opcode: 'rx',
                    blockType: BlockType.REPORTER,
                    text: '第[num]个手指按压半径的x',
                    arguments: {
                        num: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '1'
                        },
                    }
                },
                {
                    opcode: 'ry',
                    blockType: BlockType.REPORTER,
                    text: '第[num]个手指按压半径的y',
                    arguments: {
                        num: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '1'
                        },
                    }
                },
                {
                    opcode: 'rotation',
                    blockType: BlockType.REPORTER,
                    text: '第[num]个手指的按压角度',
                    arguments: {
                        num: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '1'
                        },
                    }
                },
                {
                    opcode: 'force',
                    blockType: BlockType.REPORTER,
                    text: '第[num]个手指的按压力度',
                    arguments: {
                        num: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '1'
                        },
                    }
                },
                {
                    opcode: 'whenstart',
                    blockType: BlockType.HAT,
                    text: '当开始触碰',
                    arguments: {}
                },
                {
                    opcode: 'whenmove',
                    blockType: BlockType.HAT,
                    text: '当触碰移动',
                    arguments: {}
                },
                {
                    opcode: 'whenend',
                    blockType: BlockType.HAT,
                    text: '当停止触碰',
                    arguments: {}
                },
            ]
        }
    }

    whenstart() {
        if (temp2.touch.start) {
            temp2.touch.start = null;
            return true;
        }
        return false;
    }
    whenmove() {
        if (temp2.touch.move) {
            temp2.touch.move = null;
            return true;
        }
        return false;
    }
    whenend() {
        if (temp2.touch.end) {
            temp2.touch.end = null;
            return true;
        }
        return false;
    }
    num() {
        return temp2.touch.touchNum || 0
    }
    x({ num }) {
        console.log(temp2.touch.touches)
        // let c = $('canvas')
        let cx = temp2.touch.touches[num - 1].clientX;
        let {left,width} = temp2.touch.rect;
        let x = cx - left;
        let scratchX = MathUtil.clamp(
            this.runtime.stageWidth * ((x / width) - 0.5),
            -(this.runtime.stageWidth / 2),
            (this.runtime.stageWidth / 2)
        );
        return scratchX;
    }
    y({ num }) {
        console.log(temp2.touch.touches)
        // let c = $('canvas')// ||  $('.stage_dragging-sprite_2rRMx')[0] 
        // let h=c[0] && c[0].height || c[1] && c[1].height || c[2] && c[2].height;
        let cy = temp2.touch.touches[num - 1].clientY;
        let {top,height} = temp2.touch.rect;
        let y = cy - top;
        
        let scratchY = MathUtil.clamp(
            -this.runtime.stageHeight * ((y / height) - 0.5),
            -(this.runtime.stageHeight / 2),
            (this.runtime.stageHeight / 2)
        );

        return scratchY
        // return 180-y/h*180;
    }
    force({ num }) {
        console.log(temp2.touch.touches)
        return temp2.touch.touches[num - 1].force
    }
    rx({ num }) {
        console.log(temp2.touch.touches)
        return temp2.touch.touches[num - 1].radiusX
    }
    ry({ num }) {
        console.log(temp2.touch.touches)
        return temp2.touch.touches[num - 1].radiusY
    }
    rotation({ num }) {
        console.log(temp2.touch.touches)
        return temp2.touch.touches[num - 1].rotationAngle
    }
}

module.exports = Scratch3Blocks;
