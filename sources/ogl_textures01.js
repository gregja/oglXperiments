import {Renderer, Camera, Transform, Texture, Program, Mesh, Box, Sphere, Orbit} from '../js/ogl/ogl.js';

function letsgo() {

    let info1 = document.getElementById('info1');
    info1.innerHTML = "Mapping of 2D textures on 3D objects";
    let info2 = document.getElementById('info2');

    const vertex = /* glsl */ `
            precision highp float;
            precision highp int;
            attribute vec2 uv;
            attribute vec3 position;
            attribute vec3 normal;
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            uniform mat3 normalMatrix;
            varying vec2 vUv;
            varying vec3 vNormal;
            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);              
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

    const fragment = /* glsl */ `
            precision highp float;
            precision highp int;
            uniform sampler2D tMap;
            varying vec2 vUv;
            varying vec3 vNormal;
            void main() {
                vec3 normal = normalize(vNormal);
                vec3 tex = texture2D(tMap, vUv).rgb;                
                vec3 light = normalize(vec3(0.5, 1.0, -0.3));
                float shading = dot(normal, light) * 0.15;                
                gl_FragColor.rgb = tex + shading;
                gl_FragColor.a = 1.0;
            }
        `;

    //----------------------------------
    //  TEXTURES
    //----------------------------------

    function gradTexture(colors) {
        var canvas = document.createElement("canvas");
        var ct = canvas.getContext("2d");
        var size = 1024;
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

    function basicTexture(colors, n) {
        var canvas = document.createElement('canvas');
        canvas.width = canvas.height = 64;
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

    function checkerboardTexture() {
        var c = document.createElement('canvas').getContext('2d');
        c.canvas.width = c.canvas.height = 128;
        let step = 16;
        for (let y = 0, ylen = c.canvas.height; y < ylen; y += step) {
            for (let x = 0, xlen = c.canvas.width; x < xlen; x += step) {
                c.fillStyle = (x ^ y) & step ? '#FFF' : '#DDD';
                c.fillRect(x, y, step, step);
            }
        }
        return c.canvas;
    }

    {
        const renderer = new Renderer({dpr: 2});
        const gl = renderer.gl;
        document.body.appendChild(gl.canvas);
        gl.clearColor(1, 1, 1, 1);

        const camera = new Camera(gl, {fov: 45});
        camera.position.set(3, 1.5, 4);
        camera.lookAt([1, 0.2, 0]);
        const controls = new Orbit(camera);

        function resize() {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.perspective({aspect: gl.canvas.width / gl.canvas.height});
        }

        window.addEventListener('resize', resize, false);
        resize();

        const scene = new Transform();

        let color_series = [];
        color_series.push({
            name: "colors created manually, 6 colors",
            colors: ["#3884AA", "#61686B", "#AA6538", "#61686B", "#AAAA38", "#61686B"]
        });
        color_series.push({
            name: "colors created manually, 4 colors",
            colors: ['#1B1D1E', '#3D4143', '#72797D', '#B0BABF']
        });
        color_series.push({
            name: "scale of colors generated by chroma.js, 5 colors",
            colors: chroma.scale(['#d8b48d', '#5f4121']).mode('lch').colors(5)
        });
        color_series.push({
            name: "scale of colors generated by chroma.js, 15 colors",
            colors: chroma.scale(['#d8b48d', '#5f4121']).mode('lch').colors(15)
        });
        color_series.push({
            name: "scale of colors generated by chroma.js, 9 colors",
            colors: chroma.scale(["#00429d", "#96ffea", "lightyellow"]).mode('lch').colors(9)
        });
        color_series.push({
            name: "scale of colors generated by chroma.js, 15 colors",
            colors: chroma.scale(['white', 'red']).mode('lab').colors(15)
        });
        color_series.push({
            name: "logarithmic color scale generated by chroma.js, 15 colors",
            colors: chroma.scale(['lightyellow', 'navy']).domain([1, 100000], 7, 'log').colors(15)
        });

        let colors_params = {
            current_series: 0,
            current_color: 0,
            texture: "simple"  // "simple" or "gradient"
        };

        // Upload empty texture while source loading
        const texture = new Texture(gl);
        if (colors_params.texture == 'simple') {
            texture.image = basicTexture(color_series[colors_params.current_series].colors, colors_params.current_color);
        } else {
            texture.image = gradTexture([[0.75, 0.6, 0.4, 0.25], color_series[colors_params.current_series].colors]);
        }

        function updateInfo2() {
            info2.innerHTML = '';
            if (colors_params.texture == 'simple') {
                info2.innerHTML = 'Simple texture (4 squares), ' +
                    color_series[colors_params.current_series].name + "<br>";
                info2.innerHTML += '"c" : change the color palette <br>';
                info2.innerHTML += '"g" : gradient texture<br>';
                info2.innerHTML += '"o" : checkerboard texture <br>';
                info2.innerHTML += '"+" or "-"  : change the current color<br>';
            } else {
                info2.innerHTML = 'Gradient texture, ' +
                    color_series[colors_params.current_series].name + "<br>";
                info2.innerHTML += '"c" : change the color palette <br>';
                info2.innerHTML += '"s" : simple texture (4 squares)<br>';
                info2.innerHTML += '"o" : checkerboard texture <br>';

            }
        }

        updateInfo2();

        const program = new Program(gl, {
            vertex,
            fragment,
            uniforms: {
                tMap: {value: texture},
            },
            cullFace: null,
        });

        let side = .5;
        const imgGeometry1 = new Sphere(gl, {radius: side});

        const boxMesh1 = new Mesh(gl, {
            geometry: imgGeometry1,
            program: program
        });
        boxMesh1.position.set(0, 0, 0);
        boxMesh1.setParent(scene);

        const imgGeometry2 = new Box(gl, {width: 4, height: .2, depth: 4});

        const boxMesh2 = new Mesh(gl, {
            geometry: imgGeometry2,
            program: program
        });
        boxMesh2.position.set(0, -1, 0);
        boxMesh2.setParent(scene);

        function update(t) {
            requestAnimationFrame(update);
            controls.update();

            boxMesh1.rotation.y += 0.003;
            boxMesh2.rotation.y += 0.003;

            renderer.render({scene, camera});
        }

        function keyPressed(e) {
            // Documentation about keyboard events :
            //    https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
            if (e.key == 'g' || e.key == 'G') {
                colors_params.texture = 'gradient';
                texture.image = gradTexture([[0.75, 0.6, 0.4, 0.25], color_series[colors_params.current_series].colors]);
                updateInfo2();
            }
            if (e.key == 's' || e.key == 'S') {
                colors_params.texture = 'simple';
                texture.image = basicTexture(color_series[colors_params.current_series].colors, colors_params.current_color);
                updateInfo2();
            }
            if (e.key == 'o' || e.key == 'O') {
                colors_params.texture = 'checkerboard';
                texture.image = checkerboardTexture();
                updateInfo2();
            }
            if (e.key == 'c' || e.key == 'C') {
                colors_params.current_series += 1;
                if (colors_params.current_series > color_series.length - 1) {
                    colors_params.current_series = 0;
                }
                colors_params.current_color = 0;
                if (colors_params.texture == 'simple') {
                    texture.image = basicTexture(color_series[colors_params.current_series].colors, colors_params.current_color);
                } else {
                    texture.image = gradTexture([[0.75, 0.6, 0.4, 0.25], color_series[colors_params.current_series].colors]);
                }
                updateInfo2();
            }
            if (e.key == '+' || e.key == '-') {
                if (colors_params.texture == 'simple') {
                    let direction = +1;
                    if (e.key == '-') {
                        direction = -1;
                    }
                    colors_params.current_color += direction;
                    if (colors_params.current_color < 0) {
                        colors_params.current_color = color_series[colors_params.current_series].colors.length - 1;
                    } else {
                        if (colors_params.current_color > color_series[colors_params.current_series].colors.length - 1) {
                            colors_params.current_color = 0;
                        }
                    }
                    if (colors_params.texture == 'simple') {
                        texture.image = basicTexture(color_series[colors_params.current_series].colors, colors_params.current_color);
                    } else {
                        texture.image = gradTexture([[0.75, 0.6, 0.4, 0.25], color_series[colors_params.current_series].colors]);
                    }
                    updateInfo2();
                }

            }
        }

        document.addEventListener('keydown', keyPressed, false);

        requestAnimationFrame(update);

    }
}

document.addEventListener("DOMContentLoaded", function (event) {
    console.log("DOM fully loaded and parsed");
    letsgo();
});