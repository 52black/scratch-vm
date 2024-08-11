const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
window.THREE = require('./three2.min.js')
const { OBJLoader, MTLLoader } = require('./t')
const {OrbitControls} = require('./OrbitControls')
const raycaster = new THREE.Raycaster();
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
class Scratch3threeBlocks {
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
            id: 'three',
            name: '3D引擎',
            // blockIconURI: blockIconURI,
            color1: '#F4511E',
            blocks: [
                {
                    opcode: 'f',
                    blockType: BlockType.COMMAND,
                    text: '初始化3D引擎，宽[x]，高[y]，[cc]摄像机，摄像机视锥体，近端面[a]，远端面[b]',
                    arguments: {
                        x: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '480',
                        },
                        y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '360',
                        },
                        a: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '1',
                        },
                        b: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '1000',
                        },
                        cc: {
                            type: ArgumentType.STRING,
                            defaultValue: '正交',
                            menu: 'c'
                        },
                    },
                },
                '几何图形建立',
                {
                    opcode: 'cu',
                    blockType: BlockType.COMMAND,
                    text: '新建[l]，图形名[n]，长[x]，高[y]，宽[z]',
                    arguments: {
                        n: {
                            type: ArgumentType.STRING,
                            defaultValue: 'cube',
                        },
                        x: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '50',
                        },
                        y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '50',
                        },
                        z: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '50',
                        },
                        l: {
                            type: ArgumentType.STRING,
                            defaultValue: '立方体',
                            menu: 'lf'
                        }
                    },
                },
                {
                    opcode: 'yz',
                    blockType: BlockType.COMMAND,
                    text: '新建圆柱，图形名[n]，顶部直径[a]，底部直径[b]，高度[c]，圆周分段数[d]',
                    arguments: {
                        n: {
                            type: ArgumentType.STRING,
                            defaultValue: 'yuanzhu',
                        },
                        a: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '50',
                        },
                        b: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '100',
                        },
                        c: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '25',
                        },
                        d: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '5',
                        }
                    },
                },
                {
                    opcode: 'yz2',
                    blockType: BlockType.COMMAND,
                    text: '新建圆椎，图形名[n]，底部直径[b]，高度[c]，圆周分段数[d]',
                    arguments: {
                        n: {
                            type: ArgumentType.STRING,
                            defaultValue: 'yuanzhui',
                        },
                        a: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '50',
                        },
                        b: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '100',
                        },
                        c: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '25',
                        },
                        d: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '5',
                        }
                    },
                },
                {
                    opcode: 'd',
                    blockType: BlockType.COMMAND,
                    text: '新建正[l]面体，图形名[n]，径[a]',
                    arguments: {

                        n: {
                            type: ArgumentType.STRING,
                            defaultValue: 'cube',
                        },
                        a: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '50',
                        },
                        l: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '8',
                            menu: 'm'
                        }
                    },
                },
                // {
                //     opcode: 'd',
                //     blockType: BlockType.COMMAND,
                //     text: '新建文字，图形名[n]，文本内容[text]，大小[size]，高度[height]，'
                //     +'曲线分段数[curveSegments]',
                //     arguments: {
                //         n: {
                //             type: ArgumentType.STRING,
                //             defaultValue: 'cube',
                //         },
                //     },
                // },
                '材质相关',
                {
                    opcode: 'ma',
                    blockType: BlockType.COMMAND,
                    text: '新建材质[t]，材质名[n]，颜色[c]',
                    arguments: {
                        n: {
                            type: ArgumentType.STRING,
                            defaultValue: 'ma',
                        },
                        t: {
                            type: ArgumentType.STRING,
                            defaultValue: '基础网格材质',
                            menu: 'cz'
                        },
                        c: {
                            type: ArgumentType.STRING,
                            defaultValue: '#aaaacc',
                        },
                    },
                },
                {
                    opcode: 'setm',
                    blockType: BlockType.COMMAND,
                    text: '设置材质[n]的[t]值为[c]',
                    arguments: {
                        n: {
                            type: ArgumentType.STRING,
                            defaultValue: 'ma',
                        },
                        t: {
                            type: ArgumentType.STRING,
                            defaultValue: '颜色',
                            menu: 'cz2'
                        },
                        c: {
                            type: ArgumentType.STRING,
                            defaultValue: '#aaaacc',
                        }
                    },
                },
                {
                    opcode: 'gsetm',
                    blockType: BlockType.COMMAND,
                    text: '设置模型[n]的材质的[t]值为[c]',//，[d]克隆他的材质',
                    arguments: {
                        n: {
                            type: ArgumentType.STRING,
                            defaultValue: 'ma',
                        },
                        t: {
                            type: ArgumentType.STRING,
                            defaultValue: '颜色',
                            menu: 'cz2'
                        },
                        c: {
                            type: ArgumentType.STRING,
                            defaultValue: '#aaaacc',
                        },
                        d: {
                            type: ArgumentType.STRING,
                            defaultValue: '并',
                            menu: 'd'
                        }
                    },
                },
                // {
                //     opcode: 'setside',
                //     blockType: BlockType.COMMAND,
                //     text: '设置材质[n]的渲染面为[side](仅限图片)',
                //     arguments: {
                //         n: {
                //             type: ArgumentType.STRING,
                //             defaultValue: 'ma',
                //         },
                //         side: {
                //             type: ArgumentType.STRING,
                //             defaultValue: '正面',
                //             menu:'side'
                //         },
                //     },
                // },
                "模型的建立与添加",
                {
                    opcode: 'add',
                    blockType: BlockType.COMMAND,
                    text: '建立名称为[n]的[type]模型，已有图形[a]、已有材质[b]',
                    arguments: {
                        a: {
                            type: ArgumentType.STRING,
                            defaultValue: 'cube',
                        },
                        n: {
                            type: ArgumentType.STRING,
                            defaultValue: 'mesh',
                        },
                        b: {
                            type: ArgumentType.STRING,
                            defaultValue: 'ma',
                        },
                        type: {
                            type: ArgumentType.STRING,
                            defaultValue: '网格',
                            menu: 'type'
                        }
                    },
                },
                {
                    opcode: 'addGrid',
                    blockType: BlockType.COMMAND,
                    text: '建立名称为[n]的坐标格模型，尺寸[size]，细分次数[divisions]，中线颜色[colorCenterLine]，坐标格网格线颜色[colorGrid]',
                    arguments: {
                        n: {
                            type: ArgumentType.STRING,
                            defaultValue: 'zb',
                        },
                        size: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '10',
                        },
                        divisions: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '10',
                        },
                        colorCenterLine: {
                            type: ArgumentType.STRING,
                            defaultValue: 'red',
                        },
                        colorGrid: {
                            type: ArgumentType.STRING,
                            defaultValue: '#ddd',
                        },
                    },
                },
                {
                    opcode: 'addm',
                    blockType: BlockType.COMMAND,
                    text: '将模型[n]添加到场景中',
                    arguments: {
                        n: {
                            type: ArgumentType.STRING,
                            defaultValue: 'mesh',
                        },

                    },
                },
                "模型的设置",
                {
                    opcode: 'sxyz',
                    blockType: BlockType.COMMAND,
                    text: '设置模型[a]的坐标[x][y][z]',
                    arguments: {
                        a: {
                            type: ArgumentType.STRING,
                            defaultValue: 'mesh',
                        },
                        x: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '400',
                        },
                        y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '200',
                        },
                        z: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '300',
                        },
                    },
                },
                {
                    opcode: 'rotate',
                    blockType: BlockType.COMMAND,
                    text: '将模型[n]的[xyz]旋转[n2][ds]',
                    arguments: {
                        n: {
                            type: ArgumentType.STRING,
                            defaultValue: 'mesh',
                        },
                        xyz: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Y',
                            menu: 'xyz'
                        },
                        n2: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '2'
                        },
                        ds: {
                            type: ArgumentType.STRING,
                            defaultValue: '弧度',
                            menu: 'ds'
                        }
                    },
                },
                {
                    opcode: 'setRotate',
                    blockType: BlockType.COMMAND,
                    text: '设置模型[n]面向的角度(欧拉角)为x[x]y[y]z[z][ds]',
                    arguments: {
                        n: {
                            type: ArgumentType.STRING,
                            defaultValue: 'mesh',
                        },
                        x: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '15',
                        },
                        y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '15',
                        },
                        z: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '15',
                        },
                        ds: {
                            type: ArgumentType.STRING,
                            defaultValue: '弧度',
                            menu: 'ds'
                        }
                    },
                },
                {
                    opcode: 'setScale',
                    blockType: BlockType.COMMAND,
                    text: '将模型[n]的x y z缩放[x][y][z]倍',
                    arguments: {
                        n: {
                            type: ArgumentType.STRING,
                            defaultValue: 'mesh',
                        },
                        x: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0.4',
                        },
                        y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '1',
                        },
                        z: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '1',
                        },
                    },
                },
                "光源相关",
                {
                    opcode: 'point',
                    blockType: BlockType.COMMAND,
                    text: '新建光源[g]，图形名[a]，颜色[b]，光照强度[c](0~1)',
                    arguments: {
                        a: {
                            type: ArgumentType.STRING,
                            defaultValue: 'point',
                        },
                        b: {
                            type: ArgumentType.STRING,
                            defaultValue: '#eee',
                        },
                        c: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '1',
                        },
                        g: {
                            type: ArgumentType.STRING,
                            defaultValue: '点光源',
                            menu: 'gy'
                        },
                    },
                },
                {
                    opcode: 'HemisphereLight',
                    blockType: BlockType.COMMAND,
                    text: '新建半球光，图形名[a]，颜色[b]到[f]，光照强度[c](0~1)',
                    arguments: {
                        a: {
                            type: ArgumentType.STRING,
                            defaultValue: 'point',
                        },
                        b: {
                            type: ArgumentType.STRING,
                            defaultValue: '#eee',
                        },
                        f: {
                            type: ArgumentType.STRING,
                            defaultValue: '#ddd',
                        },
                        c: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '1',
                        },
                    },
                },
                {
                    opcode: 'spa',
                    blockType: BlockType.COMMAND,
                    text: '设置光源位置，已有光源名[a]，x[x] y[y] z[z]',
                    arguments: {
                        a: {
                            type: ArgumentType.STRING,
                            defaultValue: 'point',
                        },
                        x: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '400',
                        },
                        y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '200',
                        },
                        z: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '300',
                        },
                    },
                },
                {
                    opcode: 'adp',
                    blockType: BlockType.COMMAND,
                    text: '添加光源到场景中，已有光源名[a]',
                    arguments: {
                        a: {
                            type: ArgumentType.STRING,
                            defaultValue: 'point',
                        }

                    },
                },
                {
                    opcode: 'ada',
                    blockType: BlockType.COMMAND,
                    text: '添加环境光到场景中，颜色[a]',
                    arguments: {
                        a: {
                            type: ArgumentType.STRING,
                            defaultValue: '0x444444',
                        }

                    },
                },
                '相机相关',
                {
                    opcode: 'sc',
                    blockType: BlockType.COMMAND,
                    text: '设置相机位置 ([x],[y],[z])',
                    arguments: {
                        x: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '200',
                        },
                        y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '300',
                        },
                        z: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '200',
                        },
                    },
                },
                {
                    opcode: 'cm',
                    blockType: BlockType.COMMAND,
                    text: '相机面向点([x],[y],[z])',
                    arguments: {
                        x: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0',
                        },
                        y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0',
                        },
                        z: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0',
                        },
                    },
                },
                {
                    opcode: 'setRotateC',
                    blockType: BlockType.COMMAND,
                    text: '设置相机面向的角度(欧拉角)为x[x]y[y]z[z][ds]',
                    arguments: {
                        x: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '15',
                        },
                        y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '15',
                        },
                        z: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '15',
                        },
                        ds: {
                            type: ArgumentType.STRING,
                            defaultValue: '弧度',
                            menu: 'ds'
                        }
                    },
                },
                {
                    opcode: 'szt',
                    blockType: BlockType.COMMAND,
                    // text: '设置相机视锥体(渲染范围)近端面[a]，远端面[b]',
                    text: '此功能还未完工[a][b]',
                    hide: true,
                    arguments: {
                        a: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '1',
                        },
                        b: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '1000',
                        }
                    },
                },
                {
                    opcode: 'setClearColor',
                    blockType: BlockType.COMMAND,
                    text: '设置背景颜色[color]',
                    arguments: {
                        color: {
                            type: ArgumentType.STRING,
                            defaultValue: '#eeeeee',
                        },
                    },
                },
                {
                    opcode: 'xr',
                    blockType: BlockType.REPORTER,
                    text: '获取渲染图片链接',
                    arguments: {

                    },
                },
                '文件加载',
                {
                    opcode: 'loadOBJ',
                    blockType: BlockType.COMMAND,
                    text: '加载OBJ文件url[url]，命名为[m]',
                    arguments: {
                        url: {
                            type: ArgumentType.STRING,
                            defaultValue: 'blob:xxx.obj',
                        },
                        m: {
                            type: ArgumentType.STRING,
                            defaultValue: '模型',
                        },
                    },
                },
                {
                    opcode: 'loadOM',
                    blockType: BlockType.COMMAND,
                    text: '加载OBJ[url]和MTL[url2]，命名为[m]',
                    arguments: {
                        url: {
                            type: ArgumentType.STRING,
                            defaultValue: 'blob:xxx.obj',
                        },
                        url2: {
                            type: ArgumentType.STRING,
                            defaultValue: 'blob:xxx.mtl',
                        },
                        m: {
                            type: ArgumentType.STRING,
                            defaultValue: '模型',
                        },
                    },
                },
                '辅助功能',
                {
                    opcode: 'getM',
                    blockType: BlockType.REPORTER,
                    text: '获取渲染坐标([x],[y])对应的图形',
                    arguments: {
                        x: {
                            type: ArgumentType.STRING,
                            defaultValue: '0',
                        },
                        y: {
                            type: ArgumentType.STRING,
                            defaultValue: '0',
                        },

                    },
                },
                {
                    opcode: 'xyztoxy',
                    blockType: BlockType.REPORTER,
                    text: '([x],[y],[z])的渲染坐标',
                    arguments: {
                        x: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0',
                        },
                        y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0',
                        },
                        z: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0',
                        },
                    },
                },
                {
                    opcode: 'clone',
                    blockType: BlockType.COMMAND,
                    text: '克隆[a][b]，命名为[c]',
                    arguments: {
                        a: {
                            type: ArgumentType.STRING,
                            defaultValue: '模型',
                            menu: 'mx'
                        },
                        b: {
                            type: ArgumentType.STRING,
                            defaultValue: 'mesh',
                        },
                        c: {
                            type: ArgumentType.STRING,
                            defaultValue: 'mesh2',
                        },
                    },
                },
                {
                    opcode: 'group',
                    blockType: BlockType.COMMAND,
                    text: '组合模型[b]，命名为[c]',
                    arguments: {
                        b: {
                            type: ArgumentType.STRING,
                            defaultValue: '["mesh","mesh2"]',
                        },
                        c: {
                            type: ArgumentType.STRING,
                            defaultValue: 'mesh_group',
                        },
                    },
                }
            ],
            menus: {
                z: ['30帧', '60帧'],
                cz: ['基础网格材质', 'Lambert网格材质', '高光Phong材质', 'PBR物理材质', '基础线条材质', '虚线材质',
                    '深度网格材质', '网格Distance材质', '网格Matcap材质', '法线网格材质', '物理网格材质'
                ],
                cz2: ['颜色', '线框(0或1)', '透明度(0到1)', '开启透明(0或1)', '贴图图片url'],
                gy: ['环境光', '点光源', '平行光', '聚光源'],
                lf: ['立方体', '球体'],
                m: ['4', '8', '12', '20'],
                xyz: ['X', 'Y', 'Z'],
                ds: ['弧度', '度'],
                type: ['网格', '点', '线'],
                side: ['正面', '背面', '正面和背面', '双通道双面'],
                mx: ['模型', '材质'],
                d: ['并', '不'],
                c: ['正交', '透视'],
                //cj:['场景中心','图形']
            }
        };
    }
    clone({ a, b, c }) {
        let f;
        if (a == '模型') f = '3dms';
        if (a == '材质') f = '3dma';
        let d = temp2[f][b].clone();
        d.name = c
        temp2[f][c] = d
    }
    getM({ x, y }) {
        x = x * 2 / this.runtime.stageWidth,
            y = y * 2 / this.runtime.stageHeight;
        let l = [];
        var pointer = new THREE.Vector2()
        pointer.x = x;
        pointer.y = y;
        raycaster.setFromCamera(pointer, temp2.camera);
        const intersects = raycaster.intersectObjects(temp2['3d-'].children);
        for (let i = 0; i < intersects.length; i++) {
            let n = intersects[i].object.name;
            if (n)
                l.push(n)
        }
        return JSON.stringify(l)
    }
    loadOBJ({ url, m }) {
        var loader = new OBJLoader();
        if (!url.startsWith('blob:') && !url.startsWith('https://')) {
            mdui.snackbar('仅支持加载blob:开头的模型地址')
            return;
        }
        return new Promise(r => {
            loader.load(url, function (obj) {
                // 控制台查看返回结构：包含一个网格模型Mesh的组Group
                console.log(obj);
                obj.name = m
                // 查看加载器生成的材质对象：MeshPhongMaterial
                console.log(obj.children[0].material);
                temp2['3d-'].add(obj);
                temp2['3dms'][m] = obj;
                // let l = [];
                // for (let i = 0; i < obj.children.length; i++) {
                //     temp2['3dms'][m + '' + i] = obj.children[i];
                //     l.push(m + '' + i)
                // }
                // r(JSON.stringify(l));
                r()
            })
        })
    }
    loadOM({ url, url2, m }) {
        var loader = new OBJLoader();
        var loader2 = new MTLLoader();
        if (!url.startsWith('blob:') && !url.startsWith('https://')) {
            mdui.snackbar('仅支持加载blob:开头的模型地址')
            return;
        }

        return new Promise(r => {
            loader2.load(url2, function (materials) {
                // 返回一个包含材质的对象MaterialCreator
                console.log(materials);
                //obj的模型会和MaterialCreator包含的材质对应起来
                loader.setMaterials(materials);
                loader.load(url, function (obj) {
                    // 控制台查看返回结构：包含一个网格模型Mesh的组Group
                    console.log(obj);
                    obj.name = m;
                    // 查看加载器生成的材质对象：MeshPhongMaterial
                    console.log(obj.children[0].material);
                    temp2['3d-'].add(obj);
                    // let l = [];
                    temp2['3dms'][m] = obj;
                    // for (let i = 0; i < obj.children.length; i++) {
                    //     temp2['3dms'][m + '' + i] = obj.children[i];
                    //     l.push(m + '' + i)
                    // }
                    // r(JSON.stringify(l));
                    r();
                })
            })
        })
    }
    setClearColor({ color }) {
        let c2 = isNaN(color - 0) ? color : color - 0
        temp2.renderer.setClearColor(c2, 1);
    }

    ad() {

    }
    f({ x, y, cc, a, b }) {
        temp2['3d-'] = new THREE.Scene();
        var width = x || 480; //窗口宽度
        var height = y || 360; //窗口高度
        var k = width / height; //窗口宽高比
        var s = 200; //三维场景显示范围控制系数，系数越大，显示的范围越大
        //创建相机对象

        let c2 = "OrthographicCamera"
        // console.log(cc)
        this.cx = x
        this.cy = y
        a = a === undefined ? 1 : a
        b = b === undefined ? 1000 : b
        if (cc == '透视') {
            c2 = 'PerspectiveCamera'
            temp2.camera = new THREE[c2](45, k, a, b);
        } else {
            temp2.camera = new THREE[c2](-s * k, s * k, s, -s, a, b);
        }
        temp2.renderer = new THREE.WebGLRenderer();
        temp2.renderer.setSize(width, height);
        temp2.renderer.setClearColor(0xb9d3ff, 1);
        temp2['3dcu'] = {};
        temp2['3dma'] = {};
        temp2['3dms'] = {};
        temp2['3dpo'] = {};
        this.controls = new OrbitControls(temp2.camera, temp2.renderer.domElement);
        this.controls.autoRotate = true;
        //设置相机方向(指向的场景对象)
    }
    cu(a) {
        try {
            if (a.l != '球体')
                temp2['3dcu'][a.n] = new THREE.BoxGeometry(a.x - 0, a.y - 0, a.z - 0);
            else
                temp2['3dcu'][a.n] = new THREE.SphereGeometry(a.x - 0, a.y - 0, a.z - 0);
        } catch (e) { console.log(e); }

    }
    d(a) {
        try {
            if (a.l == '8')
                temp2['3dcu'][a.n] = new THREE.OctahedronGeometry(a.a - 0);
            if (a.l == '12')
                temp2['3dcu'][a.n] = new THREE.DodecahedronGeometry(a.a - 0);
            if (a.l == '20')
                temp2['3dcu'][a.n] = new THREE.IcosahedronGeometry(a.a - 0);
        } catch (e) { console.log(e); }

    }
    yz(a) {
        try {
            temp2['3dcu'][a.n] = new THREE.CylinderGeometry(a.a, a.b, a.c, a.d);
        } catch (e) { console.log(e); }

    }
    yz2(a) {
        try {
            temp2['3dcu'][a.n] = new THREE.ConeGeometry(a.b, a.c, a.d);
        } catch (e) { console.log(e); }

    }
    ma(a) {
        if (temp2['3dma'] === undefined) {
            return;
        }
        let cz = ['基础网格材质', 'Lambert网格材质', '高光Phong材质', 'PBR物理材质', '基础线条材质', '虚线材质',
            '深度网格材质', '网格Distance材质', '网格Matcap材质', '法线网格材质', '物理网格材质'
        ],
            cz2 = ['MeshBasicMaterial', 'MeshLambertMaterial', 'MeshPhongMaterial', 'MeshStandardMaterial', 'LineBasicMaterial', 'LineDashedMaterial',
                'MeshDepthMaterial', 'MeshDistanceMaterial', 'MeshMatcapMaterial', 'MeshNormalMaterial', 'MeshPhysicalMaterial'
            ];
        let b = isNaN(a.c - 0) ? a.c : a.c - 0
        temp2['3dma'][a.n] = new THREE[cz2[cz.indexOf(a.t)]]({ color: b });
    }
    setm(a) {
        if (!temp2['3d-'])
            return;
        try {
            let b = isNaN(a.c - 0) ? a.c : a.c - 0
            if (a.t == "贴图图片url") {
                temp2['3dma'][a.n]['map'] = new THREE.TextureLoader().load(a.c);
                return;
            }
            if (a.t == "颜色") {
                temp2['3dma'][a.n]['color'].set(b)
                return;
            }
            let cz2 = ['color', 'wireframe', 'opacity', 'transparent'],
                cz = ['颜色', '线框(0或1)', '透明度(0到1)', '开启透明(0或1)'];
            temp2['3dma'][a.n][cz2[cz.indexOf(a.t)]] = b;
        } catch (e) { console.log(e) }

    }
    gsetm(a) {
        if (!temp2['3d-'])
            return;
        try {
            // if(a.d=='并')temp2['3dms'][a.n]['material']=temp2['3dms'][a.n]['material'].clone()
            let b = isNaN(a.c - 0) ? a.c : a.c - 0
            if (a.t == "贴图图片url") {
                temp2['3dms'][a.n]['material']['map'] = new THREE.TextureLoader().load(a.c);
                return;
            }
            if (a.t == "颜色") {
                temp2['3dms'][a.n]['material']['color'].set(b)
                return;
            }
            let cz2 = ['color', 'wireframe', 'opacity', 'transparent'],
                cz = ['颜色', '线框(0或1)', '透明度(0到1)', '开启透明(0或1)'];
            temp2['3dms'][a.n]['material'][cz2[cz.indexOf(a.t)]] = b;
        } catch (e) { console.log(e) }

    }
    setside({ n, side }) {
        if (!temp2['3d-'])
            return;
        let cz2 = ['Front', 'Back', 'Double', 'TwoPassDouble'],
            cz = ['正面', '背面', '正面和背面', '双通道双面'];
        temp2['3dma'][n]['side'] = THREE[cz.indexOf(side) + 'Side'];
    }
    add(a) {
        let { type } = a;
        let v = "Mesh";
        if (type == "点") v = "Points"
        if (type == "线") v = "Line"
        if (!temp2['3dms'])
            return;
        try {
            name
            temp2['3dms'][a.n] = new THREE[v](temp2['3dcu'][a.a], temp2['3dma'][a.b]);
            temp2['3dms'][a.n].name = a.n
        } catch (e) {
            console.log(e);
        }
    }
    sxyz(a) {
        if (temp2['3dms'] === undefined) return;
        temp2['3dms'][a.a].position.set(a.x - 0, a.y - 0, a.z - 0)
    }
    addm(a) {
        if (temp2['3dms'] === undefined) return;
        temp2['3d-'].add(temp2['3dms'][a.n]);
    }
    addGrid({ n, size, divisions, colorCenterLine, colorGrid }) {
        if (temp2['3dms'] === undefined) return;
        colorCenterLine = isNaN(colorCenterLine - 0) ? colorCenterLine : colorCenterLine - 0
        colorGrid = isNaN(colorGrid - 0) ? colorGrid : colorGrid - 0
        temp2['3dms'][n] = new THREE.GridHelper(size, divisions, colorCenterLine, colorGrid);
    }
    rotate({ n, xyz, n2, ds }) {
        if (temp2['3dms'] === undefined) return;
        if (ds == '度') {
            n2 = n2 / 180 * Math.PI
        }
        temp2['3dms'][n]['rotate' + xyz](n2);
    }
    setRotate({ n, x, y, z, ds }) {
        if (temp2['3dms'] === undefined) return;
        if (ds == '度') {
            x = x / 180 * Math.PI
            y = y / 180 * Math.PI
            z = z / 180 * Math.PI
        }
        temp2['3dms'][n].setRotationFromEuler(new THREE.Euler(x, y, z));
    }
    setRotateC({ x, y, z, ds }) {
        if (temp2['3dms'] === undefined) return;
        if (ds == '度') {
            x = x / 180 * Math.PI
            y = y / 180 * Math.PI
            z = z / 180 * Math.PI
        }
        temp2.camera.setRotationFromEuler(new THREE.Euler(x, y, z));
    }
    setScale({ n, x, y, z }) {
        if (temp2['3dms'] === undefined) return;
        temp2['3dms'][n].scale.set(x, y, z)
    }
    point(a) {
        if (temp2['3dpo'] === undefined) {
            return;
        }
        let cz = ['环境光', '点光源', '平行光', '聚光源'],
            cz2 = ['AmbientLight', 'PointLight', 'DirectionalLight', 'SpotLight'];
        let b = isNaN(a.b - 0) ? a.b : a.b - 0
        let c = a.c === undefined ? 1 : a.c
        temp2['3dpo'][a.a] = new THREE[cz2[cz.indexOf(a.g)]](b, c);
        console.log(cz2[cz.indexOf(a.g)], b);
    }
    HemisphereLight(a) {
        if (temp2['3dpo'] === undefined) {
            return;
        }
        let b = isNaN(a.b - 0) ? a.b : a.b - 0
        let f = isNaN(a.f - 0) ? a.f : a.f - 0
        temp2['3dpo'][a.a] = new THREE['HemisphereLight'](b, f, a.c);
        console.log(cz2[cz.indexOf(a.g)], b);
    }
    spa(a) {
        try {
            temp2['3dpo'][a.a].position.set(a.x - 0, a.y - 0, a.z - 0)
        } catch (e) {
            console.log(e);
        }
    }
    adp(a) {
        if (!temp2['3d-'])
            return;
        try {
            temp2['3d-'].add(temp2['3dpo'][a.a])
        } catch (e) {
            console.log(e);
        }
    }
    ada(a) {
        if (!temp2['3d-'])
            return;
        temp2['3d-'].add(new THREE.AmbientLight(a.a - 0));
    }
    sc(a) {
        try {
            temp2.camera.position.set(a.x, a.y, a.z);
        } catch (e) { console.log(e); }
    }
    szt({ a, b }) {
        temp2.camera.near = a;
        temp2.camera.far = b;
    }
    // re(a){

    // }
    xr() {
        try {
            temp2.renderer.render(temp2['3d-'], temp2.camera);
            return URL.createObjectURL(dataURLToBlob(temp2.renderer.domElement.toDataURL("image/png")));
        } catch (e) {
            try {
                temp2.renderer.render(temp2['3d-'], temp2.camera);
                return URL.createObjectURL(dataURLToBlob(temp2.renderer.domElement.toDataURL("image/png")));
            } catch (e) {
                console.log(e);
                return '';
            }
        }

    }
    cm(a) {
        try {
            temp2.camera.lookAt(new THREE.Vector3(a.x - 0, a.y - 0, a.z - 0));
        } catch (e) { console.log(e); }
    }
    xyztoxy({ x, y, z }) {
        var point3D = new THREE.Vector3(x - 0, y - 0, z - 0);
        console.log(point3D, x, y, z)
        var point2D = point3D.project(temp2.camera);

        console.log(point2D);
        return point2D.x * 0.5 * this.runtime.stageWidth + ',' + point2D.y * 0.5 * this.runtime.stageHeight
    }
    group({ b, c }) {
        let j = JSON.parse(b)
        const group = new THREE.Group();
        for (let i = 0; i < j.length; i++) {
            group.add(temp2['3dms'][j[i]]);
        }
        temp2['3dms'][c] = group
    }
}

module.exports = Scratch3threeBlocks;
