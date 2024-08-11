const ArgumentType = require('../../../src/extension-support/argument-type');
const BlockType = require('../../../src/extension-support/block-type');
const Cast = require('../../../src/util/cast');
const Clone = require('../../../src/util/clone');
const Color = require('../../../src/util/color');
const MathUtil = require('../../../src/util/math-util');
const RenderedTarget = require('../../../src/sprites/rendered-target');
const log = require('../../../src/util/log');
const Variable = require('../../../src/engine/variable');
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
class Scratch3CommunityBlocks {
    constructor(runtime) {

        this.lastPayTime = 0;
        this._error = '';

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
            id: 'yx',
            name: '运算',
            // blockIconURI: blockIconURI,
            color1:'#3F51B5',
            blocks: [
            '字符串处理',
            {
                opcode: 'sha1',
                blockType: BlockType.REPORTER,
                text: 'sha1加密[c]',
                arguments: {
                    c: {
                        type: ArgumentType.STRING,
                        defaultValue: '123456'
                    }
                }
            },
            {
                opcode: 'md5',
                blockType: BlockType.REPORTER,
                text: 'md5加密[text]',
                arguments: {
                    text: {
                        type: ArgumentType.STRING,
                        defaultValue: '123456'
                    }
                }
            },
            {
                opcode: 'jq',
                blockType: BlockType.REPORTER,
                text: '截取[TEXT]，从[a]到[b]',
                arguments: {
                    TEXT: {
                        type: ArgumentType.STRING,
                        defaultValue: 'apple'
                    },
                    a: {
                        type: ArgumentType.NUMBER,
                        defaultValue: '2'
                    },
                    b: {
                        type: ArgumentType.NUMBER,
                        defaultValue: '4'
                    },
                }
            },
            {
                opcode: 'czs',
                blockType: BlockType.REPORTER,
                text: '[TEXT]第一个[a]的位置，从[b]开始查找',
                arguments: {
                    TEXT: {
                        type: ArgumentType.STRING,
                        defaultValue: 'apple ppt'
                    },
                    a: {
                        type: ArgumentType.STRING,
                        defaultValue: 'pp'
                    },
                    b: {
                        type: ArgumentType.NUMBER,
                        defaultValue: '1'
                    }
                }
            },
            {
                opcode: 'cze',
                blockType: BlockType.REPORTER,
                text: '[TEXT]第最后一个[a]的位置，从[b]开始查找',
                arguments: {
                    TEXT: {
                        type: ArgumentType.STRING,
                        defaultValue: 'apple ppt'
                    },
                    a: {
                        type: ArgumentType.STRING,
                        defaultValue: 'pp'
                    },
                    b: {
                        type: ArgumentType.NUMBER,
                        defaultValue: '1'
                    }
                }
            },
            {
                opcode: 'dx',
                blockType: BlockType.REPORTER,
                text: '将[a]转换成[x]',
                arguments: {
                    x: {
                        type: ArgumentType.STRING,
                        defaultValue: '大写',
                        menu: 'd',
                    },
                    a: {
                        type: ArgumentType.STRING,
                        defaultValue: 'aPple',
                    }
                }
            },
            {
                opcode: 'cf',
                blockType: BlockType.REPORTER,
                text: '按[a]拆分[b]，获取拆分结果的第[c]项',
                arguments: {
                    a: {
                        type: ArgumentType.STRING,
                        defaultValue: '_'
                    },
                    b: {
                        type: ArgumentType.STRING,
                        defaultValue: 'I_want_an_apple'
                    },
                    c: {
                        type: ArgumentType.STRING,
                        defaultValue: '1'
                    }
                }
            },
            '计算相关',
            {
                opcode: 'js',
                blockType: BlockType.REPORTER,
                text: '运算[TEXT]',
                arguments: {
                    TEXT: {
                        type: ArgumentType.STRING,
                        defaultValue: 'sqrt(16)+PI+abs(-1)*(-1)'
                    }
                }
            },
            {
                opcode: 'jl',
                blockType: BlockType.REPORTER,
                text: 'x[x1]y[y1] x[x2]y[y2]的距离',
                arguments: {
                    x1: {
                        type: ArgumentType.STRING,
                        defaultValue: '0'
                    },
                    x2: {
                        type: ArgumentType.STRING,
                        defaultValue: '0'
                    },
                    y1: {
                        type: ArgumentType.STRING,
                        defaultValue: '1'
                    },
                    y2: {
                        type: ArgumentType.STRING,
                        defaultValue: '1'
                    }
                }
            },
            {
                opcode: 'jd',
                blockType: BlockType.REPORTER,
                text: 'x[x1]y[y1] x[x2]y[y2]的角度',
                arguments: {
                    x1: {
                        type: ArgumentType.STRING,
                        defaultValue: '0'
                    },
                    x2: {
                        type: ArgumentType.STRING,
                        defaultValue: '9'
                    },
                    y1: {
                        type: ArgumentType.STRING,
                        defaultValue: '7'
                    },
                    y2: {
                        type: ArgumentType.STRING,
                        defaultValue: '4'
                    }
                }
            },
            '正则表达式搜索',
            {
                opcode: 'zz',
                blockType: BlockType.REPORTER,
                text: '将[a]使用正则[b]搜索(search)',
                arguments: {
                    b: {
                        type: ArgumentType.STRING,
                        defaultValue: '^[1]([3-9])[0-9]{9}$',
                    },
                    a: {
                        type: ArgumentType.STRING,
                        defaultValue: '18888888888',
                    }
                }
            },
            
            {
                opcode: 'zz3',
                blockType: BlockType.BOOLEAN,
                text: '将[a]使用正则[b]匹配',
                arguments: {
                    b: {
                        type: ArgumentType.STRING,
                        defaultValue: '^[1]([3-9])[0-9]{9}$',
                    },
                    a: {
                        type: ArgumentType.STRING,
                        defaultValue: '18888888888',
                    }
                }
            },
            {
                opcode: 'zz2',
                blockType: BlockType.REPORTER,
                text: '将[a]使用正则[b]替换(replace)成[c]',
                arguments: {
                    b: {
                        type: ArgumentType.STRING,
                        defaultValue: '',
                    },
                    a: {
                        type: ArgumentType.STRING,
                        defaultValue: 'hello    world a b c d',
                    },
                    c:{
                        type: ArgumentType.STRING,
                        defaultValue: ' ',
                    }
                }
            },
            '普通搜索与替换',
            {
                opcode: 'search',
                blockType: BlockType.REPORTER,
                text: '在[a]中搜索[b]',
                arguments: {
                    b: {
                        type: ArgumentType.STRING,
                        defaultValue: '8',
                    },
                    a: {
                        type: ArgumentType.STRING,
                        defaultValue: '18888888888',
                    }
                }
            },
            {
                opcode: 'replace',
                blockType: BlockType.REPORTER,
                text: '将[a]中的第一个[b]替换(replace)成[c]',
                arguments: {
                    b: {
                        type: ArgumentType.STRING,
                        defaultValue: 'scratch',
                    },
                    a: {
                        type: ArgumentType.STRING,
                        defaultValue: 'I love scratch.',
                    },
                    c:{
                        type: ArgumentType.STRING,
                        defaultValue: '40code',
                    }
                }
            },
            {
                opcode: 'replaceAll',
                blockType: BlockType.REPORTER,
                text: '将[a]中的所有[b]替换(replace)成[c]',
                arguments: {
                    b: {
                        type: ArgumentType.STRING,
                        defaultValue: 'scratch',
                    },
                    a: {
                        type: ArgumentType.STRING,
                        defaultValue: 'I love scratch.',
                    },
                    c:{
                        type: ArgumentType.STRING,
                        defaultValue: '40code',
                    }
                }
            },
            '便捷积木',
            {
                opcode: 'tm',
                blockType: BlockType.REPORTER,
                text: '如果[a]返回[b]，否则返回[c]',
                arguments: {
                    a: {
                        type: ArgumentType.STRING,
                        defaultValue: '1'
                    },
                    b: {
                        type: ArgumentType.STRING,
                        defaultValue: '2'
                    },
                    c: {
                        type: ArgumentType.STRING,
                        defaultValue: '1'
                    }
                }
            },
            {
                opcode: 'operation',
                blockType: BlockType.BOOLEAN,
                text: '[a][operator][b]',
                arguments: {
                    a: {
                        type: ArgumentType.STRING,
                        defaultValue: 'a'
                    },
                    b: {
                        type: ArgumentType.STRING,
                        defaultValue: 'A'
                    },
                    operator: {
                        type: ArgumentType.STRING,
                        defaultValue: '==',
                        menu:'operator'
                    }
                }
            },
            {
                opcode: 'operation2',
                blockType: BlockType.BOOLEAN,
                text: '[a][operator][b][operator2][c]',
                arguments: {
                    a: {
                        type: ArgumentType.STRING,
                        defaultValue: '1'
                    },
                    b: {
                        type: ArgumentType.STRING,
                        defaultValue: '2'
                    },
                    operator: {
                        type: ArgumentType.STRING,
                        defaultValue: '<',
                        menu:'operator'
                    },
                    operator2: {
                        type: ArgumentType.STRING,
                        defaultValue: '<',
                        menu:'operator'
                    },
                    c: {
                        type: ArgumentType.STRING,
                        defaultValue: '3'
                    },
                }
            },
            {
                opcode: 'boolean',
                blockType: BlockType.BOOLEAN,
                text: '[a]',
                arguments: {
                    a: {
                        type: ArgumentType.STRING,
                        defaultValue: 'true'
                    },
                }
            },
            {
                opcode: '_true',
                blockType: BlockType.BOOLEAN,
                text: '真',
                arguments: {
                }
            },
            {
                opcode: '_false',
                blockType: BlockType.BOOLEAN,
                text: '假',
                arguments: {
                }
            },
            {
                opcode: 'when',
                blockType: BlockType.HAT,
                text: '当[c]',
                arguments: {
                    c: {
                        type: ArgumentType.BOOLEAN,
                    },
                }
            },
            {
                opcode: 'whenc',
                blockType: BlockType.HAT,
                text: '当[c]变化时',
                arguments: {
                    c: {
                        type: ArgumentType.BOOLEAN,
                    },
                }
            },
            {
                opcode: 'c',
                blockType: BlockType.COMMAND,
                text: '[c]',
                arguments: {
                    c: {
                        type: ArgumentType.STRING,
                    },
                }
            },
            '连接',
            {
                opcode: 'lj',
                blockType: BlockType.REPORTER,
                text: '连接[a][b][c]',
                arguments: {
                    a: {
                        type: ArgumentType.STRING,
                        defaultValue: 'a'
                    },
                    b: {
                        type: ArgumentType.STRING,
                        defaultValue: 'b'
                    },
                    c: {
                        type: ArgumentType.STRING,
                        defaultValue: 'c'
                    },
                }
            },
            {
                opcode: 'lj2',
                blockType: BlockType.REPORTER,
                text: '连接[a][b][c][d]',
                arguments: {
                    a: {
                        type: ArgumentType.STRING,
                        defaultValue: 'a'
                    },
                    b: {
                        type: ArgumentType.STRING,
                        defaultValue: 'b'
                    },
                    c: {
                        type: ArgumentType.STRING,
                        defaultValue: 'c'
                    },
                    d: {
                        type: ArgumentType.STRING,
                        defaultValue: 'd'
                    },
                }
            },
            {
                opcode: 'lj3',
                blockType: BlockType.REPORTER,
                text: '连接[a][b][c][d][e][f][g][h]',
                arguments: {
                    a: {
                        type: ArgumentType.STRING,
                        defaultValue: 'a'
                    },
                    b: {
                        type: ArgumentType.STRING,
                        defaultValue: 'b'
                    },
                    c: {
                        type: ArgumentType.STRING,
                        defaultValue: 'c'
                    },
                    d: {
                        type: ArgumentType.STRING,
                        defaultValue: 'd'
                    },
                    e: {
                        type: ArgumentType.STRING,
                        defaultValue: 'a'
                    },
                    f: {
                        type: ArgumentType.STRING,
                        defaultValue: 'b'
                    },
                    g: {
                        type: ArgumentType.STRING,
                        defaultValue: 'c'
                    },
                    h: {
                        type: ArgumentType.STRING,
                        defaultValue: 'd'
                    },
                },
            },
            '一些字符',
            {
                opcode: 'n',
                blockType: BlockType.REPORTER,
                text: '\\n(换行符)',
            },
            {
                opcode: 'PI',
                blockType: BlockType.REPORTER,
                text: 'π(派)',
            }
            ],
            menus: {
                USER_ATTR: ['user id', 'username'/*, 'user level'*/],
                d:['大写','小写'],
                time:['标准','时间戳'],
                operator:['==','>=','<=','!=','<','>']
            }
        };
    }

    n(){
        return '\n'
    }

    PI(){
        return Math.PI;
    }

    lj({a,b,c}){
        return a.toString()+b.toString()+c.toString();
    }

    lj2({a,b,c,d}){
        return a.toString()+b.toString()+c.toString()+d.toString();
    }

    lj3({a,b,c,d,e,f,g,h}){
        return a.toString()+b.toString()+c.toString()+d.toString()
        +e.toString()+f.toString()+g.toString()+h.toString();
    }

    getUserInfo(args, util) {
        /*var extUtils = this.runtime.extUtils;
        var loggedInUser = extUtils.getContext().loggedInUser;
        if (!loggedInUser) return "";*/
        var attr = args.USER_ATTR;
        if (attr == "user id") return mid;
        else if (attr == "username") return nm;
        //else if (attr == "user level") return loggedInUser.level;
        else return "";
    }
    getz(args, util) {
        return wid;
    }
    _math(a){
        let b=a.replaceAll("[","(").replaceAll("{","(").replaceAll("]",")").replaceAll("}",")").replaceAll(/[^0-9,a-z,A-Z,\.\(\)\+\-\*\/]+/g,"");
        const replaceStr2 = (str, index, char, t) => {
            return str.substring(0, index) + char + str.substring(index - t);
        }
        for(let i=0;i<b.length;i++){
            if(b[i] && ((b[i].charCodeAt()>=97 && b[i].charCodeAt()<=122) || (b[i].charCodeAt()>=65 && b[i].charCodeAt()<=90))){
                b=replaceStr2(b,i,'Math.',0);
                i+=5;
                for(;(b[i] && ((b[i].charCodeAt()>=97 && b[i].charCodeAt()<=122) || (b[i].charCodeAt()>=65 && b[i].charCodeAt()<=90)) && i<b.length);i++);
            }
        }
        return b;
    }
    js(url) {
        try{
            return eval(this._math(url.TEXT));
        }catch(e){
            return e;
        }
        
    }
    _true(){
        return true;
    }
    _false(){
        return false;
    }
    jq(url) {
        try{
            let a,b;
            if(url.a>0)
                a=url.a-1;
            if(url.b>0)
                b=url.b-1;
            return url.TEXT.toString().substring(a,b);
        }catch(e){
            return e;
        }
        
    }
    czs(url) {
        try{
            return url.TEXT.indexOf(url.a,url.b-1)+1;
        }catch(e){
            return e;
        }
        
    }
    cze(url) {
        try{
            return url.TEXT.lastIndexOf(url.a,url.b-1)+1;
        }catch(e){
            return e;
        }
        
    }
    jl(a) {
        return Math.sqrt((a.x1 - a.x2) * (a.x1 - a.x2) + (a.y1 - a.y2) * (a.y1 - a.y2));
    }
    jd(a) {
        try {
            var x = Math.abs(a.x1 - a.x2);
            var y = Math.abs(a.y1 - a.y2);
            var z = Math.sqrt(x * x + y * y);
            return Math.round(Math.asin(y / z) / Math.PI * 180);
        } catch (e) {
            return e;//'error';
        }
    }
    md5({text}){
        try {
            return CryptoJS.MD5(text.toString()).toString()
        } catch (error) {
            console.log(error)
        }
        
    }
    sha1(ss) {
        function encodeUTF8(s) {
            var i, r = [], c, x;
            for (i = 0; i < s.length; i++)
              if ((c = s.charCodeAt(i)) < 0x80) r.push(c);
              else if (c < 0x800) r.push(0xC0 + (c >> 6 & 0x1F), 0x80 + (c & 0x3F));
              else {
                if ((x = c ^ 0xD800) >> 10 == 0) //对四字节UTF-16转换为Unicode
                  c = (x << 10) + (s.charCodeAt(++i) ^ 0xDC00) + 0x10000,
                    r.push(0xF0 + (c >> 18 & 0x7), 0x80 + (c >> 12 & 0x3F));
                else r.push(0xE0 + (c >> 12 & 0xF));
                r.push(0x80 + (c >> 6 & 0x3F), 0x80 + (c & 0x3F));
              };
            return r;
          }
          
          // 字符串加密成 hex 字符串
          function sha1(s) {
            var data = new Uint8Array(encodeUTF8(s))
            var i, j, t;
            var l = ((data.length + 8) >>> 6 << 4) + 16, s = new Uint8Array(l << 2);
            s.set(new Uint8Array(data.buffer)), s = new Uint32Array(s.buffer);
            for (t = new DataView(s.buffer), i = 0; i < l; i++)s[i] = t.getUint32(i << 2);
            s[data.length >> 2] |= 0x80 << (24 - (data.length & 3) * 8);
            s[l - 1] = data.length << 3;
            var w = [], f = [
              function () { return m[1] & m[2] | ~m[1] & m[3]; },
              function () { return m[1] ^ m[2] ^ m[3]; },
              function () { return m[1] & m[2] | m[1] & m[3] | m[2] & m[3]; },
              function () { return m[1] ^ m[2] ^ m[3]; }
            ], rol = function (n, c) { return n << c | n >>> (32 - c); },
              k = [1518500249, 1859775393, -1894007588, -899497514],
              m = [1732584193, -271733879, null, null, -1009589776];
            m[2] = ~m[0], m[3] = ~m[1];
            for (i = 0; i < s.length; i += 16) {
              var o = m.slice(0);
              for (j = 0; j < 80; j++)
                w[j] = j < 16 ? s[i + j] : rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1),
                  t = rol(m[0], 5) + f[j / 20 | 0]() + m[4] + w[j] + k[j / 20 | 0] | 0,
                  m[1] = rol(m[1], 30), m.pop(), m.unshift(t);
              for (j = 0; j < 5; j++)m[j] = m[j] + o[j] | 0;
            };
            t = new DataView(new Uint32Array(m).buffer);
            for (var i = 0; i < 5; i++)m[i] = t.getUint32(i << 2);
          
            var hex = Array.prototype.map.call(new Uint8Array(new Uint32Array(m).buffer), function (e) {
              return (e < 16 ? "0" : "") + e.toString(16);
            }).join("");
            return hex;
          }
          return sha1(ss.c);
    }
    jt(a){
        let sss;
        window.scratch.getProjectCover(cover => {
            sss= cover;
          })
        return sss;
    }
    tob(a) {
        try{
            return URL.createObjectURL(dataURLToBlob(a.x));
        }catch(e){
            return e;
        }
    }
    dx(a) {
        try{
            if(a.x=='大写')
            return a.a.toUpperCase();
            if(a.x=='小写')
            return a.a.toLowerCase();
        }catch(e){
            return e;
        }
    }
    zz(a) {
        try{
            let v=a.b.toString();
            console.log(a)
            return a.a.toString().search(new RegExp(v));
        }catch(e){
            return e;
        }
    }
    search(a) {
        try{
            let v=a.b;
            console.log(a)
            return a.a.toString().search((v));
        }catch(e){
            return e;
        }
    }
    zz2(a) {
        try{
            let v=a.b.toString();
            return a.a.toString().replace(new RegExp(v),a.c.toString());
        }catch(e){
            return e;
        }
    }
    replace(a) {
        try{
            let v=a.b.toString();
            return a.a.toString().replace((v),a.c);
        }catch(e){
            return e;
        }
    }
    replaceAll(a) {
        try{
            let v=a.b.toString();
            return a.a.toString().replaceAll((v),a.c);
        }catch(e){
            return e;
        }
    }
    zz3({a,b}){
        try {
            return (new RegExp(b.toString())).test(a.toString())
        } catch (error) {
            console.log(error);
        }
    }
    cf(a){
        return a.b.toString().split(a.a.toString())[a.c-1];
    }
    tm({a,b,c}){
        return a?b:c
    }
    operation({a,operator,b}){
        switch (operator) {
            case '==':
                return a===b;
            case '>=':
                return a>=b;
            case '<=':
                return a<=b;
            case '!=':
                return a!=b;
            case '<':
                return a<b;
            case '>':
                return a>b;
        }
    }
    operation2({a,operator,b,operator2,c}){
        let tmp;
        console.log(a,operator,b,operator2,c)
        switch (operator) {
            case '==':
                tmp = (a===b);
                break;
            case '>=':
                tmp = (a>=b);
                break;
            case '<=':
                tmp = (a<=b);
                break;
            case '!=':
                tmp = (a!=b);
                break;
            case '<':
                tmp = (a<b);
                break;
            case '>':
                tmp = (a>b);
                break;
        }
        console.log(tmp)
        if(!tmp) return false;
        switch (operator2) {
            case '==':
                tmp = (b===c);
                break;
            case '>=':
                tmp = (b>=c);
                break;
            case '<=':
                tmp = (b<=c);
                break;
            case '!=':
                tmp = (b!=c);
                break;
            case '<':
                tmp = (b<c);
                break;
            case '>':
                tmp = (b>c);
                break;
        }
        return tmp
    }
    boolean({a}){
        // throw 1;
        return a;
    }
    when({c}){
        return c;
    }
    whenc({c}){
        if(this.tc!==c){
            this.tc=c
            return 1;
        }
        return 0;
    }
    c(){}
    /*
        pay(args, util) {
            var self = this;
            self._error = "";
            return new Promise(resolve => {
                Blockey.Utils.payInProject(args.AMOUNT, args.ITEM, self.lastPayTime).then(error => {
                    self._error = error || '';
                    self.lastPayTime = new Date().getTime();
                    resolve();
                });
            });
        }
    
        getError(args, util) {
            return this._error;
        }
    */
}

module.exports = Scratch3CommunityBlocks;
