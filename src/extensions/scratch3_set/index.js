const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACfElEQVRYR8WXO2sXURDFf6dTJCAYbSxUfOEDFHw3gtgZLUwhgqB+iCgoghFEC/0EVmqnohY+Kgux0ZCAEogBY/BRWPioxHpkwu6f63Xv7r3/KLnl7sycs3NnzsyKBT5aYHz6ImBmF4HRgPxH4KakS6Uf1C8BawKSVByv1cHMljiQpF8hoJllETCz1ZI8O8mTJGBmhzytleeIpNt1lBwCZnYOuAKMA6clvW3MWtNDM9sNPAEGg/dDwCLgLLAn8UmTwGVgMXArsJkCjjWRaMyAmb0GtpcWVIf9lKStsc1fBPzegA//GNzDfQPWxPWUykB9f108piuDTV2GwKmwjmr7tiI8Gd1j7TMLnAFeSPrhD81sGbAfuAasbSAzJOlpdhFWQQ8CzyKn0S6xaRApD3Fc0p1SAmOAd0N9xiTtzUi1Z+RV1CkTkna1EkgwD32OSHqcSeAw8KjFtpfJXg2kxCUIskKSV3LnMbPlwNcWw+eSDvj7XAIzkjZ0IgcGZvYOWJ/wKSYwLWlzIQGX3lR7FhNw7MG67bqIVG35vfQK4hkf+w9LetgFXrXwUeBBURHGxg2tNCtpXSaB95EgTUraVqoDw8D9yKlfIfJJeK+UgIvOywYnFygfuS5Mc21ZtZ2P6AuJUd04B/5owxCoWkZ8H+g6M5VBqt1C//OSrsYBm8bxAPAZWNqF3sf7jZJcH3onNY4ngB19ALS5jEsKZ8ucbYqAi85dYEsQcR+wChgBdiaQnPh14FNUP2UrWVVYNYmVwIlwnmcupb7Ueh29qfzzl9KoIAck/Yye/f+1vO0yczKQWz/FfzLV9cSy/QW40bUtFQlR7hfM166vDMwXNPT/DWeh+iFlY2ANAAAAAElFTkSuQmCC';

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
class Scratch3setBlocks {
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
            id: 'set',
            name: 'set',
            // blockIconURI: blockIconURI,
            color1:'#009688',
            blocks: [
                {
                    opcode: 'f',
                    blockType: BlockType.COMMAND,
                    text: '设置帧率[a]',
                    arguments: {
                        a: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '30帧',
                            menu: 'z'
                        },
                    },
                },
                {
                    opcode: 'set',
                    blockType: BlockType.COMMAND,
                    text: '设置id为[cid]的角色中id为[id]的造型的svg为[svg]',
                    arguments: {
                        // m: {
                        //     type: ArgumentType.STRING,
                        //     defaultValue: '设置',
                        //     menu: 'm'
                        // },
                        // type: {
                        //     type: ArgumentType.STRING,
                        //     defaultValue: 'id',
                        //     menu: 'type'
                        // },
                        id: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0'
                        },
                        cid: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0'
                        },
                        svg: {
                            type: ArgumentType.STRING,
                            defaultValue: `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="91.88867" height="18" viewBox="0,0,91.88867,18"><g transform="translate(-194.88452,-170)"><g data-paper-data="{&quot;isPaintingLayer&quot;:true}" fill="#66aaff" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="&quot;Helvetica Neue&quot;, Helvetica, Arial, sans-serif" font-weight="400" font-size="15" text-anchor="start" style="mix-blend-mode: normal"><text transform="translate(195.38452,184.5)" font-size="15" xml:space="preserve" fill="#66aaff" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="&quot;Helvetica Neue&quot;, Helvetica, Arial, sans-serif" font-weight="400" text-anchor="start" style="mix-blend-mode: normal"><tspan x="0" dy="0">I love 40code</tspan></text></g></g></svg>`
                        }
                    },
                },
                {
                    opcode: 'set2',
                    blockType: BlockType.COMMAND,
                    text: '设置id为[cid]的角色中id为[id]的造型的svg为[svg]，于x[x]y[y]',
                    arguments: {
                        id: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0'
                        },
                        x: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '-240'
                        },
                        y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '180'
                        },
                        cid: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0'
                        },
                        svg: {
                            type: ArgumentType.STRING,
                            defaultValue: `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="91.88867" height="18" viewBox="0,0,91.88867,18"><g transform="translate(-194.88452,-170)"><g data-paper-data="{&quot;isPaintingLayer&quot;:true}" fill="#66aaff" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="&quot;Helvetica Neue&quot;, Helvetica, Arial, sans-serif" font-weight="400" font-size="15" text-anchor="start" style="mix-blend-mode: normal"><text transform="translate(195.38452,184.5)" font-size="15" xml:space="preserve" fill="#66aaff" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="&quot;Helvetica Neue&quot;, Helvetica, Arial, sans-serif" font-weight="400" text-anchor="start" style="mix-blend-mode: normal"><tspan x="0" dy="0">I love 40code</tspan></text></g></g></svg>`
                        }
                    },
                },
                {
                    opcode: 'runBlock',
                    blockType: BlockType.REPORTER,
                    text: '运行opcode[opcode]，传入[a]',
                    arguments: {
                        opcode: {
                            type: ArgumentType.STRING,
                            defaultValue: 'motion_gotoxy'
                        },
                        a: {
                            type: ArgumentType.STRING,
                            defaultValue: '{"X":100,"Y":60}'
                        }
                    },
                },
                {
                    opcode: 'runBlock2',
                    blockType: BlockType.COMMAND,
                    text: '运行opcode[opcode]，传入[a]',
                    arguments: {
                        opcode: {
                            type: ArgumentType.STRING,
                            defaultValue: 'motion_gotoxy'
                        },
                        a: {
                            type: ArgumentType.STRING,
                            defaultValue: '{"X":100,"Y":60}'
                        }
                    },
                },
                {
                    opcode: 'id',
                    blockType: BlockType.REPORTER,
                    text: '当前角色id(实验性功能)',
                    arguments: {
                    },
                },
            ],
            menus: {
                z: ['30帧', '60帧'],
                type: ['id'],
                m: ['设置']
            }
        };
    }
    f(a,u) {
        //console.log(this.runtime)
        let zz;
        if (a.a == '30帧')
            zz = 1;
        else
            zz = 0;
        this.runtime.setCompatibilityMode(zz);
        console.log(u)
        console.log(this.runtime,this,window);
    }
    set({ svg, id, cid }) {
        try {
            vm._updateSvg(vm.runtime.targets[cid].getCostumes()[id], svg, 0, 0)
        } catch (error) {
            console.log(error);
        }

    }
    set2({ svg, id, cid, x, y }) {
        try {
            vm._updateSvg(vm.runtime.targets[cid].getCostumes()[id], svg, -x, y)
        } catch (error) {
            console.log(error);
        }

    }
    runBlock({ opcode, a }, util) {
        try {
            let s = opcode.split('_')
            if(s[1].toLowerCase()=='constructor') return '';
            if (builtinExtensions[s[0]]) {
                let w=(new (builtinExtensions[s[0]]())).__proto__;
                let o=Object.getOwnPropertyNames(w);
                
                for(let i=0;i<o.length;i++){
                    if(o[i].toLowerCase()==s[1].toLowerCase()){
                        s[1]=o[i];
                    }
                }
                let r=(w[s[1]])(JSON.parse(a), util)
                console.log(r)
                return r;
            }
            if (defaultBlockPackages['scratch3_' + s[0]]) {
                let w=(new defaultBlockPackages['scratch3_' + s[0]]).__proto__;
                let o=Object.getOwnPropertyNames(w);
                for(let i=0;i<o.length;i++){
                    if(o[i].toLowerCase()==s[1].toLowerCase()){
                        s[1]=o[i];
                    }
                }
                console.log(w,s)
                let r=(w[s[1]])(JSON.parse(a), util);
                console.log(r)
                return r;
            }

        } catch (e) {
            console.log(e)
            return e;
        }

    }
    runBlock2(a,u){
        this.runBlock(a,u)
    }
    id(a,u){
        return u.thread.target.drawableID;
    }
}

module.exports = Scratch3setBlocks;
