/*MIT License

Copyright (c) 2021-2022 TurboWarp Extensions Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/

const ArgumentType = require('../../../src/extension-support/argument-type');
const BlockType = require('../../../src/extension-support/block-type');
const Cast = require('../../../src/util/cast');
const Clone = require('../../../src/util/clone');
const Color = require('../../../src/util/color');
const MathUtil = require('../../../src/util/math-util');
const RenderedTarget = require('../../../src/sprites/rendered-target');
const log = require('../../../src/util/log');
const Variable = require('../../../src/engine/variable');
const { renderer } = vm

//拉伸模块
const STRETCH_X = Symbol('stretch.x');
const STRETCH_Y = Symbol('stretch.y');
const forceUpdateDirectionAndScale = (target) => {
    target.setDirection(target.direction);
};
const implementStretchForTarget = (target, originalTarget) => {
    target[STRETCH_X] = originalTarget ? originalTarget[STRETCH_X] : 100;
    target[STRETCH_Y] = originalTarget ? originalTarget[STRETCH_Y] : 100;

    const original = target._getRenderedDirectionAndScale;
    target._getRenderedDirectionAndScale = function () {
        const result = original.call(this);

        result.scale[0] *= this[STRETCH_X] / 100;
        result.scale[1] *= this[STRETCH_Y] / 100;

        return result;
    };
};
vm.runtime.targets.forEach((target) => implementStretchForTarget(target));
vm.runtime.on('targetWasCreated', (target, originalTarget) => implementStretchForTarget(target, originalTarget));
vm.runtime.on('PROJECT_LOADED', () => {
    vm.runtime.targets.forEach((target) => implementStretchForTarget(target));
});

//指针锁定模块
const canvas = vm.runtime.renderer.canvas;
const mouse = vm.runtime.ioDevices.mouse;
let isLocked = false;
let isPointerLockEnabled = false;

let rect = canvas.getBoundingClientRect();
window.addEventListener('resize', () => {
    rect = canvas.getBoundingClientRect();
});
let zx = 0, zy = 0;
const postMouseData = (e, isDown) => {
    const { movementX, movementY } = e;
    const { width, height } = rect;
    const x = mouse._clientX + movementX;
    const y = mouse._clientY - movementY;
    mouse._clientX = x;
    mouse._scratchX = mouse.runtime.stageWidth * ((x / width) - 0.5);
    mouse._clientY = y;
    mouse._scratchY = mouse.runtime.stageWidth * ((y / height) - 0.5);
    zx += mouse._scratchX
    zy += mouse._scratchY
    if (typeof isDown === 'boolean') {
        const data = {
            button: e.button,
            isDown
        };
        originalPostIOData(data);
    }
};

const mouseDevice = vm.runtime.ioDevices.mouse;
const originalPostIOData = mouseDevice.postData.bind(mouseDevice);
mouseDevice.postData = (data) => {
    if (!isPointerLockEnabled) {
        return originalPostIOData(data);
    }
};

document.addEventListener('mousedown', e => {
    if (canvas.contains(e.target)) {
        if (isLocked) {
            postMouseData(e, true);
        } else if (isPointerLockEnabled) {
            canvas.requestPointerLock();
        }
    }
}, true);
document.addEventListener('mouseup', e => {
    if (isLocked) {
        postMouseData(e, false);
    } else if (isPointerLockEnabled && canvas.contains(e.target)) {
        canvas.requestPointerLock();
    }
}, true);
document.addEventListener('mousemove', e => {
    if (isLocked) {
        // console.log(e);
        postMouseData(e);
    }
}, true);

document.addEventListener('pointerlockchange', () => {
    isLocked = document.pointerLockElement === canvas;
});
document.addEventListener('pointerlockerror', e => {
    // eslint-disable-next-line no-console
    console.error('Pointer lock error', e);
});

const oldStep = vm.runtime._step;
vm.runtime._step = function (...args) {
    const ret = oldStep.call(this, ...args);
    if (isPointerLockEnabled) {
        const { width, height } = rect;
        mouse._clientX = width / 2;
        mouse._clientY = height / 2;
        mouse._scratchX = 0;
        mouse._scratchY = 0;
    }
    return ret;
};

const lazilyCreatedCanvas = () => {
    /** @type {HTMLCanvasElement} */
    let canvas = null;
    /** @type {CanvasRenderingContext2D} */
    let ctx = null;
    /**
     * @param {number} width
     * @param {number} height
     * @returns {[HTMLCanvasElement, CanvasRenderingContext2D]}
     */
    return (width, height) => {
        if (!canvas) {
            canvas = document.createElement('canvas');
            ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Could not get 2d rendering context');
            }
        }
        // Setting canvas size also clears it
        canvas.width = width;
        canvas.height = height;
        return [canvas, ctx];
    }
};
const getRawSkinCanvas = lazilyCreatedCanvas();

/**
 * @param {RenderWebGL.Skin} skin
 * @returns {string} A data: URI for the skin.
 */
const encodeSkinToURL = (skin) => {
    const svgSkin = /** @type {RenderWebGL.SVGSkin} */ (skin);
    if (svgSkin._svgImage) {
        // This is an SVG skin
        return svgSkin._svgImage.src;
    }

    // It's probably a bitmap skin.
    // The most reliable way to get the bitmap in every runtime is through the silhouette.
    // This is very slow and could involve reading the texture from the GPU.
    const silhouette = skin._silhouette;
    // unlazy() only exists in TW
    if (silhouette.unlazy) {
        silhouette.unlazy();
    }
    const colorData = silhouette._colorData;
    const width = silhouette._width;
    const height = silhouette._height;
    const imageData = new ImageData(colorData, silhouette._width, silhouette._height);
    const [canvas, ctx] = getRawSkinCanvas(width, height);
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
};

/**
 * @param {VM.Costume} costume
 * @param {number} maxWidth
 * @param {number} maxHeight
 * @returns {{uri: string, width: number, height: number}}
 */
const costumeToCursor = (costume, maxWidth, maxHeight) => {
    const skin = vm.renderer._allSkins[costume.skinId];
    const imageURI = encodeSkinToURL(skin);

    let width = skin.size[0];
    let height = skin.size[1];
    if (width > maxWidth) {
        height = height * (maxWidth / width);
        width = maxWidth;
    }
    if (height > maxHeight) {
        width = width * (maxHeight / height);
        height = maxHeight;
    }
    width = Math.round(width);
    height = Math.round(height);

    // We wrap the encoded image in an <svg>. This lets us do some clever things:
    //  - We can resize the image without a canvas.
    //  - We can give the browser an image with more raw pixels than its DPI independent size
    // The latter is important so that cursors won't look horrible on high DPI displays. For
    // example, if the cursor will display at 32x32 in DPI independent units on a 2x high DPI
    // display, we actually need to send a 64x64 image for it to look good. This lets us do
    // that automatically.
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;
    svg += `<image href="${imageURI}" width="${width}" height="${height}" />`;
    svg += '</svg>';
    // URI encoding usually results in smaller string than base 64 for the types of data we get here.
    const svgURI = `data:image/svg+xml;,${encodeURIComponent(svg)}`;

    return {
        uri: svgURI,
        width,
        height
    };
};

/** @type {string} */
let nativeCursor = 'default';
/** @type {null|string} */
let customCursorImageName = null;

const canvas2 = renderer.canvas;
/** @type {string} */
let currentCanvasCursor = nativeCursor;
const updateCanvasCursor = () => {
    if (canvas2.style.cursor !== currentCanvasCursor) {
        canvas2.style.cursor = currentCanvasCursor;
    }
};

// scratch-gui will sometimes reset the cursor when resizing the window or going in/out of fullscreen
new MutationObserver(updateCanvasCursor).observe(canvas2, {
    attributeFilter: ['style'],
    attributes: true
});

/**
 * Parse strings like "60x12" or "77,1"
 * @param {string} string
 * @returns {[number, number]}
 */
const parseTuple = (string) => {
    const [a, b] = ('' + string).split(/[ ,x]/);
    return [
        +a || 0,
        +b || 0
    ];
};

const TURBO_MODE = 'turbo mode';
const INTERPOLATION = 'interpolation';
const REMOVE_FENCING = 'remove fencing';
const REMOVE_MISC_LIMITS = 'remove misc limits';

/*pen +*/
const EXAMPLE_IMAGE = 'https://extensions.turbowarp.org/dango.png';

const canvas3 = renderer.canvas
const gl = renderer._gl

