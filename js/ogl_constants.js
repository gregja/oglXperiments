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

export const render_modes = ['LINES',  'LINE_STRIP', 'TRIANGLES', 'TRIANGLE_STRIP', 'TRIANGLE_FAN'];

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
];