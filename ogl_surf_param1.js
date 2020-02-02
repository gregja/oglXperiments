import {Renderer, Camera, Transform, Texture, Program, Geometry, Mesh, Vec3, Orbit} from './js/ogl/index.mjs';

// When we use standard derivatives (dFdx & dFdy functions),
// which are necessary for this effect, WebGL1 requires the
// GL_OES_standard_derivatives extension, and WebGL2 complains
// about the extension's existence. So unfortunately we're
// forced to create a 300 es GLSL shader for WebGL2, and a 100 es
// GLSL shader for WebGL1. There are only slight syntax changes.
const vertex100 = /* glsl */ `
            attribute vec3 position;
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            varying vec4 vMVPos;
            void main() {
                vMVPos = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * vMVPos;
            }
        `;

const fragment100 = /* glsl */ `#extension GL_OES_standard_derivatives : enable
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

const vertex300 = /* glsl */ `#version 300 es
            in vec3 position;
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            out vec4 vMVPos;
            void main() {
                vMVPos = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * vMVPos;
            }
        `;

const fragment300 = /* glsl */ `#version 300 es
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

{

    let info = document.getElementById('info');

    parametricalSurfaces.loadInternalShapes();
    let current_shape = parametricalSurfaces.setSurface(parametricalSurfaces.getRndItemFromList());
    let surface_listing = parametricalSurfaces.getList();
    info.innerHTML = current_shape.name;

    let generator_modes = ['0=Quad', '1=Triangle (1/2)', '2=Triangle (2/2)']; //(0=quad ; 1=triangle, draw one facet by two; 2=triangle, draw all facets)
    // let render_modes = ['LINES',  'LINE_STRIP', 'LINE_LOOP', 'TRIANGLES', 'TRIANGLE_STRIP', 'TRIANGLE_FAN', 'PAN', 'DOLLY_PAN', 'QUADS', 'QUAD_STRIP'];
    let render_modes = ['LINES',  'LINE_STRIP', 'TRIANGLES', 'TRIANGLE_STRIP', 'TRIANGLE_FAN'];

    let settings = {
        default_colorU: "#ff0000", // previous ,"#5743e6"
        default_colorV: "#336699", // previous "#d4541f",
        default_colorMesh: "#000000",
        unused1: true,
        unused2: true,
        rendering: 'TRIANGLE_STRIP',
        gen_mode: generator_modes[0],
        stroke_value: 1,
        isSpinning: true,
        speed: 0.003,
        scale: current_shape.scale,
        init_scale: current_shape.scale,
        name: current_shape.name
    };

    function extract_code(value) {
        let sep = value.split('=');
        return Number(sep[0]);
    }

    let shape3d = parametricalSurfaces.curvesInMesh(extract_code(settings.gen_mode));

    let xportMesh = [];
    shape3d.polygons.forEach(polygons => {
        polygons.forEach(poly => {
            let point = shape3d.points[poly];
            xportMesh.push(point.x);
            xportMesh.push(point.y);
            xportMesh.push(point.z);
        })
    });

    const renderer = new Renderer({dpr: 2});
    const gl = renderer.gl;
    document.body.appendChild(gl.canvas);
    gl.clearColor(1, 1, 1, 1);

//        const camera = new Camera(gl, {fov: -25});
    const camera = new Camera(gl);
    camera.position.set(2, 1, 2);

    const controls = new Orbit(camera, {
        target: new Vec3(0, 0.2, 0),
    });

    function resize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.perspective({aspect: gl.canvas.width / gl.canvas.height});
    }
    window.addEventListener('resize', resize, false);
    resize();

    let scene = new Transform();
    const texture = new Texture(gl);

    /*
    const img = new Image();
    img.onload = () => texture.image = img;
    img.src = 'assets/matcap.jpg';
    */

    const program = new Program(gl, {
        vertex: renderer.isWebgl2 ? vertex300 : vertex100,
        fragment: renderer.isWebgl2 ? fragment300 : fragment100,
        uniforms: {
            tMap: {value: texture},
        },
        cullFace: null,
    });

    let geometry = new Geometry(gl, {
        position: {size: 3, data: new Float32Array(xportMesh)}
    });

    let mesh = new Mesh(gl, {mode: gl[settings.rendering], geometry, program});
    mesh.setParent(scene);

    function update() {
        requestAnimationFrame(update);
        controls.update();
        renderer.render({scene, camera});
    }

    function addGui(obj, surf_list) {
        let gui = new dat.gui.GUI();

        // add 2 temporary options for turn around a bug not understood
        gui.add(obj, 'unused1');
        gui.add(obj, 'unused2');

        // Choose from accepted values
        var guiSurfList = gui.add(obj, 'name', surf_list).listen();
        guiSurfList.onChange(function(value){
            current_shape = parametricalSurfaces.setSurface(value);
            info.innerHTML = current_shape.name;
            shape3d = parametricalSurfaces.curvesInMesh(extract_code(obj.gen_mode));
            xportMesh = [];
            shape3d.polygons.forEach(polygons => {
                polygons.forEach(poly => {
                    let point = shape3d.points[poly];
                    xportMesh.push(point.x);
                    xportMesh.push(point.y);
                    xportMesh.push(point.z);
                })
            });
            geometry = new Geometry(gl, {
                position: {size: 3, data: new Float32Array(xportMesh)}
            });
            scene = new Transform();
            mesh = new Mesh(gl, {mode: gl[obj.rendering], geometry, program});
            mesh.setParent(scene);
        });

        var guiRndrMode = gui.add(obj, 'rendering', render_modes, obj.rendering).listen();  // none by default
        guiRndrMode.onChange(function(value){
            obj.rendering = value;
            scene = new Transform();
            mesh = new Mesh(gl, {mode: gl[value], geometry, program});
            mesh.setParent(scene);
        });

        var libRndrMode = gui.add(obj, 'gen_mode', generator_modes, obj.gen_mode).listen();  // none by default
        libRndrMode.onChange(function(value){
            obj.gen_mode = value;
            let shape3d = parametricalSurfaces.curvesInMesh(extract_code(obj.gen_mode));
            xportMesh = [];
            shape3d.polygons.forEach(polygons => {
                polygons.forEach(poly => {
                    let point = shape3d.points[poly];
                    xportMesh.push(point.x);
                    xportMesh.push(point.y);
                    xportMesh.push(point.z);
                })
            });
            geometry = new Geometry(gl, {
                position: {size: 3, data: new Float32Array(xportMesh)}
            });
            scene = new Transform();
            new Mesh(gl, {mode: gl[obj.rendering], geometry, program});
            mesh = new Mesh(gl, {mode: gl[obj.rendering], geometry, program});
            mesh.setParent(scene);
        });

        //gui.add(obj, 'isSpinning');
        //gui.add(obj, 'stroke_value').min(1).max(5).step(1);
        //gui.add(obj, 'speed').min(0).max(.01).step(.001);
        //gui.add(obj, 'scale').min(1).max(400).step(1);

        /*
        let f1 = gui.addFolder('Colors');
        f1.addColor(obj, 'default_colorU');
        f1.addColor(obj, 'default_colorV');
        f1.addColor(obj, 'default_colorMesh');
        */
    }

    document.addEventListener("DOMContentLoaded", function (event) {
        console.log("DOM fully loaded and parsed");
        addGui(settings, surface_listing);
        requestAnimationFrame(update);
    });
}
