// When we use standard derivatives (dFdx & dFdy functions),
// which are necessary for this effect, WebGL1 requires the
// GL_OES_standard_derivatives extension, and WebGL2 complains
// about the extension's existence. So unfortunately we're
// forced to create a 300 es GLSL shader for WebGL2, and a 100 es
// GLSL shader for WebGL1. There are only slight syntax changes.
export const vertex100 = /* glsl */ `
            attribute vec3 position;
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            varying vec4 vMVPos;
            void main() {
                vMVPos = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * vMVPos;
            }
        `;

export const fragment100 = /* glsl */ `#extension GL_OES_standard_derivatives : enable
            precision highp float;
            uniform sampler2D tMap;
            varying vec4 vMVPos;
            vec3 normals(vec3 pos) {
                vec3 fdx = dFdx(pos);
                vec3 fdy = dFdy(pos);
                return normalize(cross(fdx, fdy));
            }
            vec2 matcap(vec3 eye, vec3 normal) {
                vec3 reflected = reflect(eye, normal);
                float m = 2.8284271247461903 * sqrt(reflected.z + 1.0);
                return reflected.xy / m + 0.5;
            }
            void main() {
                vec3 normal = normals(vMVPos.xyz);
                // We're using the matcap to add some shininess to the model
                float mat = texture2D(tMap, matcap(normalize(vMVPos.xyz), normal)).g;

                gl_FragColor.rgb = normal + mat;
                gl_FragColor.a = 1.0;
            }
        `;

export const vertex300 = /* glsl */ `#version 300 es
            in vec3 position;
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            out vec4 vMVPos;
            void main() {
                vMVPos = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * vMVPos;
            }
        `;

export const fragment300 = /* glsl */ `#version 300 es
            precision highp float;
            uniform sampler2D tMap;
            in vec4 vMVPos;
            out vec4 FragColor;
            vec3 normals(vec3 pos) {
                vec3 fdx = dFdx(pos);
                vec3 fdy = dFdy(pos);
                return normalize(cross(fdx, fdy));
            }
            vec2 matcap(vec3 eye, vec3 normal) {
                vec3 reflected = reflect(eye, normal);
                float m = 2.8284271247461903 * sqrt(reflected.z + 1.0);
                return reflected.xy / m + 0.5;
            }
            void main() {
                vec3 normal = normals(vMVPos.xyz);
                // We're using the matcap to add some shininess to the model
                float mat = texture(tMap, matcap(normalize(vMVPos.xyz), normal)).g;

                FragColor.rgb = normal + mat;
                FragColor.a = 1.0;
            }
        `;

export const render_modes = ['LINES', 'LINE_STRIP', 'TRIANGLES', 'TRIANGLE_STRIP', 'TRIANGLE_FAN'];

export const render_modes_extended = ['LINES', 'LINE_STRIP', 'TRIANGLES', 'TRIANGLE_STRIP', 'TRIANGLE_FAN',
    'BALLS', 'BOXES', 'BALLS_TRIANGLE_STRIP', 'BOXES_TRIANGLE_STRIP'];


// textures from : https://unsplash.com/collections/1417675/google-pixel-textures-collection
//      <a href="https://unsplash.com/collections/1417675/google-pixel-textures-collection" target="_blank">Free textures from Unsplash</a>
/*
let textures = [
    '0=None',
    '1=bia-andrade-PO8Woh4YBD8-unsplash.jpg',
    '2=ferdinand-stohr-NFs6dRTBgaM-unsplash.jpg',
    '3=evan-provan-V9A-_QKLElg-unsplash.jpg',
    '4=steve-johnson-5Oe8KFH5998-unsplash.jpg'
];
*/

// Textures from : https://codepen.io/Dillo/pen/xxGwdpE
export const textures = [
    '0=None',
    '1=texture01.png',
    '2=texture02.png',
    '3=texture03.png',
    '4=texture04.png',
    '5=texture05.png',
    '6=texture06.png',
    '7=texture07.png',
    '8=texture08.png',
    '9=texture09.png',
    '10=texture10.png',
    '11=texture11.png',
    '12=texture12.png',
    '13=texture13.png',
    '14=texture14.png',
    '15=texture15.png',
    '16=texture16.png',
    '17=bia-andrade-PO8Woh4YBD8-unsplash.jpg'
];

export const textures_extended = [
    '0=None',
    '1=texture01.png',
    '2=texture02.png',
    '3=texture03.png',
    '4=texture04.png',
    '5=texture05.png',
    '6=texture06.png',
    '7=texture07.png',
    '8=texture08.png',
    '9=texture09.png',
    '10=texture10.png',
    '11=texture11.png',
    '12=texture12.png',
    '13=texture13.png',
    '14=texture14.png',
    '15=texture15.png',
    '16=texture16.png',
    '17=bia-andrade-PO8Woh4YBD8-unsplash.jpg',
    'gradTexture()'
];

