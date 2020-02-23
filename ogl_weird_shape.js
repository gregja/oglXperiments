import {Renderer, Camera, Transform, Texture, Program, Box, Sphere, Mesh, Vec3, Orbit} from './js/ogl/ogl.js';
import {vertex100, fragment100, vertex300, fragment300, render_modes, textures} from "./js/ogl_constants.js";
{
    let info = document.getElementById('info');
    info.innerHTML = "3D object : Weird shape" ;

    let scene, texture;
    let shapes = [];

    let settings = {
        rendering: 'TRIANGLE_STRIP',
        texture: textures[0],
        isSpinning: false
    };

    function shapeGenerator() {
        shapes = [];

        var skeleton = {
            position: [0, -3, 0],
            scale: [2, 5, 2],
            rotation: [0, 0, 0],
            children: [
                {
                    id: "leftwing",
                    position: [0, -1.5, -1],
                    scale: [1, 5, 1],
                    rotation: [0, 90, 0],
                    geometry: 'boxGeometry',
                },
                {
                    id: "rightwing",
                    position: [0, -1.5, -1],
                    scale: [1, 5, 1],
                    rotation: [0, -90, 0],
                    geometry: 'boxGeometry',
                },

                {
                    id: "shpere",
                    position: [0, -.5, -1],
                    scale: [1, 1, 1],
                    rotation: [0, 0, 0],
                    radius: 1.5,
                    geometry: 'sphereGeometry',
                }
            ]
        };

        const geometry = new Box(gl, {width: skeleton.scale[0], height: skeleton.scale[1], depth: skeleton.scale[2]});
        const shape =  new Mesh(gl, {mode: gl[settings.rendering], geometry, program});
        shape.position.set(skeleton.position[0], skeleton.position[1], skeleton.position[2]);
        shape.setParent(scene);
        shapes.push(shape);

        skeleton.children.forEach(config => {
            let geometry;
            if (config.geometry == 'boxGeometry') {
                geometry = new Box(gl, {width: config.scale[0], height: config.scale[1], depth: config.scale[2]});
            } else {
                geometry = new Sphere(gl, {radius: config.radius});
            }
            const shape =  new Mesh(gl, {mode: gl[settings.rendering], geometry, program});
            shape.position.set(config.position[0], config.position[1], config.position[2]);
            shape.rotation.set(config.rotation[0], config.rotation[1], config.rotation[2]);
            shape.setParent(shapes[0]);
        });
    }

    function extract_code(value) {
        let sep = value.split('=');
        return Number(sep[0]);
    }

    function extract_value(value) {
        let sep = value.split('=');
        return sep[1];
    }

    const renderer = new Renderer({dpr: 2});
    const gl = renderer.gl;
    document.body.appendChild(gl.canvas);
    gl.clearColor(1, 1, 1, 1);

    let camera = new Camera(gl);
    camera.position.set(0, -24, -1);

    let controls = new Orbit(camera, {
        target: new Vec3(0, 0.2, 0),
    });

    function resize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.perspective({aspect: gl.canvas.width / gl.canvas.height});
    }
    window.addEventListener('resize', resize, false);
    resize();

    scene = new Transform();
    texture = new Texture(gl);

    if (extract_code(settings.texture) != 0) {
        const img = new Image();
        img.onload = () => texture.image = img;
        img.src = 'assets/' + extract_value(settings.texture);
    }

    const program = new Program(gl, {
        vertex: renderer.isWebgl2 ? vertex300 : vertex100,
        fragment: renderer.isWebgl2 ? fragment300 : fragment100,
        uniforms: {
            tMap: {value: texture},
        },
        cullFace: null,
    });

    shapeGenerator();

    let capture = false;

    let save_btn = document.getElementById('save_btn');
    save_btn.addEventListener('click', (evt)=>{
        capture = true;
    }, false);

    function update() {
        requestAnimationFrame(update);
        controls.update();

        if (settings.isSpinning) {
            shapes[0].rotation.y -= 0.01;
            shapes[0].rotation.x += 0.01;
            shapes[0].rotation.z += 0.01;
        }

        renderer.render({scene, camera});

        if (capture) {
            capture = false;
            let snapshot = document.getElementById('snapshot');
            snapshot.width = gl.canvas.width;
            snapshot.height = gl.canvas.height;
            let vctx = snapshot.getContext('2d');
            vctx.drawImage(gl.canvas, 0, 0, gl.canvas.width, gl.canvas.height);
            let data = snapshot.toDataURL("image/png", 1);
            let save_link = document.getElementById('save_link');
            save_link.setAttribute('href', data);
            save_link.click();
        }
    }

    function addGui(obj) {
        let gui = new dat.gui.GUI();

        let guiRndrMode = gui.add(obj, 'rendering', render_modes, obj.rendering).listen();  // none by default
        guiRndrMode.onChange(function(value){
            obj.rendering = value;
            scene = new Transform();
            shapeGenerator();
        });

        let guiTexture = gui.add(obj, 'texture', textures, obj.texture).listen();  // none by default
        guiTexture.onChange(function(value){
            if (obj.texture != null) {
                obj.texture = value;
                if (extract_code(obj.texture) != 0) {
                    const img = new Image();
                    img.onload = () => texture.image = img;
                    img.src = 'assets/' + extract_value(obj.texture);
                    program.uniforms.tMap = {value: texture};
                } else {
                    texture = new Texture(gl);
                    program.uniforms.tMap = {value: texture};
                }
            }
        });

        let gui_spinning = gui.add(obj, 'isSpinning').listen();
        gui_spinning.onChange(function(value){
            obj.isSpinning = Boolean(value);
        });

    }

    document.addEventListener("DOMContentLoaded", function (event) {
        console.log("DOM fully loaded and parsed");
        addGui(settings);
        requestAnimationFrame(update);
    });
}