// TODO: see how these differ from Scratch, if at all
gl.enable(gl.BLEND);
gl.blendEquation(gl.FUNC_ADD);
gl.blendFunc(gl.ONE_MINUS_CONSTANT_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

var stampWidth = 64;
var stampHeight = 64;

var screenWidth = 480;
var screenHeight = 360;

var stampRotation = 90;

const m4 = (function() {
  /*!
   * 4x4 matrix operation code is from https://webglfundamentals.org/webgl/resources/m4.js
   * We have made some changes:
   *  - Fixed type errors
   *  - Changed code formatting
   *  - Removed unused functions
   *
   * Copyright 2021 GFXFundamentals.
   * All rights reserved.
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are
   * met:
   *
   *     * Redistributions of source code must retain the above copyright
   * notice, this list of conditions and the following disclaimer.
   *     * Redistributions in binary form must reproduce the above
   * copyright notice, this list of conditions and the following disclaimer
   * in the documentation and/or other materials provided with the
   * distribution.
   *     * Neither the name of GFXFundamentals. nor the names of his
   * contributors may be used to endorse or promote products derived from
   * this software without specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
   * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
   * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
   * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
   * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
   * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
   * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
   * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
   * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
   * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   */

  /**
   * An array or typed array with 3 values.
   * @typedef {number[]|Float32Array} Vector3
   * @memberOf module:webgl-3d-math
   */

  /**
   * An array or typed array with 4 values.
   * @typedef {number[]|Float32Array} Vector4
   * @memberOf module:webgl-3d-math
   */

  /**
   * An array or typed array with 16 values.
   * @typedef {number[]|Float32Array} Matrix4
   * @memberOf module:webgl-3d-math
   */


  let MatType = Float32Array;

  /**
   * Sets the type this library creates for a Mat4
   * @param {Float32ArrayConstructor} Ctor the constructor for the type. Either `Float32Array` or `Array`
   * @return {Float32ArrayConstructor} previous constructor for Mat4
   */
  function setDefaultType(Ctor) {
    const OldType = MatType;
    MatType = Ctor;
    return OldType;
  }

  /**
   * Takes two 4-by-4 matrices, a and b, and computes the product in the order
   * that pre-composes b with a.  In other words, the matrix returned will
   * transform by b first and then a.  Note this is subtly different from just
   * multiplying the matrices together.  For given a and b, this function returns
   * the same object in both row-major and column-major mode.
   * @param {Matrix4} a A matrix.
   * @param {Matrix4} b A matrix.
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   */
  function multiply(a, b, dst) {
    dst = dst || new MatType(16);
    var b00 = b[0 * 4 + 0];
    var b01 = b[0 * 4 + 1];
    var b02 = b[0 * 4 + 2];
    var b03 = b[0 * 4 + 3];
    var b10 = b[1 * 4 + 0];
    var b11 = b[1 * 4 + 1];
    var b12 = b[1 * 4 + 2];
    var b13 = b[1 * 4 + 3];
    var b20 = b[2 * 4 + 0];
    var b21 = b[2 * 4 + 1];
    var b22 = b[2 * 4 + 2];
    var b23 = b[2 * 4 + 3];
    var b30 = b[3 * 4 + 0];
    var b31 = b[3 * 4 + 1];
    var b32 = b[3 * 4 + 2];
    var b33 = b[3 * 4 + 3];
    var a00 = a[0 * 4 + 0];
    var a01 = a[0 * 4 + 1];
    var a02 = a[0 * 4 + 2];
    var a03 = a[0 * 4 + 3];
    var a10 = a[1 * 4 + 0];
    var a11 = a[1 * 4 + 1];
    var a12 = a[1 * 4 + 2];
    var a13 = a[1 * 4 + 3];
    var a20 = a[2 * 4 + 0];
    var a21 = a[2 * 4 + 1];
    var a22 = a[2 * 4 + 2];
    var a23 = a[2 * 4 + 3];
    var a30 = a[3 * 4 + 0];
    var a31 = a[3 * 4 + 1];
    var a32 = a[3 * 4 + 2];
    var a33 = a[3 * 4 + 3];
    dst[ 0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
    dst[ 1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
    dst[ 2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
    dst[ 3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
    dst[ 4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
    dst[ 5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
    dst[ 6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
    dst[ 7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
    dst[ 8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
    dst[ 9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
    dst[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
    dst[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
    dst[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
    dst[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
    dst[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
    dst[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
    return dst;
  }


  /**
   * adds 2 vectors3s
   * @param {Vector3} a a
   * @param {Vector3} b b
   * @param {Vector3} [dst] optional vector3 to store result
   * @return {Vector3} dst or new Vector3 if not provided
   * @memberOf module:webgl-3d-math
   */
  function addVectors(a, b, dst) {
    dst = dst || new MatType(3);
    dst[0] = a[0] + b[0];
    dst[1] = a[1] + b[1];
    dst[2] = a[2] + b[2];
    return dst;
  }

  /**
   * subtracts 2 vectors3s
   * @param {Vector3} a a
   * @param {Vector3} b b
   * @param {Vector3} [dst] optional vector3 to store result
   * @return {Vector3} dst or new Vector3 if not provided
   * @memberOf module:webgl-3d-math
   */
  function subtractVectors(a, b, dst) {
    dst = dst || new MatType(3);
    dst[0] = a[0] - b[0];
    dst[1] = a[1] - b[1];
    dst[2] = a[2] - b[2];
    return dst;
  }

  /**
   * scale vectors3
   * @param {Vector3} v vector
   * @param {Number} s scale
   * @param {Vector3} [dst] optional vector3 to store result
   * @return {Vector3} dst or new Vector3 if not provided
   * @memberOf module:webgl-3d-math
   */
  function scaleVector(v, s, dst) {
    dst = dst || new MatType(3);
    dst[0] = v[0] * s;
    dst[1] = v[1] * s;
    dst[2] = v[2] * s;
    return dst;
  }

  /**
   * normalizes a vector.
   * @param {Vector3} v vector to normalize
   * @param {Vector3} [dst] optional vector3 to store result
   * @return {Vector3} dst or new Vector3 if not provided
   * @memberOf module:webgl-3d-math
   */
  function normalize(v, dst) {
    dst = dst || new MatType(3);
    var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    // make sure we don't divide by 0.
    if (length > 0.00001) {
      dst[0] = v[0] / length;
      dst[1] = v[1] / length;
      dst[2] = v[2] / length;
    }
    return dst;
  }

  /**
   * Computes the length of a vector
   * @param {Vector3} v vector to take length of
   * @return {number} length of vector
   */
  function length(v) {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  }

  /**
   * Computes the length squared of a vector
   * @param {Vector3} v vector to take length of
   * @return {number} length sqaured of vector
   */
  function lengthSq(v) {
    return v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
  }

  /**
   * Computes the cross product of 2 vectors3s
   * @param {Vector3} a a
   * @param {Vector3} b b
   * @param {Vector3} [dst] optional vector3 to store result
   * @return {Vector3} dst or new Vector3 if not provided
   * @memberOf module:webgl-3d-math
   */
  function cross(a, b, dst) {
    dst = dst || new MatType(3);
    dst[0] = a[1] * b[2] - a[2] * b[1];
    dst[1] = a[2] * b[0] - a[0] * b[2];
    dst[2] = a[0] * b[1] - a[1] * b[0];
    return dst;
  }

  /**
   * Computes the dot product of two vectors; assumes both vectors have
   * three entries.
   * @param {Vector3} a Operand vector.
   * @param {Vector3} b Operand vector.
   * @return {number} dot product
   * @memberOf module:webgl-3d-math
   */
  function dot(a, b) {
    return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);
  }

  /**
   * Computes the distance squared between 2 points
   * @param {Vector3} a
   * @param {Vector3} b
   * @return {number} distance squared between a and b
   */
  function distanceSq(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    return dx * dx + dy * dy + dz * dz;
  }

  /**
   * Computes the distance between 2 points
   * @param {Vector3} a
   * @param {Vector3} b
   * @return {number} distance between a and b
   */
  function distance(a, b) {
    return Math.sqrt(distanceSq(a, b));
  }

  /**
   * Makes an identity matrix.
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   * @memberOf module:webgl-3d-math
   */
  function identity(dst) {
    dst = dst || new MatType(16);

    dst[ 0] = 1;
    dst[ 1] = 0;
    dst[ 2] = 0;
    dst[ 3] = 0;
    dst[ 4] = 0;
    dst[ 5] = 1;
    dst[ 6] = 0;
    dst[ 7] = 0;
    dst[ 8] = 0;
    dst[ 9] = 0;
    dst[10] = 1;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;

    return dst;
  }

  /**
   * Transposes a matrix.
   * @param {Matrix4} m matrix to transpose.
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   * @memberOf module:webgl-3d-math
   */
  function transpose(m, dst) {
    dst = dst || new MatType(16);

    dst[ 0] = m[0];
    dst[ 1] = m[4];
    dst[ 2] = m[8];
    dst[ 3] = m[12];
    dst[ 4] = m[1];
    dst[ 5] = m[5];
    dst[ 6] = m[9];
    dst[ 7] = m[13];
    dst[ 8] = m[2];
    dst[ 9] = m[6];
    dst[10] = m[10];
    dst[11] = m[14];
    dst[12] = m[3];
    dst[13] = m[7];
    dst[14] = m[11];
    dst[15] = m[15];

    return dst;
  }

  /**
   * Creates a lookAt matrix.
   * This is a world matrix for a camera. In other words it will transform
   * from the origin to a place and orientation in the world. For a view
   * matrix take the inverse of this.
   * @param {Vector3} cameraPosition position of the camera
   * @param {Vector3} target position of the target
   * @param {Vector3} up direction
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   * @memberOf module:webgl-3d-math
   */
  function lookAt(cameraPosition, target, up, dst) {
    dst = dst || new MatType(16);
    var zAxis = normalize(subtractVectors(cameraPosition, target));
    var xAxis = normalize(cross(up, zAxis));
    var yAxis = normalize(cross(zAxis, xAxis));

    dst[ 0] = xAxis[0];
    dst[ 1] = xAxis[1];
    dst[ 2] = xAxis[2];
    dst[ 3] = 0;
    dst[ 4] = yAxis[0];
    dst[ 5] = yAxis[1];
    dst[ 6] = yAxis[2];
    dst[ 7] = 0;
    dst[ 8] = zAxis[0];
    dst[ 9] = zAxis[1];
    dst[10] = zAxis[2];
    dst[11] = 0;
    dst[12] = cameraPosition[0];
    dst[13] = cameraPosition[1];
    dst[14] = cameraPosition[2];
    dst[15] = 1;

    return dst;
  }

  /**
   * Computes a 4-by-4 perspective transformation matrix given the angular height
   * of the frustum, the aspect ratio, and the near and far clipping planes.  The
   * arguments define a frustum extending in the negative z direction.  The given
   * angle is the vertical angle of the frustum, and the horizontal angle is
   * determined to produce the given aspect ratio.  The arguments near and far are
   * the distances to the near and far clipping planes.  Note that near and far
   * are not z coordinates, but rather they are distances along the negative
   * z-axis.  The matrix generated sends the viewing frustum to the unit box.
   * We assume a unit box extending from -1 to 1 in the x and y dimensions and
   * from -1 to 1 in the z dimension.
   * @param {number} fieldOfViewInRadians field of view in y axis.
   * @param {number} aspect aspect of viewport (width / height)
   * @param {number} near near Z clipping plane
   * @param {number} far far Z clipping plane
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   * @memberOf module:webgl-3d-math
   */
  function perspective(fieldOfViewInRadians, aspect, near, far, dst) {
    dst = dst || new MatType(16);
    var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    var rangeInv = 1.0 / (near - far);

    dst[ 0] = f / aspect;
    dst[ 1] = 0;
    dst[ 2] = 0;
    dst[ 3] = 0;
    dst[ 4] = 0;
    dst[ 5] = f;
    dst[ 6] = 0;
    dst[ 7] = 0;
    dst[ 8] = 0;
    dst[ 9] = 0;
    dst[10] = (near + far) * rangeInv;
    dst[11] = -1;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = near * far * rangeInv * 2;
    dst[15] = 0;

    return dst;
  }

  /**
   * Computes a 4-by-4 orthographic projection matrix given the coordinates of the
   * planes defining the axis-aligned, box-shaped viewing volume.  The matrix
   * generated sends that box to the unit box.  Note that although left and right
   * are x coordinates and bottom and top are y coordinates, near and far
   * are not z coordinates, but rather they are distances along the negative
   * z-axis.  We assume a unit box extending from -1 to 1 in the x and y
   * dimensions and from -1 to 1 in the z dimension.
   * @param {number} left The x coordinate of the left plane of the box.
   * @param {number} right The x coordinate of the right plane of the box.
   * @param {number} bottom The y coordinate of the bottom plane of the box.
   * @param {number} top The y coordinate of the right plane of the box.
   * @param {number} near The negative z coordinate of the near plane of the box.
   * @param {number} far The negative z coordinate of the far plane of the box.
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   * @memberOf module:webgl-3d-math
   */
  function orthographic(left, right, bottom, top, near, far, dst) {
    dst = dst || new MatType(16);

    dst[ 0] = 2 / (right - left);
    dst[ 1] = 0;
    dst[ 2] = 0;
    dst[ 3] = 0;
    dst[ 4] = 0;
    dst[ 5] = 2 / (top - bottom);
    dst[ 6] = 0;
    dst[ 7] = 0;
    dst[ 8] = 0;
    dst[ 9] = 0;
    dst[10] = 2 / (near - far);
    dst[11] = 0;
    dst[12] = (left + right) / (left - right);
    dst[13] = (bottom + top) / (bottom - top);
    dst[14] = (near + far) / (near - far);
    dst[15] = 1;

    return dst;
  }

  /**
   * Computes a 4-by-4 perspective transformation matrix given the left, right,
   * top, bottom, near and far clipping planes. The arguments define a frustum
   * extending in the negative z direction. The arguments near and far are the
   * distances to the near and far clipping planes. Note that near and far are not
   * z coordinates, but rather they are distances along the negative z-axis. The
   * matrix generated sends the viewing frustum to the unit box. We assume a unit
   * box extending from -1 to 1 in the x and y dimensions and from -1 to 1 in the z
   * dimension.
   * @param {number} left The x coordinate of the left plane of the box.
   * @param {number} right The x coordinate of the right plane of the box.
   * @param {number} bottom The y coordinate of the bottom plane of the box.
   * @param {number} top The y coordinate of the right plane of the box.
   * @param {number} near The negative z coordinate of the near plane of the box.
   * @param {number} far The negative z coordinate of the far plane of the box.
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   * @memberOf module:webgl-3d-math
   */
  function frustum(left, right, bottom, top, near, far, dst) {
    dst = dst || new MatType(16);

    var dx = right - left;
    var dy = top - bottom;
    var dz = far - near;

    dst[ 0] = 2 * near / dx;
    dst[ 1] = 0;
    dst[ 2] = 0;
    dst[ 3] = 0;
    dst[ 4] = 0;
    dst[ 5] = 2 * near / dy;
    dst[ 6] = 0;
    dst[ 7] = 0;
    dst[ 8] = (left + right) / dx;
    dst[ 9] = (top + bottom) / dy;
    dst[10] = -(far + near) / dz;
    dst[11] = -1;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = -2 * near * far / dz;
    dst[15] = 0;

    return dst;
  }

  /**
   * Makes a translation matrix
   * @param {number} tx x translation.
   * @param {number} ty y translation.
   * @param {number} tz z translation.
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   * @memberOf module:webgl-3d-math
   */
  function translation(tx, ty, tz, dst) {
    dst = dst || new MatType(16);

    dst[ 0] = 1;
    dst[ 1] = 0;
    dst[ 2] = 0;
    dst[ 3] = 0;
    dst[ 4] = 0;
    dst[ 5] = 1;
    dst[ 6] = 0;
    dst[ 7] = 0;
    dst[ 8] = 0;
    dst[ 9] = 0;
    dst[10] = 1;
    dst[11] = 0;
    dst[12] = tx;
    dst[13] = ty;
    dst[14] = tz;
    dst[15] = 1;

    return dst;
  }

  /**
   * Multiply by translation matrix.
   * @param {Matrix4} m matrix to multiply
   * @param {number} tx x translation.
   * @param {number} ty y translation.
   * @param {number} tz z translation.
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   * @memberOf module:webgl-3d-math
   */
  function translate(m, tx, ty, tz, dst) {
    // This is the optimized version of
    // return multiply(m, translation(tx, ty, tz), dst);
    dst = dst || new MatType(16);

    var m00 = m[0];
    var m01 = m[1];
    var m02 = m[2];
    var m03 = m[3];
    var m10 = m[1 * 4 + 0];
    var m11 = m[1 * 4 + 1];
    var m12 = m[1 * 4 + 2];
    var m13 = m[1 * 4 + 3];
    var m20 = m[2 * 4 + 0];
    var m21 = m[2 * 4 + 1];
    var m22 = m[2 * 4 + 2];
    var m23 = m[2 * 4 + 3];
    var m30 = m[3 * 4 + 0];
    var m31 = m[3 * 4 + 1];
    var m32 = m[3 * 4 + 2];
    var m33 = m[3 * 4 + 3];

    if (m !== dst) {
      dst[ 0] = m00;
      dst[ 1] = m01;
      dst[ 2] = m02;
      dst[ 3] = m03;
      dst[ 4] = m10;
      dst[ 5] = m11;
      dst[ 6] = m12;
      dst[ 7] = m13;
      dst[ 8] = m20;
      dst[ 9] = m21;
      dst[10] = m22;
      dst[11] = m23;
    }

    dst[12] = m00 * tx + m10 * ty + m20 * tz + m30;
    dst[13] = m01 * tx + m11 * ty + m21 * tz + m31;
    dst[14] = m02 * tx + m12 * ty + m22 * tz + m32;
    dst[15] = m03 * tx + m13 * ty + m23 * tz + m33;

    return dst;
  }

  /**
   * Makes an x rotation matrix
   * @param {number} angleInRadians amount to rotate
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   * @memberOf module:webgl-3d-math
   */
  function xRotation(angleInRadians, dst) {
    dst = dst || new MatType(16);
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    dst[ 0] = 1;
    dst[ 1] = 0;
    dst[ 2] = 0;
    dst[ 3] = 0;
    dst[ 4] = 0;
    dst[ 5] = c;
    dst[ 6] = s;
    dst[ 7] = 0;
    dst[ 8] = 0;
    dst[ 9] = -s;
    dst[10] = c;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;

    return dst;
  }

  /**
   * Multiply by an x rotation matrix
   * @param {Matrix4} m matrix to multiply
   * @param {number} angleInRadians amount to rotate
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   * @memberOf module:webgl-3d-math
   */
  function xRotate(m, angleInRadians, dst) {
    // this is the optimized version of
    // return multiply(m, xRotation(angleInRadians), dst);
    dst = dst || new MatType(16);

    var m10 = m[4];
    var m11 = m[5];
    var m12 = m[6];
    var m13 = m[7];
    var m20 = m[8];
    var m21 = m[9];
    var m22 = m[10];
    var m23 = m[11];
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    dst[4]  = c * m10 + s * m20;
    dst[5]  = c * m11 + s * m21;
    dst[6]  = c * m12 + s * m22;
    dst[7]  = c * m13 + s * m23;
    dst[8]  = c * m20 - s * m10;
    dst[9]  = c * m21 - s * m11;
    dst[10] = c * m22 - s * m12;
    dst[11] = c * m23 - s * m13;

    if (m !== dst) {
      dst[ 0] = m[ 0];
      dst[ 1] = m[ 1];
      dst[ 2] = m[ 2];
      dst[ 3] = m[ 3];
      dst[12] = m[12];
      dst[13] = m[13];
      dst[14] = m[14];
      dst[15] = m[15];
    }

    return dst;
  }

  /**
   * Makes an y rotation matrix
   * @param {number} angleInRadians amount to rotate
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   * @memberOf module:webgl-3d-math
   */
  function yRotation(angleInRadians, dst) {
    dst = dst || new MatType(16);
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    dst[ 0] = c;
    dst[ 1] = 0;
    dst[ 2] = -s;
    dst[ 3] = 0;
    dst[ 4] = 0;
    dst[ 5] = 1;
    dst[ 6] = 0;
    dst[ 7] = 0;
    dst[ 8] = s;
    dst[ 9] = 0;
    dst[10] = c;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;

    return dst;
  }

  /**
   * Multiply by an y rotation matrix
   * @param {Matrix4} m matrix to multiply
   * @param {number} angleInRadians amount to rotate
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   * @memberOf module:webgl-3d-math
   */
  function yRotate(m, angleInRadians, dst) {
    // this is the optimized version of
    // return multiply(m, yRotation(angleInRadians), dst);
    dst = dst || new MatType(16);

    var m00 = m[0 * 4 + 0];
    var m01 = m[0 * 4 + 1];
    var m02 = m[0 * 4 + 2];
    var m03 = m[0 * 4 + 3];
    var m20 = m[2 * 4 + 0];
    var m21 = m[2 * 4 + 1];
    var m22 = m[2 * 4 + 2];
    var m23 = m[2 * 4 + 3];
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    dst[ 0] = c * m00 - s * m20;
    dst[ 1] = c * m01 - s * m21;
    dst[ 2] = c * m02 - s * m22;
    dst[ 3] = c * m03 - s * m23;
    dst[ 8] = c * m20 + s * m00;
    dst[ 9] = c * m21 + s * m01;
    dst[10] = c * m22 + s * m02;
    dst[11] = c * m23 + s * m03;

    if (m !== dst) {
      dst[ 4] = m[ 4];
      dst[ 5] = m[ 5];
      dst[ 6] = m[ 6];
      dst[ 7] = m[ 7];
      dst[12] = m[12];
      dst[13] = m[13];
      dst[14] = m[14];
      dst[15] = m[15];
    }

    return dst;
  }

  /**
   * Makes an z rotation matrix
   * @param {number} angleInRadians amount to rotate
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   * @memberOf module:webgl-3d-math
   */
  function zRotation(angleInRadians, dst) {
    dst = dst || new MatType(16);
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    dst[ 0] = c;
    dst[ 1] = s;
    dst[ 2] = 0;
    dst[ 3] = 0;
    dst[ 4] = -s;
    dst[ 5] = c;
    dst[ 6] = 0;
    dst[ 7] = 0;
    dst[ 8] = 0;
    dst[ 9] = 0;
    dst[10] = 1;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;

    return dst;
  }

  /**
   * Multiply by an z rotation matrix
   * @param {Matrix4} m matrix to multiply
   * @param {number} angleInRadians amount to rotate
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   * @memberOf module:webgl-3d-math
   */
  function zRotate(m, angleInRadians, dst) {
    // This is the optimized version of
    // return multiply(m, zRotation(angleInRadians), dst);
    dst = dst || new MatType(16);

    var m00 = m[0 * 4 + 0];
    var m01 = m[0 * 4 + 1];
    var m02 = m[0 * 4 + 2];
    var m03 = m[0 * 4 + 3];
    var m10 = m[1 * 4 + 0];
    var m11 = m[1 * 4 + 1];
    var m12 = m[1 * 4 + 2];
    var m13 = m[1 * 4 + 3];
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    dst[ 0] = c * m00 + s * m10;
    dst[ 1] = c * m01 + s * m11;
    dst[ 2] = c * m02 + s * m12;
    dst[ 3] = c * m03 + s * m13;
    dst[ 4] = c * m10 - s * m00;
    dst[ 5] = c * m11 - s * m01;
    dst[ 6] = c * m12 - s * m02;
    dst[ 7] = c * m13 - s * m03;

    if (m !== dst) {
      dst[ 8] = m[ 8];
      dst[ 9] = m[ 9];
      dst[10] = m[10];
      dst[11] = m[11];
      dst[12] = m[12];
      dst[13] = m[13];
      dst[14] = m[14];
      dst[15] = m[15];
    }

    return dst;
  }

  /**
   * Makes an rotation matrix around an arbitrary axis
   * @param {Vector3} axis axis to rotate around
   * @param {number} angleInRadians amount to rotate
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   * @memberOf module:webgl-3d-math
   */
  function axisRotation(axis, angleInRadians, dst) {
    dst = dst || new MatType(16);

    var x = axis[0];
    var y = axis[1];
    var z = axis[2];
    var n = Math.sqrt(x * x + y * y + z * z);
    x /= n;
    y /= n;
    z /= n;
    var xx = x * x;
    var yy = y * y;
    var zz = z * z;
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    var oneMinusCosine = 1 - c;

    dst[ 0] = xx + (1 - xx) * c;
    dst[ 1] = x * y * oneMinusCosine + z * s;
    dst[ 2] = x * z * oneMinusCosine - y * s;
    dst[ 3] = 0;
    dst[ 4] = x * y * oneMinusCosine - z * s;
    dst[ 5] = yy + (1 - yy) * c;
    dst[ 6] = y * z * oneMinusCosine + x * s;
    dst[ 7] = 0;
    dst[ 8] = x * z * oneMinusCosine + y * s;
    dst[ 9] = y * z * oneMinusCosine - x * s;
    dst[10] = zz + (1 - zz) * c;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;

    return dst;
  }

  /**
   * Multiply by an axis rotation matrix
   * @param {Matrix4} m matrix to multiply
   * @param {Vector3} axis axis to rotate around
   * @param {number} angleInRadians amount to rotate
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   * @memberOf module:webgl-3d-math
   */
  function axisRotate(m, axis, angleInRadians, dst) {
    // This is the optimized version of
    // return multiply(m, axisRotation(axis, angleInRadians), dst);
    dst = dst || new MatType(16);

    var x = axis[0];
    var y = axis[1];
    var z = axis[2];
    var n = Math.sqrt(x * x + y * y + z * z);
    x /= n;
    y /= n;
    z /= n;
    var xx = x * x;
    var yy = y * y;
    var zz = z * z;
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    var oneMinusCosine = 1 - c;

    var r00 = xx + (1 - xx) * c;
    var r01 = x * y * oneMinusCosine + z * s;
    var r02 = x * z * oneMinusCosine - y * s;
    var r10 = x * y * oneMinusCosine - z * s;
    var r11 = yy + (1 - yy) * c;
    var r12 = y * z * oneMinusCosine + x * s;
    var r20 = x * z * oneMinusCosine + y * s;
    var r21 = y * z * oneMinusCosine - x * s;
    var r22 = zz + (1 - zz) * c;

    var m00 = m[0];
    var m01 = m[1];
    var m02 = m[2];
    var m03 = m[3];
    var m10 = m[4];
    var m11 = m[5];
    var m12 = m[6];
    var m13 = m[7];
    var m20 = m[8];
    var m21 = m[9];
    var m22 = m[10];
    var m23 = m[11];

    dst[ 0] = r00 * m00 + r01 * m10 + r02 * m20;
    dst[ 1] = r00 * m01 + r01 * m11 + r02 * m21;
    dst[ 2] = r00 * m02 + r01 * m12 + r02 * m22;
    dst[ 3] = r00 * m03 + r01 * m13 + r02 * m23;
    dst[ 4] = r10 * m00 + r11 * m10 + r12 * m20;
    dst[ 5] = r10 * m01 + r11 * m11 + r12 * m21;
    dst[ 6] = r10 * m02 + r11 * m12 + r12 * m22;
    dst[ 7] = r10 * m03 + r11 * m13 + r12 * m23;
    dst[ 8] = r20 * m00 + r21 * m10 + r22 * m20;
    dst[ 9] = r20 * m01 + r21 * m11 + r22 * m21;
    dst[10] = r20 * m02 + r21 * m12 + r22 * m22;
    dst[11] = r20 * m03 + r21 * m13 + r22 * m23;

    if (m !== dst) {
      dst[12] = m[12];
      dst[13] = m[13];
      dst[14] = m[14];
      dst[15] = m[15];
    }

    return dst;
  }

  /**
   * Makes a scale matrix
   * @param {number} sx x scale.
   * @param {number} sy y scale.
   * @param {number} sz z scale.
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   * @memberOf module:webgl-3d-math
   */
  function scaling(sx, sy, sz, dst) {
    dst = dst || new MatType(16);

    dst[ 0] = sx;
    dst[ 1] = 0;
    dst[ 2] = 0;
    dst[ 3] = 0;
    dst[ 4] = 0;
    dst[ 5] = sy;
    dst[ 6] = 0;
    dst[ 7] = 0;
    dst[ 8] = 0;
    dst[ 9] = 0;
    dst[10] = sz;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;

    return dst;
  }

  /**
   * Multiply by a scaling matrix
   * @param {Matrix4} m matrix to multiply
   * @param {number} sx x scale.
   * @param {number} sy y scale.
   * @param {number} sz z scale.
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   * @memberOf module:webgl-3d-math
   */
  function scale(m, sx, sy, sz, dst) {
    // This is the optimized version of
    // return multiply(m, scaling(sx, sy, sz), dst);
    dst = dst || new MatType(16);

    dst[ 0] = sx * m[0 * 4 + 0];
    dst[ 1] = sx * m[0 * 4 + 1];
    dst[ 2] = sx * m[0 * 4 + 2];
    dst[ 3] = sx * m[0 * 4 + 3];
    dst[ 4] = sy * m[1 * 4 + 0];
    dst[ 5] = sy * m[1 * 4 + 1];
    dst[ 6] = sy * m[1 * 4 + 2];
    dst[ 7] = sy * m[1 * 4 + 3];
    dst[ 8] = sz * m[2 * 4 + 0];
    dst[ 9] = sz * m[2 * 4 + 1];
    dst[10] = sz * m[2 * 4 + 2];
    dst[11] = sz * m[2 * 4 + 3];

    if (m !== dst) {
      dst[12] = m[12];
      dst[13] = m[13];
      dst[14] = m[14];
      dst[15] = m[15];
    }

    return dst;
  }

  /**
   * creates a matrix from translation, quaternion, scale
   * @param {Number[]} translation [x, y, z] translation
   * @param {Number[]} quaternion [x, y, z, z] quaternion rotation
   * @param {Number[]} scale [x, y, z] scale
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   */
  function compose(translation, quaternion, scale, dst) {
    dst = dst || new MatType(16);

    const x = quaternion[0];
    const y = quaternion[1];
    const z = quaternion[2];
    const w = quaternion[3];

    const x2 = x + x;
    const y2 = y + y;
    const z2 = z + z;

    const xx = x * x2;
    const xy = x * y2;
    const xz = x * z2;

    const yy = y * y2;
    const yz = y * z2;
    const zz = z * z2;

    const wx = w * x2;
    const wy = w * y2;
    const wz = w * z2;

    const sx = scale[0];
    const sy = scale[1];
    const sz = scale[2];

    dst[0] = (1 - (yy + zz)) * sx;
    dst[1] = (xy + wz) * sx;
    dst[2] = (xz - wy) * sx;
    dst[3] = 0;

    dst[4] = (xy - wz) * sy;
    dst[5] = (1 - (xx + zz)) * sy;
    dst[6] = (yz + wx) * sy;
    dst[7] = 0;

    dst[ 8] = (xz + wy) * sz;
    dst[ 9] = (yz - wx) * sz;
    dst[10] = (1 - (xx + yy)) * sz;
    dst[11] = 0;

    dst[12] = translation[0];
    dst[13] = translation[1];
    dst[14] = translation[2];
    dst[15] = 1;

    return dst;
  }

  function quatFromRotationMatrix(m, dst) {
    // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm

    // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)
    const m11 = m[0];
    const m12 = m[4];
    const m13 = m[8];
    const m21 = m[1];
    const m22 = m[5];
    const m23 = m[9];
    const m31 = m[2];
    const m32 = m[6];
    const m33 = m[10];

    const trace = m11 + m22 + m33;

    if (trace > 0) {
      const s = 0.5 / Math.sqrt(trace + 1);
      dst[3] = 0.25 / s;
      dst[0] = (m32 - m23) * s;
      dst[1] = (m13 - m31) * s;
      dst[2] = (m21 - m12) * s;
    } else if (m11 > m22 && m11 > m33) {
      const s = 2 * Math.sqrt(1 + m11 - m22 - m33);
      dst[3] = (m32 - m23) / s;
      dst[0] = 0.25 * s;
      dst[1] = (m12 + m21) / s;
      dst[2] = (m13 + m31) / s;
    } else if (m22 > m33) {
      const s = 2 * Math.sqrt(1 + m22 - m11 - m33);
      dst[3] = (m13 - m31) / s;
      dst[0] = (m12 + m21) / s;
      dst[1] = 0.25 * s;
      dst[2] = (m23 + m32) / s;
    } else {
      const s = 2 * Math.sqrt(1 + m33 - m11 - m22);
      dst[3] = (m21 - m12) / s;
      dst[0] = (m13 + m31) / s;
      dst[1] = (m23 + m32) / s;
      dst[2] = 0.25 * s;
    }
  }

  function decompose(mat, translation, quaternion, scale) {
    let sx = length(mat.slice(0, 3));
    const sy = length(mat.slice(4, 7));
    const sz = length(mat.slice(8, 11));

    // if determinate is negative, we need to invert one scale
    const det = determinate(mat);
    if (det < 0) {
      sx = -sx;
    }

    translation[0] = mat[12];
    translation[1] = mat[13];
    translation[2] = mat[14];

    // scale the rotation part
    const matrix = copy(mat);

    const invSX = 1 / sx;
    const invSY = 1 / sy;
    const invSZ = 1 / sz;

    matrix[0] *= invSX;
    matrix[1] *= invSX;
    matrix[2] *= invSX;

    matrix[4] *= invSY;
    matrix[5] *= invSY;
    matrix[6] *= invSY;

    matrix[8] *= invSZ;
    matrix[9] *= invSZ;
    matrix[10] *= invSZ;

    quatFromRotationMatrix(matrix, quaternion);

    scale[0] = sx;
    scale[1] = sy;
    scale[2] = sz;
  }

  function determinate(m) {
    var m00 = m[0 * 4 + 0];
    var m01 = m[0 * 4 + 1];
    var m02 = m[0 * 4 + 2];
    var m03 = m[0 * 4 + 3];
    var m10 = m[1 * 4 + 0];
    var m11 = m[1 * 4 + 1];
    var m12 = m[1 * 4 + 2];
    var m13 = m[1 * 4 + 3];
    var m20 = m[2 * 4 + 0];
    var m21 = m[2 * 4 + 1];
    var m22 = m[2 * 4 + 2];
    var m23 = m[2 * 4 + 3];
    var m30 = m[3 * 4 + 0];
    var m31 = m[3 * 4 + 1];
    var m32 = m[3 * 4 + 2];
    var m33 = m[3 * 4 + 3];
    var tmp_0  = m22 * m33;
    var tmp_1  = m32 * m23;
    var tmp_2  = m12 * m33;
    var tmp_3  = m32 * m13;
    var tmp_4  = m12 * m23;
    var tmp_5  = m22 * m13;
    var tmp_6  = m02 * m33;
    var tmp_7  = m32 * m03;
    var tmp_8  = m02 * m23;
    var tmp_9  = m22 * m03;
    var tmp_10 = m02 * m13;
    var tmp_11 = m12 * m03;

    var t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
        (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
    var t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
        (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
    var t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
        (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
    var t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
        (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

    return 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
  }

  /**
   * Computes the inverse of a matrix.
   * @param {Matrix4} m matrix to compute inverse of
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   * @memberOf module:webgl-3d-math
   */
  function inverse(m, dst) {
    dst = dst || new MatType(16);
    var m00 = m[0 * 4 + 0];
    var m01 = m[0 * 4 + 1];
    var m02 = m[0 * 4 + 2];
    var m03 = m[0 * 4 + 3];
    var m10 = m[1 * 4 + 0];
    var m11 = m[1 * 4 + 1];
    var m12 = m[1 * 4 + 2];
    var m13 = m[1 * 4 + 3];
    var m20 = m[2 * 4 + 0];
    var m21 = m[2 * 4 + 1];
    var m22 = m[2 * 4 + 2];
    var m23 = m[2 * 4 + 3];
    var m30 = m[3 * 4 + 0];
    var m31 = m[3 * 4 + 1];
    var m32 = m[3 * 4 + 2];
    var m33 = m[3 * 4 + 3];
    var tmp_0  = m22 * m33;
    var tmp_1  = m32 * m23;
    var tmp_2  = m12 * m33;
    var tmp_3  = m32 * m13;
    var tmp_4  = m12 * m23;
    var tmp_5  = m22 * m13;
    var tmp_6  = m02 * m33;
    var tmp_7  = m32 * m03;
    var tmp_8  = m02 * m23;
    var tmp_9  = m22 * m03;
    var tmp_10 = m02 * m13;
    var tmp_11 = m12 * m03;
    var tmp_12 = m20 * m31;
    var tmp_13 = m30 * m21;
    var tmp_14 = m10 * m31;
    var tmp_15 = m30 * m11;
    var tmp_16 = m10 * m21;
    var tmp_17 = m20 * m11;
    var tmp_18 = m00 * m31;
    var tmp_19 = m30 * m01;
    var tmp_20 = m00 * m21;
    var tmp_21 = m20 * m01;
    var tmp_22 = m00 * m11;
    var tmp_23 = m10 * m01;

    var t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
        (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
    var t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
        (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
    var t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
        (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
    var t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
        (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

    var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

    dst[0] = d * t0;
    dst[1] = d * t1;
    dst[2] = d * t2;
    dst[3] = d * t3;
    dst[4] = d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
          (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
    dst[5] = d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
          (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
    dst[6] = d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
          (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
    dst[7] = d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
          (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));
    dst[8] = d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
          (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
    dst[9] = d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
          (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
    dst[10] = d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
          (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
    dst[11] = d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
          (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));
    dst[12] = d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
          (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
    dst[13] = d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
          (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
    dst[14] = d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
          (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
    dst[15] = d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
          (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02));

    return dst;
  }

  /**
   * Takes a  matrix and a vector with 4 entries, transforms that vector by
   * the matrix, and returns the result as a vector with 4 entries.
   * @param {Matrix4} m The matrix.
   * @param {Vector4} v The point in homogenous coordinates.
   * @param {Vector4} dst optional vector4 to store result
   * @return {Vector4} dst or new Vector4 if not provided
   * @memberOf module:webgl-3d-math
   */
  function transformVector(m, v, dst) {
    dst = dst || new MatType(4);
    for (var i = 0; i < 4; ++i) {
      dst[i] = 0.0;
      for (var j = 0; j < 4; ++j) {
        dst[i] += v[j] * m[j * 4 + i];
      }
    }
    return dst;
  }

  /**
   * Takes a 4-by-4 matrix and a vector with 3 entries,
   * interprets the vector as a point, transforms that point by the matrix, and
   * returns the result as a vector with 3 entries.
   * @param {Matrix4} m The matrix.
   * @param {Vector3} v The point.
   * @param {Vector4} dst optional vector4 to store result
   * @return {Vector4} dst or new Vector4 if not provided
   * @memberOf module:webgl-3d-math
   */
  function transformPoint(m, v, dst) {
    dst = dst || new MatType(3);
    var v0 = v[0];
    var v1 = v[1];
    var v2 = v[2];
    var d = v0 * m[0 * 4 + 3] + v1 * m[1 * 4 + 3] + v2 * m[2 * 4 + 3] + m[3 * 4 + 3];

    dst[0] = (v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0] + m[3 * 4 + 0]) / d;
    dst[1] = (v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1] + m[3 * 4 + 1]) / d;
    dst[2] = (v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2] + m[3 * 4 + 2]) / d;

    return dst;
  }

  /**
   * Takes a 4-by-4 matrix and a vector with 3 entries, interprets the vector as a
   * direction, transforms that direction by the matrix, and returns the result;
   * assumes the transformation of 3-dimensional space represented by the matrix
   * is parallel-preserving, i.e. any combination of rotation, scaling and
   * translation, but not a perspective distortion. Returns a vector with 3
   * entries.
   * @param {Matrix4} m The matrix.
   * @param {Vector3} v The direction.
   * @param {Vector4} dst optional vector4 to store result
   * @return {Vector4} dst or new Vector4 if not provided
   * @memberOf module:webgl-3d-math
   */
  function transformDirection(m, v, dst) {
    dst = dst || new MatType(3);

    var v0 = v[0];
    var v1 = v[1];
    var v2 = v[2];

    dst[0] = v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0];
    dst[1] = v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1];
    dst[2] = v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2];

    return dst;
  }

  /**
   * Takes a 4-by-4 matrix m and a vector v with 3 entries, interprets the vector
   * as a normal to a surface, and computes a vector which is normal upon
   * transforming that surface by the matrix. The effect of this function is the
   * same as transforming v (as a direction) by the inverse-transpose of m.  This
   * function assumes the transformation of 3-dimensional space represented by the
   * matrix is parallel-preserving, i.e. any combination of rotation, scaling and
   * translation, but not a perspective distortion.  Returns a vector with 3
   * entries.
   * @param {Matrix4} m The matrix.
   * @param {Vector3} v The normal.
   * @param {Vector3} [dst] The direction.
   * @return {Vector3} The transformed direction.
   * @memberOf module:webgl-3d-math
   */
  function transformNormal(m, v, dst) {
    dst = dst || new MatType(3);
    var mi = inverse(m);
    var v0 = v[0];
    var v1 = v[1];
    var v2 = v[2];

    dst[0] = v0 * mi[0 * 4 + 0] + v1 * mi[0 * 4 + 1] + v2 * mi[0 * 4 + 2];
    dst[1] = v0 * mi[1 * 4 + 0] + v1 * mi[1 * 4 + 1] + v2 * mi[1 * 4 + 2];
    dst[2] = v0 * mi[2 * 4 + 0] + v1 * mi[2 * 4 + 1] + v2 * mi[2 * 4 + 2];

    return dst;
  }

  function copy(src, dst) {
    dst = dst || new MatType(16);

    dst[ 0] = src[ 0];
    dst[ 1] = src[ 1];
    dst[ 2] = src[ 2];
    dst[ 3] = src[ 3];
    dst[ 4] = src[ 4];
    dst[ 5] = src[ 5];
    dst[ 6] = src[ 6];
    dst[ 7] = src[ 7];
    dst[ 8] = src[ 8];
    dst[ 9] = src[ 9];
    dst[10] = src[10];
    dst[11] = src[11];
    dst[12] = src[12];
    dst[13] = src[13];
    dst[14] = src[14];
    dst[15] = src[15];

    return dst;
  }

  return {
    copy: copy,
    lookAt: lookAt,
    addVectors: addVectors,
    subtractVectors: subtractVectors,
    scaleVector: scaleVector,
    distance: distance,
    distanceSq: distanceSq,
    normalize: normalize,
    compose: compose,
    cross: cross,
    decompose: decompose,
    dot: dot,
    identity: identity,
    transpose: transpose,
    length: length,
    lengthSq: lengthSq,
    orthographic: orthographic,
    frustum: frustum,
    perspective: perspective,
    translation: translation,
    translate: translate,
    xRotation: xRotation,
    yRotation: yRotation,
    zRotation: zRotation,
    xRotate: xRotate,
    yRotate: yRotate,
    zRotate: zRotate,
    axisRotation: axisRotation,
    axisRotate: axisRotate,
    scaling: scaling,
    scale: scale,
    multiply: multiply,
    inverse: inverse,
    transformVector: transformVector,
    transformPoint: transformPoint,
    transformDirection: transformDirection,
    transformNormal: transformNormal,
    setDefaultType: setDefaultType,
  };
}());

const textures = {};

var vertexShaderCode = [
  'attribute vec4 a_position;',
  'attribute vec2 a_texcoord;',
  'attribute vec4 aVertexColor;',
  '',
  'uniform mat4 u_matrix;',
  '',
  'varying vec2 v_texcoord;',
  'varying vec4 vColor;',
  '',
  'void main() {',
  'gl_Position = u_matrix * a_position;',
  'v_texcoord = a_texcoord;',
  'vColor = aVertexColor;',
  '}'
].join('\n');

var fragmentShaderCode = [
  'precision mediump float;',
  '',
  'varying vec2 v_texcoord;',
  'varying vec4 vColor;',
  '',
  'uniform sampler2D u_texture;',
  '',
  'void main() {',
  'gl_FragColor = texture2D(u_texture, v_texcoord) * vColor;',
  '}',
].join('\n');

var quadPositions = [
  0, 0,
  0, 1,
  1, 0,
  1, 0,
  0, 1,
  1, 1,
];

var quadCoords = [
  0, 0,
  0, 1,
  1, 0,
  1, 0,
  0, 1,
  1, 1,
];

var quadColors = [
  1.0,  1.0,  1.0,  1.0,
  1.0,  1.0,  1.0,  1.0,
  1.0,  1.0,  1.0,  1.0,
  1.0,  1.0,  1.0,  1.0,
  1.0,  1.0,  1.0,  1.0,
  1.0,  1.0,  1.0,  1.0
];

var triangleColors = [
  1.0,  1.0,  1.0,  1.0,
  1.0,  1.0,  1.0,  1.0,
  1.0,  1.0,  1.0,  1.0
];
var quadPositionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quadPositionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadPositions), gl.STATIC_DRAW);

var quadTexCoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quadTexCoordBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadCoords), gl.STATIC_DRAW);

var quadColorBuffer = gl.createBuffer();

var triPosBuffer = gl.createBuffer();
var triUVBuffer = gl.createBuffer();
var tricolorBuffer = gl.createBuffer();

/**
 * @param {string} code
 * @param {number} type
 * @returns {WebGLShader}
 */
const compileShader = (code, type) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, code);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    throw new Error('Error compiling shader');
  }
  return shader;
};

/**
 * @param {WebGLShader} vertexShader
 * @param {WebGLShader} fragmentShader
 * @returns {WebGLProgram}
 */
const createProgram = (vertexShader, fragmentShader) => {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    throw new Error('Error linking program');
  }
  gl.validateProgram(program);
  if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    throw new Error('Error validating program');
  }
  return program;
};

const vertexShader = compileShader(vertexShaderCode, gl.VERTEX_SHADER);
const fragmentShader = compileShader(fragmentShaderCode, gl.FRAGMENT_SHADER);
const program = createProgram(vertexShader, fragmentShader);

// look up where the vertex data needs to go.
const positionLocation = gl.getAttribLocation(program, 'a_position');
const texcoordLocation = gl.getAttribLocation(program, 'a_texcoord');
const colorLocation = gl.getAttribLocation(program, 'aVertexColor');

// lookup uniforms
const matrixLocation = gl.getUniformLocation(program, 'u_matrix');
const textureLocation = gl.getUniformLocation(program, 'u_texture');

//cool drawing functions

/**
 * @param {number} deg
 * @returns {number}
 */
function degreesToRadians(deg) {
  return deg * 0.0174533;
}

function loadImageAndCreateTextureInfo(url, clamp) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Fill the texture with a 1x1 blue pixel.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

  // Let's assume all images are not a power of 2
  if (clamp) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

  const textureInfo = {
    // we don't know the size until it loads
    width: 1,
    height: 1,
    texture
  };

  const image = new Image();
  image.onload = function() {
    textureInfo.width = image.width;
    textureInfo.height = image.height;

    gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  };
  image.crossOrigin = 'anonymous';
  image.src = url;

  return textureInfo;
}

function drawImage(tex, texWidth, texHeight, dstX, dstY, stampRotation) {
  gl.bindTexture(gl.TEXTURE_2D, tex);

  // Tell WebGL to use our shader program pair
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, quadColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadColors), gl.STATIC_DRAW);
  // Setup the attributes to pull data from our buffers
  gl.bindBuffer(gl.ARRAY_BUFFER, quadPositionBuffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, quadTexCoordBuffer);
  gl.enableVertexAttribArray(texcoordLocation);
  gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, quadColorBuffer);
  gl.enableVertexAttribArray(colorLocation);
  gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);

  // this matrix will convert from pixels to clip space
  var matrix = m4.orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

  // this matrix will translate our quad to dstX, dstY
  matrix = m4.translate(matrix, dstX, dstY, 0);

  matrix = m4.zRotate(matrix,degreesToRadians(stampRotation))

  // this matrix will scale our 1 unit quad
  // from 1 unit to texWidth, texHeight units
  matrix = m4.scale(matrix, texWidth, texHeight, 1);

  // Set the matrix.
  gl.uniformMatrix4fv(matrixLocation, false, matrix);

  // Tell the shader to get the texture from texture unit 0
  gl.uniform1i(textureLocation, 0);

  // draw the quad (2 triangles, 6 vertices)
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function drawTexturedTri(tex, trianglePoints, triangleUvs) {
  gl.bindTexture(gl.TEXTURE_2D, tex);

  gl.bindBuffer(gl.ARRAY_BUFFER, triPosBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(trianglePoints), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, triUVBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleUvs), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, tricolorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleColors), gl.STATIC_DRAW);

  // Tell WebGL to use our shader program pair
  gl.useProgram(program);

  // Setup the attributes to pull data from our buffers
  gl.bindBuffer(gl.ARRAY_BUFFER, triPosBuffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, triUVBuffer);
  gl.enableVertexAttribArray(texcoordLocation); //
  gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, tricolorBuffer);
  gl.enableVertexAttribArray(colorLocation); //
  gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);

  // this matrix will convert from pixels to clip space
  var matrix = m4.orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

  // this matrix will translate our quad to dstX, dstY

  // this matrix will scale our 1 unit quad
  // from 1 unit to texWidth, texHeight units

  // Set the matrix.
  gl.uniformMatrix4fv(matrixLocation, false, matrix);

  // Tell the shader to get the texture from texture unit 0
  gl.uniform1i(textureLocation, 0);

  // draw the quad (2 triangles, 6 vertices)
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function hexToRgb(hex) {
  return {
    r: Math.floor(hex/65536),
    g: Math.floor(hex/256)%256,
    b: hex%256
  };
}

function getspritecostume(util, c) {
  let target = util.target;
  let dataURI = target.sprite.costumes[c - 1].asset.encodeDataURI();
  return dataURI;
}

async function coolcash(uri, clamp){
  if (!textures.hasOwnProperty(uri)) {
    textures[uri] = await loadImageAndCreateTextureInfo(uri, clamp)
  }
}
//

/**
 * Host for the Pen-related blocks in Scratch 3.0
 * @param {Runtime} runtime - the runtime instantiating this block package.
 * @constructor
 */

 
  // Simplified remake of an icon by True-Fantom
  const icon = 'data:image/svg+xml,' + encodeURIComponent(`
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0,0,360,360">
      <circle cx="180" cy="180" r="180" fill="#9966FF"/>
      <path d="M180,350
       c-25,-85  -77,-137 -162,-162
       c 85,-25  137, -77  162,-162
       c 25, 85   77, 137  162, 162
       c-85, 25 -137,  77 -162, 162z" stroke-width="0" fill="#ffffff"/>
    </svg>`);


  let toCorrectThing = null;
  let active = false;
  let flipY = false;
  const _drawThese = renderer._drawThese;
  // const gl = renderer._gl;
//   const canvas = renderer.canvas;
  let width2 = 0;
  let height2 = 0;
  let scratchUnitWidth = 480;
  let scratchUnitHeight = 360;


  renderer._drawThese = function (drawables, drawMode, projection, opts) {
    active = true;
    [scratchUnitWidth, scratchUnitHeight] = renderer.getNativeSize();
    _drawThese.call(this, drawables, drawMode, projection, opts);
    gl.disable(gl.SCISSOR_TEST);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    active = false;
  };

  const bfb = gl.bindFramebuffer;
  gl.bindFramebuffer = function (target, framebuffer) {
    if (target == gl.FRAMEBUFFER) {
      if (framebuffer == null) {
        toCorrectThing = true;
        flipY = false;
        width2 = canvas.width;
        height2 = canvas.height;
      } else if (renderer._penSkinId) {
        const fbInfo = renderer._allSkins[renderer._penSkinId]._framebuffer;
        if (framebuffer == fbInfo.framebuffer) {
          toCorrectThing = true;
          flipY = true;
          width2 = fbInfo.width;
          height2 = fbInfo.height;
        } else {
          toCorrectThing = false;
        }
      } else {
        toCorrectThing = false;
      }
    }
    bfb.call(this, target, framebuffer);
  };

  // Getting Drawable
  const dr = renderer.createDrawable('background');
  const DrawableProto = renderer._allDrawables[dr].__proto__;
  renderer.destroyDrawable(dr, 'background');

  // Modifying and expanding Drawable
  const gu = DrawableProto.getUniforms;
  DrawableProto.getUniforms = function () {
    if (active && toCorrectThing) {
      if (this.clipbox) {
        gl.enable(gl.SCISSOR_TEST);
        let x = (this.clipbox.x / scratchUnitWidth + 0.5) * width2;
        let y = (this.clipbox.y / scratchUnitHeight + 0.5) * height2;
        let w = (this.clipbox.w / scratchUnitWidth) * width2;
        let h = (this.clipbox.h / scratchUnitHeight) * height2;
        if (flipY) {
          y = (-(this.clipbox.y + this.clipbox.h) / scratchUnitHeight + 0.5) * height2;
        }
        gl.scissor(x, y, w, h);
      } else {
        gl.disable(gl.SCISSOR_TEST);
      }
      if (this.additiveBlend) {
        gl.blendFunc(gl.ONE, gl.ONE);
      } else {
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      }
    }
    return gu.call(this);
  };
  DrawableProto.updateClipBox = function (clipbox) {
    this.clipbox = clipbox;
  };
  DrawableProto.updateAdditiveBlend = function (enabled) {
    this.additiveBlend = enabled;
  };


  // Expanding renderer
  renderer.updateDrawableClipBox = function (drawableID, clipbox) {
    const drawable = this._allDrawables[drawableID];
    if (!drawable) return;
    drawable.updateClipBox(clipbox);
  };
  renderer.updateDrawableAdditiveBlend = function (drawableID, enabled) {
    const drawable = this._allDrawables[drawableID];
    if (!drawable) return;
    drawable.updateAdditiveBlend(enabled);
  };


  // Reset on stop & clones inherit effects
  const regTargetStuff = function (args) {
    if (args.editingTarget) {
      vm.removeListener('targetsUpdate', regTargetStuff);
      const proto = vm.runtime.targets[0].__proto__;
      const osa = proto.onStopAll;
      proto.onStopAll = function () {
        this.renderer.updateDrawableClipBox.call(renderer, this.drawableID, null);
        this.renderer.updateDrawableAdditiveBlend.call(renderer, this.drawableID, false);
        osa.call(this);
      };
      const mc = proto.makeClone;
      proto.makeClone = function () {
        const newTarget = mc.call(this);
        if (this.clipbox) {
          newTarget.clipbox = Object.assign({}, this.clipbox);
          newTarget.additiveBlend = this.additiveBlend;
          renderer.updateDrawableClipBox.call(renderer, newTarget.drawableID, this.clipbox);
          renderer.updateDrawableAdditiveBlend.call(renderer, newTarget.drawableID, this.additiveBlend);
        }
        return newTarget;
      };
    }
  };
  vm.on('targetsUpdate', regTargetStuff);


  let cameraX = 0;
  let cameraY = 0;
  let cameraZoom = 100;
  let cameraBG = '#ffffff';

  vm.runtime.runtimeOptions.fencing = false;
  vm.renderer.offscreenTouching = true;

  function updateCamera() {
    vm.renderer.setStageSize(
      vm.runtime.stageWidth / -2 + cameraX,
      vm.runtime.stageWidth / 2 + cameraX,
      vm.runtime.stageHeight / -2 + cameraY,
      vm.runtime.stageHeight / 2 + cameraY
    );
    vm.renderer._projection[15] = 100 / cameraZoom;
  }

  // tell resize to update camera as well
  vm.runtime.on('STAGE_SIZE_CHANGED', _=>updateCamera());

  function doFix() {
    vm.runtime.emit('STAGE_SIZE_CHANGED', vm.runtime.stageWidth, vm.runtime.stageHeight);
  }

  // fix mouse positions
  let oldSX = vm.runtime.ioDevices.mouse.getScratchX;
  let oldSY = vm.runtime.ioDevices.mouse.getScratchY;

  vm.runtime.ioDevices.mouse.getScratchX = function(...a){
    return (oldSX.apply(this, a) + cameraX) / cameraZoom * 100;
  };
  vm.runtime.ioDevices.mouse.getScratchY = function(...a){
    return (oldSY.apply(this, a) + cameraY) / cameraZoom * 100;
  };

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
            id: 'other',
            name: '其他模块',
            // blockIconURI: blockIconURI,
            color1: '#E91E63',
            blocks: [
                "拉伸",
                {
                    opcode: 'setStretch',
                    blockType: BlockType.COMMAND,
                    text: '拉伸 x: [X] y: [Y]',
                    arguments: {
                        X: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 100,
                        },
                        Y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 100,
                        },
                    },
                },
                {
                    opcode: 'getX',
                    blockType: BlockType.REPORTER,
                    text: 'x 拉伸度',
                    disableMonitor: true,
                },
                {
                    opcode: 'getY',
                    blockType: BlockType.REPORTER,
                    text: 'y 拉伸度',
                    disableMonitor: true,
                },
                "指针锁定",
                {
                    opcode: 'setLocked',
                    blockType: BlockType.COMMAND,
                    text: '设置指针锁定 [enabled]',
                    arguments: {
                        enabled: {
                            type: ArgumentType.STRING,
                            defaultValue: 'true',
                            menu: 'enabled'
                        }
                    }
                },
                {
                    opcode: 'isLocked',
                    blockType: BlockType.BOOLEAN,
                    text: '指针锁定了吗?'
                },
                {
                    opcode: 'x',
                    blockType: BlockType.REPORTER,
                    text: '锁定时x总量'
                },
                {
                    opcode: 'y',
                    blockType: BlockType.REPORTER,
                    text: '锁定时y总量'
                },
                {
                    opcode: 'xy',
                    blockType: BlockType.COMMAND,
                    text: '清零锁定时xy'
                }, {
                    opcode: 'getEnabled',
                    text: ' [thing] 启用了吗?',
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        thing: {
                            type: ArgumentType.STRING,
                            defaultValue: TURBO_MODE,
                            menu: 'thing'
                        }
                    }
                },
                "运行时选项",
                {
                    opcode: 'setEnabled',
                    text: '设置 [thing] 为 [enabled]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        thing: {
                            type: ArgumentType.STRING,
                            defaultValue: TURBO_MODE,
                            menu: 'thing'
                        },
                        enabled: {
                            type: ArgumentType.STRING,
                            defaultValue: 'true',
                            menu: 'enabled'
                        }
                    }
                },

                '---',

                {
                    opcode: 'getFramerate',
                    text: '获取帧数',
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'setFramerate',
                    text: '设置帧数为 [fps]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        fps: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '30'
                        }
                    }
                },

                '---',

                {
                    opcode: 'getCloneLimit',
                    text: '获取克隆上限',
                    blockType: BlockType.REPORTER
                },
                {
                    opcode: 'setCloneLimit',
                    text: '设置克隆上限 [limit]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        limit: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '300',
                            menu: 'clones'
                        }
                    }
                },

                '---',

                {
                    opcode: 'getDimension',
                    text: '获取舞台 [dimension]',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        dimension: {
                            type: ArgumentType.STRING,
                            defaultValue: 'width',
                            menu: 'dimension'
                        }
                    }
                },
                {
                    opcode: 'setDimensions',
                    text: '设置舞台宽: [width] 高: [height]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        width: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '480'
                        },
                        height: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '360'
                        }
                    }
                }, 
                "光标设置",
                {
                    opcode: 'setCur',
                    blockType: BlockType.COMMAND,
                    text: '设置光标为 [cur]',
                    arguments: {
                        cur: {
                            type: ArgumentType.STRING,
                            defaultValue: 'pointer',
                            menu: 'cursors',
                        },
                    },
                },
                {
                    opcode: 'setCursorImage',
                    blockType: BlockType.COMMAND,
                    text: "将光标设置为当前造型中心： [position] 最大尺寸: [size]",
                    arguments: {
                        position: {
                            type: ArgumentType.STRING,
                            defaultValue: '0,0',
                            menu: 'imagePositions'
                        },
                        size: {
                            type: ArgumentType.STRING,
                            defaultValue: '32x32',
                            menu: 'imageSizes'
                        }
                    }
                },
                {
                    opcode: 'hideCur',
                    blockType: BlockType.COMMAND,
                    text: '隐藏光标',
                },
                {
                    opcode: 'getCur',
                    blockType: BlockType.REPORTER,
                    text: '光标',
                },
                "pen +",
                {
                    opcode: "coordBlock",
                    blockType: BlockType.REPORTER,
                    text: "[c1][c2][c3][c4][c5][c6]",
                    arguments: {
                      c1: {
                        type:  ArgumentType.NUMBER,
                        defaultValue: "0"
                      },
                      c2: {
                        type:  ArgumentType.NUMBER,
                        defaultValue: "0"
                      },
                      c3: {
                        type:  ArgumentType.NUMBER,
                        defaultValue: "0"
                      },
                      c4: {
                        type:  ArgumentType.NUMBER,
                        defaultValue: "0"
                      },
                      c5: {
                        type:  ArgumentType.NUMBER,
                        defaultValue: "0"
                      },
                      c6: {
                        type:  ArgumentType.NUMBER,
                        defaultValue: "0"
                      }
                    }
                  },
                  {
                    opcode: "precachetextures",
                    blockType: BlockType.COMMAND,
                    text: "从[uri]加载图像 clamp the texture? [clamp]",
                    arguments: {
                      uri: {
                        type:  ArgumentType.STRING,
                        defaultValue: EXAMPLE_IMAGE
                      },
                      clamp: {
                        type:  ArgumentType.STRING,
                        menu: 'TFmenu'
                      }
                    }
                  },
                  {
                    opcode: "settargetsw",
                    blockType: BlockType.COMMAND,
                    text: "更改屏幕大小 宽[width]高[height]",
                    arguments: {
                      width: {
                        type:  ArgumentType.NUMBER,
                        defaultValue: "480"
                      },
                      height: {
                        type:  ArgumentType.NUMBER,
                        defaultValue: "360"
                      }
                    }
                  },
                  {
                    opcode: "pendrawspritefromurl",
                    blockType: BlockType.COMMAND,
                    text: "从[url]图章图像 x:[x] y:[y]",
                    arguments: {
                      url: {
                        type:  ArgumentType.STRING,
                        defaultValue: EXAMPLE_IMAGE
                      },
                      x: {
                        type:  ArgumentType.NUMBER,
                        defaultValue: "240"
                      },
                      y: {
                        type:  ArgumentType.NUMBER,
                        defaultValue: "180"
                      }
                    }
                  },
                  {
                    opcode: "rotateStamp",
                    blockType: BlockType.COMMAND,
                    text: "设置图章旋转[ANGLE]",
                    arguments: {
                      ANGLE: {
                        type:  ArgumentType.ANGLE,
                        defaultValue: "90"
                      }
                    }
                  },
                  {
                    opcode: "getstamprotation",
                    blockType: BlockType.REPORTER,
                    text: "图章旋转角度",
                    arguments: {
                      ANGLE: {
                        type:  ArgumentType.ANGLE,
                        defaultValue: "90"
                      }
                    }
                  },
                  {
                    opcode: "setpenstrechandsquash",
                    blockType: BlockType.COMMAND,
                    text: "设置图章宽[width]高[height]",
                    arguments: {
                      width: {
                        type:  ArgumentType.NUMBER,
                        defaultValue: "64"
                      },
                      height: {
                        type:  ArgumentType.NUMBER,
                        defaultValue: "64"
                      }
                    }
                  },
                  {
                    opcode: "getstampwidth",
                    blockType: BlockType.REPORTER,
                    text: "图章宽度",
                    arguments: {
                    }
                  },
                  {
                    opcode: "getstampheight",
                    blockType: BlockType.REPORTER,
                    text: "图章高度",
                    arguments: {
                    }
                  },
                  {
                    opcode: "setstampcolor",
                    blockType: BlockType.COMMAND,
                    text: "图章颜色[color]透明度[T](0-255)",
                    arguments: {
                      color: {
                        type:  ArgumentType.COLOR,
                        defaultValue: '#ffffff'
                      },
                      T:{
                        type:  ArgumentType.NUMBER,
                        defaultValue: '0'
                      }
                    }
                  },
                  {
                    opcode: "getcostumedata",
                    blockType: BlockType.REPORTER,
                    text: "获取造型的uri数据[costu]",
                    arguments: {
                      costu: {
                        type:  ArgumentType.NUMBER,
                        defaultValue: "1"
                      },
                      spr: {
                        type:  ArgumentType.NUMBER,
                        defaultValue: "1"
                      }
                    }
                  },
                  {
                    opcode: "pendrawtexturedtrifromurl",
                    blockType: BlockType.COMMAND,
                    text: "绘制一个三角形的点(用逗号隔开)[trianglepoints]uvs[triangleuvs]来自的图像:[url]",
                    arguments: {
                      url: {
                        type:  ArgumentType.STRING,
                        defaultValue: EXAMPLE_IMAGE
                      },
                      trianglepoints: {
                        type:  ArgumentType.STRING,
                        defaultValue: "0,0,10,10,0,10"
                      },
                      triangleuvs: {
                        type:  ArgumentType.STRING,
                        defaultValue: "0,0,1,1,0,1"
                      }
                    }
                  },
                  {
                    opcode: "settripointcolour",
                    blockType: BlockType.COMMAND,
                    text: "色调点[pointmenu] [color] 透明度[T](0-255)",
                    arguments: {
                      pointmenu: {
                        type:  ArgumentType.STRING,
                        menu: 'pointmenu'
                      },
                      color: {
                        type:  ArgumentType.COLOR,
                        defaultValue: '#ffffff'
                      },
                      T:{
                        type:  ArgumentType.NUMBER,
                        defaultValue: '0'
                      }
                    }
                  },
                  {
                    opcode: "gettargetstagewidth",
                    blockType: BlockType.REPORTER,
                    text: "目标宽度",
                    arguments: {
                    }
                  },
                  {
                    opcode: "gettargetstageheight",
                    blockType: BlockType.REPORTER,
                    text: "目标高度",
                    arguments: {
                    }
                  },
                  {
                    opcode: "converttocanvascoords",
                    blockType: BlockType.REPORTER,
                    text: "转换[scrcoord]在[coordTypes]上[coordmenu]轴的坐标点",
                    arguments: {
                      coordmenu: {
                        type:  ArgumentType.STRING,
                        menu: 'coordMenu'
                      },
                      scrcoord: {
                        type:  ArgumentType.NUMBER,
                        defaultValue: '0'
                      },
                      coordTypes: {
                        type:  ArgumentType.STRING,
                        menu: 'coordTypes'
                      }
                    }
                  },
                  {
                    opcode: "rgbtoSColor",
                    blockType: BlockType.REPORTER,
                    text: "转换 R[R] G[G] B[B] 为十六进制",
                    arguments: {
                      R: {
                        type:  ArgumentType.NUMBER,
                        defaultValue: '255'
                      },
                      G: {
                        type:  ArgumentType.NUMBER,
                        defaultValue: '255'
                      },
                      B: {
                        type:  ArgumentType.NUMBER,
                        defaultValue: '255'
                      }
                    }
                  },
                  "角色裁剪",
                  {
                    opcode: 'setClipbox',
                    blockType: BlockType.COMMAND,
                    text: '设置裁剪区域 x1:[X1] y1:[Y1] x2:[X2] y2:[Y2]',
                    arguments: {
                      X1: {
                        type: ArgumentType.NUMBER,
                        defaultValue: '0'
                      },
                      Y1: {
                        type: ArgumentType.NUMBER,
                        defaultValue: '0'
                      },
                      X2: {
                        type: ArgumentType.NUMBER,
                        defaultValue: '100'
                      },
                      Y2: {
                        type: ArgumentType.NUMBER,
                        defaultValue: '100'
                      }
                    },
                    // filter: [TargetType.SPRITE]
                  },
                  {
                    opcode: 'clearClipbox',
                    blockType: BlockType.COMMAND,
                    text: '复原裁剪区域',
                    // filter: [TargetType.SPRITE]
                  },
                  {
                    opcode: 'getClipbox',
                    blockType: BlockType.REPORTER,
                    text: '裁剪区域 [PROP]',
                    arguments: {
                      PROP: {
                        type: ArgumentType.STRING,
                        defaultValue: 'width',
                        menu: 'props'
                      }
                    },
                    // filter: [TargetType.SPRITE]
                  },
                  '---',
                  {
                    opcode: 'setAdditiveBlend',
                    blockType: BlockType.COMMAND,
                    text: 'turn additive blending [STATE]',
                    arguments: {
                      STATE: {
                        type: ArgumentType.STRING,
                        defaultValue: 'on',
                        menu: 'states'
                      }
                    },
                    // filter: [TargetType.SPRITE]
                  },
                  {
                    opcode: 'getAdditiveBlend',
                    blockType: BlockType.BOOLEAN,
                    text: 'is additive blending on?',
                    // filter: [TargetType.SPRITE]
                  },
                  "相机控制",
                  {
                    opcode: 'setBoth',
                    blockType: BlockType.COMMAND,
                    text: '设置相机到 x: [x] y: [y]',
                    arguments: {
                      x: {
                        type: ArgumentType.NUMBER,
                        defaultValue: 0
                      },
                      y: {
                        type: ArgumentType.NUMBER,
                        defaultValue: 0
                      },
                    }
                  },
                  '---',
                  {
                    opcode: 'changeZoom',
                    blockType: BlockType.COMMAND,
                    text: '以 [val] 更改相机缩放 ',
                    arguments: {
                      val: {
                        type: ArgumentType.NUMBER,
                        defaultValue: 10
                      }
                    }
                  },
                  {
                    opcode: 'setZoom',
                    blockType: BlockType.COMMAND,
                    text: '设置相机缩放 [val] %',
                    arguments: {
                      val: {
                        type: ArgumentType.NUMBER,
                        defaultValue: 100
                      }
                    }
                  },
                  '---',
                  {
                    opcode: 'changeX',
                    blockType: BlockType.COMMAND,
                    text: '将相机缩放x增加[val]',
                    arguments: {
                      val: {
                        type: ArgumentType.NUMBER,
                        defaultValue: 10
                      }
                    }
                  },
                  {
                    opcode: 'setX',
                    blockType: BlockType.COMMAND,
                    text: '设置相机缩放x[val]',
                    arguments: {
                      val: {
                        type: ArgumentType.NUMBER,
                        defaultValue: 0
                      }
                    }
                  },
                  {
                    opcode: 'changeY',
                    blockType: BlockType.COMMAND,
                    text: '将相机缩放y增加[val]',
                    arguments: {
                      val: {
                        type: ArgumentType.NUMBER,
                        defaultValue: 10
                      }
                    }
                  },
                  {
                    opcode: 'setY',
                    blockType: BlockType.COMMAND,
                    text: '设置相机缩放y[val]',
                    arguments: {
                      val: {
                        type: ArgumentType.NUMBER,
                        defaultValue: 0
                      }
                    }
                  },
                  "---",
                  {
                    opcode: 'getX',
                    blockType: BlockType.REPORTER,
                    text: '相机 x',
                  },
                  {
                    opcode: 'getY',
                    blockType: BlockType.REPORTER,
                    text: '相机 y',
                  },
                  {
                    opcode: 'getZoom',
                    blockType: BlockType.REPORTER,
                    text: '相机 缩放',
                  },
                  '---',
                  {
                    opcode: 'setCol',
                    blockType: BlockType.COMMAND,
                    text: '设置背景颜色为 [val]',
                    arguments: {
                      val: {
                        type: ArgumentType.COLOR
                      }
                    }
                  },
                  {
                    opcode: 'getCol',
                    blockType: BlockType.REPORTER,
                    text: '背景颜色',
                  },

            ],
            menus: {
                enabled: {
                    acceptReporters: true,
                    items: [
                        {
                            text: '启用',
                            value: 'true'
                        },
                        {
                            text: '禁用',
                            value: 'false'
                        }
                    ]
                },
                thing: {
                    acceptReporters: true,
                    items: [
                        {
                            text: '加速模式',
                            value: TURBO_MODE
                        },
                        {
                            text: '补帧',
                            value: INTERPOLATION
                        },
                        {
                            text: '角色可穿过边缘',
                            value: REMOVE_FENCING
                        },
                        {
                            text: '移除其他限制',
                            value: REMOVE_MISC_LIMITS
                        }
                    ]
                },
                clones: {
                    acceptReporters: true,
                    items: [
                        {
                            text: '默认 (300)',
                            value: '300'
                        },
                        {
                            text: '无限',
                            value: 'Infinity'
                        }
                    ]
                },

                dimension: {
                    acceptReporters: true,
                    items: [
                        {
                            text: '宽',
                            value: 'width'
                        },
                        {
                            text: '高',
                            value: 'height'
                        }
                    ]
                }, cursors: {
                    acceptReporters: true,
                    items: [
                        { text: '默认', value: 'default' },
                        { text: '小手形状', value: 'pointer' },
                        { text: '移动', value: 'move' },
                        { text: '抓取', value: 'grab' },
                        { text: '抓取中', value: 'grabbing' },
                        { text: '文本', value: 'text' },
                        { text: '垂直文本', value: 'vertical-text' },
                        { text: '等待', value: 'wait' },
                        { text: '进程', value: 'progress' },
                        { text: '帮助', value: 'help' },
                        { text: '上下文菜单', value: 'context-menu' },
                        { text: '放大', value: 'zoom-in' },
                        { text: '缩小', value: 'zoom-out' },
                        { text: '十字瞄准线', value: 'crosshair' },
                        { text: 'cell', value: 'cell' },
                        { text: '禁止', value: 'not-allowed' },
                        { text: '复制', value: 'copy' },
                        { text: 'alias', value: 'alias' },
                        { text: 'no-drop', value: 'no-drop' },
                        { text: 'all-scroll', value: 'all-scroll' },
                        { text: '调整列大小', value: 'col-resize' },
                        { text: '调整行大小', value: 'row-resize' },
                        { text: '向上箭头', value: 'n-resize' },
                        { text: '向右的箭头', value: 'e-resize' },
                        { text: '向下箭头', value: 's-resize' },
                        { text: '向左箭头', value: 'w-resize' },
                        { text: '右上箭头', value: 'ne-resize' },
                        { text: '左上箭头', value: 'nw-resize' },
                        { text: '右下箭头', value: 'se-resize' },
                        { text: '左下箭头', value: 'sw-resize' },
                        { text: '左右箭头', value: 'ew-resize' },
                        { text: '南北箭头', value: 'ns-resize' },
                        { text: '上右下左箭头', value: 'nesw-resize' },
                        { text: '上左下右箭头', value: 'nwse-resize' },
                    ],
                },
                imagePositions: {
                    acceptReporters: true,
                    items: [
                        // [x, y] where x is [0=left, 100=right] and y is [0=top, 100=bottom]
                        { text: '左上方', value: '0,0' },
                        { text: '右上', value: '100,0' },
                        { text: '左下角', value: '0,100' },
                        { text: '右下角', value: '100,100' },
                        { text: '中心', value: '50,50' },
                    ]
                },
                imageSizes: {
                    acceptReporters: true,
                    items: [
                        // Some important numbers to keep in mind:
                        // Browsers ignore cursor images >128 in any dimension (https://searchfox.org/mozilla-central/rev/43ee5e789b079e94837a21336e9ce2420658fd19/widget/gtk/nsWindow.cpp#3393-3402)
                        // Browsers may refuse to display a cursor near window borders for images >32 in any dimension
                        { text: '4x4', value: '4x4' },
                        { text: '8x8', value: '8x4' },
                        { text: '12x12', value: '12x12' },
                        { text: '16x16', value: '16x16' },
                        { text: '32x32', value: '32x32' },
                        { text: '48x48 (unreliable)', value: '48x48' },
                        { text: '64x64 (unreliable)', value: '64x64' },
                        { text: '128x128 (unreliable)', value: '128x128' },
                    ]
                },
                coordMenu: {
                    items: ['x', 'y']
                  },
                  coordTypes: {
                    items: ['Canvas', 'Scratch']
                  },
                  pointmenu: {
                    items: ['1', '2', '3']
                  },
                  TFmenu: {
                    items: ['true',"false"]
                  },states: {
                    acceptReporters: true,
                    items: [
                      {
                        text: '开启',
                        value: 'on'
                      },
                      {
                        text: '关闭',
                        value: 'off'
                      }
                    ]
                  },
                  props: {
                    acceptReporters: true,
                    items: [
                      {
                        text: '宽',
                        value: 'width'
                      },
                      {
                        text: '高',
                        value: 'height'
                      },
                      {
                        text: 'x最小值',
                        value: 'min x'
                      },
                      {
                        text: 'y最小值',
                        value: 'min y'
                      },
                      {
                        text: 'x最大值',
                        value: 'max x'
                      },
                      {
                        text: 'y最大值',
                        value: 'max y'
                      }
                    ]
                  },
            }
        };
    }
    setStretch(args, util) {
        // TODO: move to Cast when it's merged
        util.target[STRETCH_X] = +args.X || 0;
        util.target[STRETCH_Y] = +args.Y || 0;
        forceUpdateDirectionAndScale(util.target);
    }
    getX(args, util) {
        console.log(util)
        return util.target[STRETCH_X];
    }
    getY(args, util) {
        return util.target[STRETCH_Y];
    }

    setLocked(args) {
        isPointerLockEnabled = args.enabled === 'true';
        if (!isPointerLockEnabled && isLocked) {
            document.exitPointerLock();
        }
    }

    isLocked() {
        return isLocked;
    }
    x() { return zx; }
    y() { return zy; }
    xy() { zx = zy = 0; }
    getEnabled({ thing }) {
        if (thing === TURBO_MODE) {
            return vm.runtime.turboMode;
        } else if (thing === INTERPOLATION) {
            
            return vm.runtime.interpolationEnabled;
        } else if (thing === REMOVE_FENCING) {
            
            return !vm.runtime.runtimeOptions.fencing;
        } else if (thing === REMOVE_MISC_LIMITS) {
            
            return !vm.runtime.runtimeOptions.miscLimits;
        }
        return false;
    }

    setEnabled({ thing, enabled }) {
        enabled = enabled === 'true';

        if (thing === TURBO_MODE) {
            vm.setTurboMode(enabled);
        } else if (thing === INTERPOLATION) {
            
            vm.setInterpolation(enabled);
        } else if (thing === REMOVE_FENCING) {
            
            vm.setRuntimeOptions({
                fencing: !enabled
            });
        } else if (thing === REMOVE_MISC_LIMITS) {
            
            vm.setRuntimeOptions({
                miscLimits: !enabled
            });
        }
    }

    getFramerate() {
        
        return vm.runtime.frameLoop.framerate;
    }

    setFramerate({ fps }) {
        fps = +fps || 0;
        
        vm.setFramerate(fps);
    }

    getCloneLimit() {
        
        return vm.runtime.runtimeOptions.maxClones;
    }

    setCloneLimit({ limit }) {
        limit = +limit || 0;
        
        vm.setRuntimeOptions({
            maxClones: limit
        });
    }

    getDimension({ dimension }) {
        if (dimension === 'width') {
            
            return vm.runtime.stageWidth;
        } else if (dimension === 'height') {
            
            return vm.runtime.stageHeight;
        }
        return 0;
    }

    setDimensions({ width, height }) {
        width = +width || 0;
        height = +height || 0;
        
        vm.setStageSize(width, height);
    }
    setCur(args) {
        const newCursor = args.cur;
        nativeCursor = newCursor;
        customCursorImageName = null;
        currentCanvasCursor = newCursor;
        updateCanvasCursor();
      }
  
      setCursorImage(args, util) {
        const [maxWidth, maxHeight] = parseTuple(args.size).map(i => Math.max(0, i));
  
        const currentCostume = util.target.getCostumes()[util.target.currentCostume];
        const costumeName = currentCostume.name;
  
        let encodedCostume;
        try {
          encodedCostume = costumeToCursor(currentCostume, maxWidth, maxHeight);
        } catch (e) {
          // This could happen for a variety of reasons.
          console.error(e);
        }
  
        if (encodedCostume) {
          const [percentX, percentY] = parseTuple(args.position).map(i => Math.max(0, Math.min(100, i)) / 100);
          const x = percentX * encodedCostume.width;
          const y = percentY * encodedCostume.height;
  
          currentCanvasCursor = `url("${encodedCostume.uri}") ${x} ${y}, ${nativeCursor}`;
          updateCanvasCursor();
        } else {
          // If for some reason the costume couldn't be encoded, we'll leave the cursor unchanged.
          // This is the same behavior that would happen if we successfully encode a cursor but the browser
          // is unable to parse it for some reason.
        }
  
        customCursorImageName = costumeName;
      }
  
      hideCur() {
        this.setCur({
          cur: 'none'
        });
      }
  
      getCur() {
        if (customCursorImageName !== null) {
          return customCursorImageName;
        }
        return nativeCursor;
      }
      rgbtoSColor({R,G,B}) {
        return (((R * 256) + G) * 256) + B;
      }
  
      getstampwidth({}) {
        return stampWidth;
      }
  
      getstampheight({}) {
        return stampHeight;
      }
  
      converttocanvascoords({coordmenu,scrcoord,coordTypes}) {
        if (coordTypes == 'Canvas') {
          if (coordmenu == "x") {
            return scrcoord + (screenWidth/2)
          } else {
            return (scrcoord*-1) + (screenHeight/2)
          }
        } else {
          if (coordmenu == "x") {
            return scrcoord - (screenWidth/2)
          } else {
            return (scrcoord*-1) - (screenHeight/2)
          }
        }
      }
  
      getstamprotation({}) {
        return stampRotation
      }
  
      rotateStamp({ANGLE}) {
        stampRotation = ANGLE
      }
  
      pendrawspritefromurl({url,x,y}) {
        var scaleMultiplier = canvas3.width / screenWidth;
        if(!textures.hasOwnProperty(url)){
          textures[url] = loadImageAndCreateTextureInfo(url, true);
        }
        drawImage(textures[url].texture, stampWidth * scaleMultiplier, stampHeight * scaleMultiplier, (x) * scaleMultiplier, (y) * scaleMultiplier, stampRotation - 90);
      }
  
      gettargetstagewidth({}) {
        return screenWidth
      }
  
      gettargetstageheight({}) {
        return screenHeight
      }
  
      pendrawtexturedtrifromurl({url, trianglepoints, triangleuvs}) {
        var scalemultiplyer = canvas3.width / screenWidth;
        if(!textures.hasOwnProperty(url)){
          textures[url] = loadImageAndCreateTextureInfo(url, true);
        }
        var pointsarray = trianglepoints.split(",");
        var pointslen = pointsarray.length;
        for (var i = 0; i < pointslen; i++) {
          pointsarray[i] = pointsarray[i] * scalemultiplyer;
        }
        var uvarray = triangleuvs.split(",");
        drawTexturedTri(textures[url].texture, pointsarray, uvarray);
      }
  
      precachetextures({uri,clamp}) {
        coolcash(uri, clamp === 'true')
      }
  
      setpenstrechandsquash({width,height}) {
        stampWidth = width;
        stampHeight = height;
      }
  
      settargetsw({width,height}) {
        screenWidth = width;
        screenHeight = height;
      }
  
      getcostumedata({costu},util) {
        let fileData = getspritecostume(util,costu)
        return fileData;
      }
  
      coordBlock({c1,c2,c3,c4,c5,c6}) {
        return c1 + "," + c2 + "," + c3 + "," + c4 + "," + c5 + "," + c6
      }
  
      settripointcolour({pointmenu,color,T}) {
        if (pointmenu == "1") {
          triangleColors[0] = hexToRgb(color).r / 255
          triangleColors[1] = hexToRgb(color).g / 255
          triangleColors[2] = hexToRgb(color).b / 255
          triangleColors[3] = T / 255
        } else if (pointmenu == "2"){
          triangleColors[4] = hexToRgb(color).r / 255
          triangleColors[5] = hexToRgb(color).g / 255
          triangleColors[6] = hexToRgb(color).b / 255
          triangleColors[7] = T / 255
        } else{
          triangleColors[8] = hexToRgb(color).r / 255
          triangleColors[9] = hexToRgb(color).g / 255
          triangleColors[10] = hexToRgb(color).b / 255
          triangleColors[11] = T / 255
        }
      }
  
      setstampcolor({color,T}) {
        let convertr = hexToRgb(color).r / 255
        let convertg = hexToRgb(color).g / 255
        let convertb = hexToRgb(color).b / 255
        let converta = T / 255
        quadColors[0] = convertr
        quadColors[1] = convertg
        quadColors[2] = convertb
        quadColors[3] = converta
        quadColors[4] = convertr
        quadColors[5] = convertg
        quadColors[6] = convertb
        quadColors[7] = converta
        quadColors[8] = convertr
        quadColors[9] = convertg
        quadColors[10] = convertb
        quadColors[11] = converta
  
        quadColors[12] = convertr
        quadColors[13] = convertg
        quadColors[14] = convertb
        quadColors[15] = converta
        quadColors[16] = convertr
        quadColors[17] = convertg
        quadColors[18] = convertb
        quadColors[19] = converta
        quadColors[20] = convertr
        quadColors[21] = convertg
        quadColors[22] = convertb
        quadColors[23] = converta
      }

      setBoth(ARGS) {
        cameraX = +ARGS.x;
        cameraY = +ARGS.y;
        doFix();
      }
      changeZoom(ARGS) {
        cameraZoom += +ARGS.val;
        doFix();
      }
      setZoom(ARGS) {
        cameraZoom = +ARGS.val;
        doFix();
      }
      changeX(ARGS) {
        cameraX += +ARGS.val;
        doFix();
      }
      setX(ARGS) {
        cameraX = +ARGS.val;
        doFix();
      }
      changeY(ARGS) {
        cameraY += +ARGS.val;
        doFix();
      }
      setY(ARGS) {
        cameraY = +ARGS.val;
        doFix();
      }
      getX() {
        return cameraX;
      }
      getY() {
        return cameraY;
      }
      getZoom() {
        return cameraZoom;
      }
      setCol(ARGS) {
        cameraBG = ARGS.val;
        console.log(cameraBG)
        vm.renderer.setBackgroundColor(
          ( cameraBG % 256 ) / 255,
          ( parseInt(cameraBG/256) % 256 ) / 255,
          ( parseInt(cameraBG/256/256) % 256 ) / 255
        );
      }
      getCol() {
        return cameraBG;
      }
      setClipbox ({X1, Y1, X2, Y2}, {target}) {
        if (target.isStage) return;
        const newClipbox = {
          x: Math.min(X1, X2),
          y: Math.min(Y1, Y2),
          w: Math.max(X1, X2) - Math.min(X1, X2),
          h: Math.max(Y1, Y2) - Math.min(Y1, Y2)
        };
        target.clipbox = newClipbox;
        renderer.updateDrawableClipBox.call(renderer, target.drawableID, newClipbox);
        if (target.visible) {
          renderer.dirty = true;
          target.emitVisualChange();
          target.runtime.requestRedraw();
          target.runtime.requestTargetsUpdate(target);
        }
      }
  
      clearClipbox (args, {target}) {
        if (target.isStage) return;
        target.clipbox = null;
        renderer.updateDrawableClipBox.call(renderer, target.drawableID, null);
        if (target.visible) {
          renderer.dirty = true;
          target.emitVisualChange();
          target.runtime.requestRedraw();
          target.runtime.requestTargetsUpdate(target);
        }
      }
  
      setAdditiveBlend ({STATE}, {target}) {
        let newValue = null;
        if (STATE === 'on') newValue = true;
        if (STATE === 'off') newValue = false;
        if (newValue === null) return;
  
        if (target.isStage) return;
        target.additiveBlend = newValue;
        renderer.updateDrawableAdditiveBlend.call(renderer, target.drawableID, newValue);
        if (target.visible) {
          renderer.dirty = true;
          target.emitVisualChange();
          target.runtime.requestRedraw();
          target.runtime.requestTargetsUpdate(target);
        }
      }
  
      getClipbox ({PROP}, {target}) {
        const clipbox = target.clipbox;
        if (!clipbox) return '';
        switch (PROP) {
          case 'width': return clipbox.w;
          case 'height': return clipbox.h;
          case 'min x': return clipbox.x;
          case 'min y': return clipbox.y;
          case 'max x': return clipbox.x + clipbox.w;
          case 'max y': return clipbox.y + clipbox.h;
          default: return '';
        }
      }
  
      getAdditiveBlend (args, {target}) {
        return target.additiveBlend ?? false;
      }

}

module.exports = Scratch3CommunityBlocks;
