import { Renderer, Camera, Transform, Program, Mesh, Box, Color, Orbit } from './js/ogl/ogl.js';

{
    let info = document.getElementById('info');
    info.innerHTML = "3D object : mario 1" ;

    // Adaptation for OGL of an example written by CX20 on this project : https://github.com/cx20/jsdo.it-archives

    // ‥‥‥‥‥‥‥‥‥‥‥‥‥□□□
    // ‥‥‥‥‥‥〓〓〓〓〓‥‥□□□
    // ‥‥‥‥‥〓〓〓〓〓〓〓〓〓□□
    // ‥‥‥‥‥■■■□□■□‥■■■
    // ‥‥‥‥■□■□□□■□□■■■
    // ‥‥‥‥■□■■□□□■□□□■
    // ‥‥‥‥■■□□□□■■■■■‥
    // ‥‥‥‥‥‥□□□□□□□■‥‥
    // ‥‥■■■■■〓■■■〓■‥‥‥
    // ‥■■■■■■■〓■■■〓‥‥■
    // □□■■■■■■〓〓〓〓〓‥‥■
    // □□□‥〓〓■〓〓□〓〓□〓■■
    // ‥□‥■〓〓〓〓〓〓〓〓〓〓■■
    // ‥‥■■■〓〓〓〓〓〓〓〓〓■■
    // ‥■■■〓〓〓〓〓〓〓‥‥‥‥‥
    // ‥■‥‥〓〓〓〓‥‥‥‥‥‥‥‥
    var dataSet = [
        "無","無","無","無","無","無","無","無","無","無","無","無","無","肌","肌","肌",
        "無","無","無","無","無","無","赤","赤","赤","赤","赤","無","無","肌","肌","肌",
        "無","無","無","無","無","赤","赤","赤","赤","赤","赤","赤","赤","赤","肌","肌",
        "無","無","無","無","無","茶","茶","茶","肌","肌","茶","肌","無","赤","赤","赤",
        "無","無","無","無","茶","肌","茶","肌","肌","肌","茶","肌","肌","赤","赤","赤",
        "無","無","無","無","茶","肌","茶","茶","肌","肌","肌","茶","肌","肌","肌","赤",
        "無","無","無","無","茶","茶","肌","肌","肌","肌","茶","茶","茶","茶","赤","無",
        "無","無","無","無","無","無","肌","肌","肌","肌","肌","肌","肌","赤","無","無",
        "無","無","赤","赤","赤","赤","赤","青","赤","赤","赤","青","赤","無","無","無",
        "無","赤","赤","赤","赤","赤","赤","赤","青","赤","赤","赤","青","無","無","茶",
        "肌","肌","赤","赤","赤","赤","赤","赤","青","青","青","青","青","無","無","茶",
        "肌","肌","肌","無","青","青","赤","青","青","黄","青","青","黄","青","茶","茶",
        "無","肌","無","茶","青","青","青","青","青","青","青","青","青","青","茶","茶",
        "無","無","茶","茶","茶","青","青","青","青","青","青","青","青","青","茶","茶",
        "無","茶","茶","茶","青","青","青","青","青","青","青","無","無","無","無","無",
        "無","茶","無","無","青","青","青","青","無","無","無","無","無","無","無","無"
    ];

    function getRgbColor( c ) {
        var colorHash = {
            "無":"#DCAA6B",    // 段ボール色
            "白":"#ffffff",    // white
            "肌":"#ffcccc",    // skin
            "茶":"#800000",    // tea
            "赤":"#ff0000",    // red
            "黄":"#ffff00",    // yellow
            "緑":"#00ff00",    // green
            "水":"#00ffff",    // water
            "青":"#0000ff",    // blue
            "紫":"#800080"     // purple
        };
        return colorHash[ c ];
    }

    const update = () => {

        const vertex = /* glsl */ `
            precision highp float;
            precision highp int;
            attribute vec3 position;
            attribute vec3 normal;
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            uniform mat3 normalMatrix;
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragment = /* glsl */ `
            precision highp float;
            precision highp int;
            uniform vec3 uColor;
            varying vec3 vNormal;
            void main() {
                vec3 normal = normalize(vNormal);
                float lighting = dot(normal, normalize(vec3(-0.3, 0.8, 0.6)));
                gl_FragColor.rgb = uColor + lighting * 0.1;
                gl_FragColor.a = 1.0;
            }
        `;
        {
            const renderer = new Renderer({ dpr: 2 });
            const gl = renderer.gl;
            document.body.appendChild(gl.canvas);
            gl.clearColor(1, 1, 1, 1);

            const camera = new Camera(gl, { fov: 35 });
            camera.position.set(0, 0, -40);
            camera.lookAt([0, 0, 0]);
            const controls = new Orbit(camera);

            function resize() {
                renderer.setSize(window.innerWidth, window.innerHeight);
                camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
            }

            window.addEventListener('resize', resize, false);
            resize();

            const scene = new Transform();

            let side  = 0.8;
            const cubeGeometry = new Box(gl, {width: side, height: side, depth: side});

            let cubes = [];
            for ( let i = 0, len=dataSet.length; i < len; i++ ) {
                let x = i % 16;
                let y = Math.floor(i/16);
                let px = x - 8;
                let pz = y - 8;
                let color = getRgbColor(dataSet[i]);

                const program = new Program(gl, {
                    vertex,
                    fragment,
                    uniforms: {
                        uColor: {value: new Color(color)},
                    },
                    // Don't cull faces so that plane is double sided - default is gl.BACK
                    cullFace: null,
                });

                const cube = new Mesh(gl, { geometry: cubeGeometry, program});
                cube.position.set(px, 0, pz);
                cube.setParent(scene);
                cubes.push(cube);
            }

            requestAnimationFrame(update);
            function update() {
                requestAnimationFrame(update);
                controls.update();

                cubes.forEach(cube => {
                    cube.rotation.z -= 0.02;
                    cube.rotation.y -= 0.02;
                });

                renderer.render({ scene, camera });
            }
        }

    };

    document.addEventListener("DOMContentLoaded", function (event) {
        console.log("DOM fully loaded and parsed");
        requestAnimationFrame(update);
    });
}
