const formatMessage = require('format-message');
const BlockType = require('../../extension-support/block-type');
const ArgumentType = require('../../extension-support/argument-type');
const Cast = require('../../util/cast');
const cannon = require('cannon')
const CANNON = cannon


class Blocks {
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
            id: 'p3d',
            name: '3D物理引擎',
            blocks: [
                {
                    opcode: 'init',
                    text: '初始化',
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'setGravity',
                    text: '设置重力x[x]y[y]z[z]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        x: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0'
                        },
                        y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '-9.8'
                        },
                        z: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0'
                        }
                    }
                },
                {
                    opcode: 'addCube',
                    text: '建立立方体，长高宽([x][y][z])*2，命名为[name]',
                    blockType: BlockType.COMMAND,
                    hide:1,
                    arguments: {
                        x: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0'
                        },
                        y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '9'
                        },
                        z: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0'
                        },
                        name: {
                            type: ArgumentType.STRING,
                            defaultValue: 'cube'
                        }
                    }
                },
                {
                    opcode: 'addCube2',
                    text: '建立立方体，长高宽([x][y][z])，命名为[name]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        x: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0'
                        },
                        y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '9'
                        },
                        z: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0'
                        },
                        name: {
                            type: ArgumentType.STRING,
                            defaultValue: 'cube'
                        }
                    }
                },
                {
                    opcode: 'addSphere',
                    text: '建立球体，半径[a]，命名为[name]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        a: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0'
                        },
                        name: {
                            type: ArgumentType.STRING,
                            defaultValue: 'cube'
                        }
                    }
                },
                {
                    opcode: 'addCylinder',
                    blockType: BlockType.COMMAND,
                    text: '建立圆柱，顶部半径[a]，底部半径[b]，高度[c]，圆周分段数[d]，命名为[name]',
                    arguments: {
                        name: {
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
                // {
                //     opcode: 'addPlane',
                //     text: '建立平面，命名为[name]',
                //     blockType: BlockType.COMMAND,
                //     arguments: {
                //         name: {
                //             type: ArgumentType.STRING,
                //             defaultValue: 'cube'
                //         }
                //     }
                // },
                {
                    opcode: 'addToWorld',
                    text: '添加几何体[name]到物理世界，质量为[mass]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        mass: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0'
                        },
                        name: {
                            type: ArgumentType.STRING,
                            defaultValue: 'cube'
                        }
                    }
                },
                {
                    opcode: 'setBody',
                    text: '设置几何体[name][attribute]的xyz为[x][y][z]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        attribute: {
                            type: ArgumentType.STRING,
                            defaultValue: 'position',
                            menu: 'attribute'
                        },
                        name: {
                            type: ArgumentType.STRING,
                            defaultValue: 'cube'
                        },
                        x: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0'
                        },
                        y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '6'
                        },
                        z: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0'
                        },
                    }
                },
                {
                    opcode: 'setBody2',
                    text: '设置几何体[name]的[attribute]为[a]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        attribute: {
                            type: ArgumentType.STRING,
                            defaultValue: 'friction',
                            menu: 'attribute2'
                        },
                        name: {
                            type: ArgumentType.STRING,
                            defaultValue: 'cube'
                        },
                        a: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0'
                        },
                    }
                },
                {
                    opcode: 'getBody',
                    text: '获取几何体[name][attribute]的[cs]',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        attribute: {
                            type: ArgumentType.STRING,
                            defaultValue: 'position',
                            menu: 'attribute'
                        },
                        name: {
                            type: ArgumentType.STRING,
                            defaultValue: 'cube'
                        },
                        cs: {
                            type: ArgumentType.STRING,
                            defaultValue: 'x',
                            menu: 'cs'
                        },
                    }
                },
                {
                    opcode: 'getBody2',
                    text: '获取几何体[name]的[attribute]',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        attribute: {
                            type: ArgumentType.STRING,
                            defaultValue: 'friction',
                            menu: 'attribute2'
                        },
                        name: {
                            type: ArgumentType.STRING,
                            defaultValue: 'cube'
                        },
                    }
                },
                {
                    opcode: 'setBodyQuaternion',
                    text: '设置几何体[name]旋转四元数x[x]y[y]z[z]w[a][d]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        name: {
                            type: ArgumentType.STRING,
                            defaultValue: 'cube'
                        },
                        x: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0'
                        },
                        y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '1'
                        },
                        z: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0'
                        },
                        a: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '10'
                        },
                        d: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 'angle',
                            menu: 'deg'
                        }
                    }
                },
                // {
                //     opcode: 'addBodyQuaternion',
                //     text: '旋转几何体[name]四元数x[x]y[y]z[z]w[a][d]',
                //     blockType: BlockType.COMMAND,
                //     arguments: {
                //         name: {
                //             type: ArgumentType.STRING,
                //             defaultValue: 'cube'
                //         },
                //         x: {
                //             type: ArgumentType.NUMBER,
                //             defaultValue: '0'
                //         },
                //         y: {
                //             type: ArgumentType.NUMBER,
                //             defaultValue: '1'
                //         },
                //         z: {
                //             type: ArgumentType.NUMBER,
                //             defaultValue: '0'
                //         },
                //         a: {
                //             type: ArgumentType.NUMBER,
                //             defaultValue: '10'
                //         },
                //         d: {
                //             type: ArgumentType.NUMBER,
                //             defaultValue: 'angle',
                //             menu: 'deg'
                //         }
                //     }
                // },
                {
                    opcode: 'getBodyQuaternion',
                    text: '获取几何体[name]绕[cs]旋转的[d]',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        name: {
                            type: ArgumentType.STRING,
                            defaultValue: 'cube'
                        },
                        cs: {
                            type: ArgumentType.STRING,
                            defaultValue: 'x',
                            menu: 'cs2'
                        },
                        d: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 'angle',
                            menu: 'deg'
                        }
                    }
                },
                {
                    opcode: 'copyToMesh',
                    text: '将物理几何体[name]的坐标和旋转角度复制到3D模型[mesh]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        name: {
                            type: ArgumentType.STRING,
                            defaultValue: 'cube'
                        },
                        mesh: {
                            type: ArgumentType.STRING,
                            defaultValue: 'mesh',
                        }
                    }
                },
                {
                    opcode: 'copyToCamera',
                    text: '将物理几何体[name]的坐标和旋转角度复制到相机',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        name: {
                            type: ArgumentType.STRING,
                            defaultValue: 'cube'
                        }
                    }
                },
                {
                    opcode: 'doTick',
                    text: '分步模拟，[timeStep]秒',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        timeStep: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '0.033333'
                        },
                    }
                },
            ],
            menus: {
                attribute: [
                    { text: '位置', value: 'position' },
                    { text: '速度', value: 'velocity' },
                    { text: '角速度', value: 'angularVelocity' },
                    { text: '受力', value: 'force' },
                    { text: '扭矩', value: 'torque' },
                ],
                cs: ['x', 'y', 'z'],
                cs2: ['x', 'y', 'z','w'],
                deg: [
                    { text: '角度', value: 'angle' },
                    { text: '弧度', value: 'radian' }
                ],
                attribute2: [
                    { text: '质量', value: 'mass' },
                    { text: '摩擦力(0~1)', value: 'friction' },
                    { text: '弹性系数(0~1)', value: 'restitution' },
                ]
            }
        };
    }
    init() {
        this.world = new CANNON.World()
        this.shape = {}
        this.body = {}
    }
    setGravity({ x, y, z }) {
        this.world.gravity.set(x, y, z)
    }
    addCube({ x, y, z, name }) {
        this.shape[name] = new CANNON.Box(new CANNON.Vec3(x, y, z));
    }
    addCube2({ x, y, z, name }) {
        this.shape[name] = new CANNON.Box(new CANNON.Vec3(x/2, y/2, z/2));
    }
    addSphere({ a, name }) {
        this.shape[name] = new CANNON.Sphere(a);
    }
    addCylinder({ a,b,c,d, name }) {
        this.shape[name] = new CANNON.Cylinder(a,b,c,d);
    }
    addPlane({ name }) {
        this.shape[name] = new CANNON.Plane();
    }
    addToWorld({ name, mass }) {
        this.body[name] = new CANNON.Body({ 
            mass: mass,
            shape:this.shape[name],
            material:new CANNON.Material
        });
        this.world.addBody(this.body[name])
    }
    setBody({ name, attribute, x, y, z }) {
        this.body[name][attribute].set(x, y, z)
    }
    setBody2({ name, attribute, a }) {
        if(['friction','restitution'].indexOf(attribute)!==-1){
            this.body[name].material[attribute]=a
        }
        this.body[name][attribute]=a
    }
    getBody2({ name, attribute}) {
        if(['friction','restitution'].indexOf(attribute)!==-1){
            return this.body[name].material[attribute]
        }
        return this.body[name][attribute]
    }
    getBody({ name, attribute, cs }) {
        return this.body[name][attribute][cs]
    }
    setBodyQuaternion({ name, x,y,z, a, d }) {
        let n;
        // if (cs == "x")
        //     n = new CANNON.Vec3(1, 0, 0);
        // if (cs == "y")
        //     n = new CANNON.Vec3(0, 1, 0);
        // if (cs == "z")
        //     n = new CANNON.Vec3(0, 0, 1);
        if (d == 'angle')
            a = a / 180 * Math.PI
        this.body[name].quaternion.setFromAxisAngle(new CANNON.Vec3(x, y, z), a);
    }
    addBodyQuaternion({ name, x,y,z, a, d }) {
        let n;
        if (d == 'angle')
            a = a / 180 * Math.PI
        // this.body[name].quaternion.setFromAxisAngle(new CANNON.Vec3(x, y, z), a);
        let q=new CANNON.Quaternion(),q2=this.body[name].quaternion.clone();
        q.setFromAxisAngle(new CANNON.Vec3(x,y,z), a)
        this.body[name].quaternion=this.body[name].quaternion.mult(
            q2,
            q
        )
        console.log(q,q2,this.body[name].quaternion)
    }

    getBodyQuaternion({ name, cs, d }) {
        console.log(this.body[name])
        const rotation = this.body[name].quaternion;
        let a = rotation[cs]
        if (d == 'angle')
            a = a * 180 / Math.PI
        return a;
    }
    copyToMesh({name,mesh}){
        // console.log(this)
        temp2['3dms'][mesh].position.copy(this.body[name].position)
        temp2['3dms'][mesh].quaternion.copy(this.body[name].quaternion)
    }
    copyToCamera({name}){
        // console.log(this)
        temp2.camera.position.copy(this.body[name].position)
        temp2.camera.quaternion.copy(this.body[name].quaternion)
    }
    doTick({timeStep}){
        this.world.step(timeStep);
    }
}

module.exports = Blocks;