export const textures_predefined = {
    palette01: {
        "name": "colors created manually, 6 colors",
        "colors": ["#3884AA", "#61686B", "#AA6538", "#61686B", "#AAAA38", "#61686B"],
    }, palette02: {
        "name": "colors created manually, 4 colors",
        "colors": ["#1B1D1E", "#3D4143", "#72797D", "#B0BABF"]
    }, palette03: {
        "name": "scale of colors generated by chroma.js, 5 colors",
        "colors": ["#d8b48d", "#b99570", "#9a7854", "#7c5c3a", "#5f4121"],
        "generatedBy": "chroma.scale(['#d8b48d', '#5f4121']).mode('lch').colors(5)"
    }, palette04: {
        "name": "scale of colors generated by chroma.js, 15 colors",
        "colors": ["#d8b48d", "#cfab85", "#c6a27c", "#bd9a74", "#b4916c", "#ab8964", "#a3805c", "#9a7854", "#91704d", "#896845", "#80603e", "#785836", "#6f502f", "#674928", "#5f4121"],
        "generatedBy": "chroma.scale(['#d8b48d', '#5f4121']).mode('lch').colors(15)"
    }, palette05: {
        "name": "scale of colors generated by chroma.js, 9 colors",
        "colors": ["#00429d", "#0075c4", "#00a6d8", "#21d3e1", "#96ffea", "#b9ffdd", "#d6ffd7", "#eeffd8", "#ffffe0"],
        "generatedBy": "chroma.scale([\"#00429d\", \"#96ffea\", \"lightyellow\"]).mode('lch').colors(9)"
    }, palette06: {
        "name": "scale of colors generated by chroma.js, 15 colors",
        "colors": ["#ffffff", "#fff1ec", "#ffe4da", "#ffd6c8", "#ffc8b6", "#ffbaa4", "#ffac93", "#ff9e81", "#ff8f70", "#ff805f", "#ff704f", "#ff5f3e", "#ff4b2d", "#ff331a", "#ff0000"],
        "generatedBy": "chroma.scale(['white', 'red']).mode('lab').colors(15)"
    }, palette07: {
        "name": "logarithmic color scale generated by chroma.js, 15 colors",
        "colors": ["#ffffe0", "#ededd9", "#dbdbd2", "#c8c8cb", "#b6b6c5", "#a4a4be", "#9292b7", "#8080b0", "#6d6da9", "#5b5ba2", "#49499b", "#373795", "#24248e", "#121287", "#000080"],
        "generatedBy": "chroma.scale(['lightyellow', 'navy']).domain([1, 100000], 7, 'log').colors(15)"
    }
};


export function gradTexture(colors, size=1024) {
    var canvas = document.createElement("canvas");
    var ct = canvas.getContext("2d");
    canvas.width = 16;
    canvas.height = size;
    var gradient = ct.createLinearGradient(0, 0, 0, size);
    var i = colors[0].length;
    while (i--) {
        gradient.addColorStop(colors[0][i], colors[1][i]);
    }
    ct.fillStyle = gradient;
    ct.fillRect(0, 0, 16, size);
    return canvas;
}

export function basicTexture(colors, n, size=64) {
    var canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    var ctx = canvas.getContext('2d');
    var color = "#3884AA"; // default color if n not found
    if (colors[n]) {
        color = colors[n];
    }
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillRect(32, 32, 32, 32);
    return canvas;
}

export function checkerboardTexture(size=128) {
    var c = document.createElement('canvas').getContext('2d');
    c.canvas.width = c.canvas.height = size;
    let step = 16;
    for (let y = 0, ylen = c.canvas.height; y < ylen; y += step) {
        for (let x = 0, xlen = c.canvas.width; x < xlen; x += step) {
            c.fillStyle = (x ^ y) & step ? '#FFF' : '#DDD';
            c.fillRect(x, y, step, step);
        }
    }
    return c.canvas;
}

export function gleaTexture1 (sizeX=256, sizeY=256) {
    var c = document.createElement('canvas').getContext('2d');
    c.canvas.width = sizeX;
    c.canvas.height = sizeY;
    const {
        cos, sin, PI, sqrt, pow, abs, floor
    } = Math;
    let ff=255;
    let img = new ImageData(sizeX,sizeY);
    let midX = floor(sizeX / 2);
    let midY = floor(sizeY / 2);
    for(let Y=sizeY;Y--;) {
        for(let X=sizeX;X--;){
            let x = X-midX
            let y = Y-midY
            let offs = (Y<<10)+(X<<2)
            let v1=(Q(x*x+y*y)|0)
            //let v2=(127+(sin(.03*(abs(x)+abs(y)))+sin(.03*(x*x+y*y))+sin(.003*(pow(abs(x),1.5)+pow(abs(y),1.5)))*ff/3))|0
            img.data[offs  ]=(v1&31)*8
            img.data[offs+1]=(v1&31)
            img.data[offs+2]=(v1&15)*16
            img.data[offs+3]=ff
        }
    }
    c.canvas.putImageData(img,0,0)
    return c.canvas;
}

export function gleaTexture2 (sizeX=256, sizeY=256) {
    var c = document.createElement('canvas').getContext('2d');
    c.canvas.width = sizeX;
    c.canvas.height = sizeY;
    const {
        cos, sin, PI, sqrt, pow, abs, floor
    } = Math;
    let ff=255;
    let img = new ImageData(sizeX,sizeY);
    let midX = floor(sizeX / 2);
    let midY = floor(sizeY / 2);
    for(let Y=sizeY;Y--;) {
        for(let X=sizeX;X--;){
            let x = X-midX
            let y = Y-midY
            let offs = (Y<<10)+(X<<2)
            //let v1=(sqrt(x*x+y*y)|0)
            let v2=(127+(sin(.03*(abs(x)+abs(y)))+sin(.03*(x*x+y*y))+sin(.003*(pow(abs(x),1.5)+pow(abs(y),1.5)))*ff/3))|0
            img.data[offs  ]=v2
            img.data[offs+1]=0
            img.data[offs+2]=v2
            img.data[offs+3]=ff
        }
    }
    c.canvas.putImageData(img,0,0)
    return c.canvas;
}

/*
test = genTexture2(256, 256);
c.putImageData(test,0,0)
throw Error("Stop! I'd like to see texture 2 :)")
 */