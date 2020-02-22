import {Renderer, Camera, Transform, Texture, Program, Geometry, Mesh, Vec3, Orbit} from './js/ogl/ogl.js';
import {vertex100, fragment100, vertex300, fragment300, render_modes, textures} from "./js/ogl_constants.js";
{
    const DEG_TO_RAD = Math.PI / 180;
    const degToRad = angle => angle * DEG_TO_RAD;

    let info = document.getElementById('info');
    info.innerHTML = "3D object : Weird sphere" ;

    let geometry, mesh; // global variables to access in different contexts

    // examples for ures & vres : (4, 20) or (30, 30) or (6, 6)
    let settings = {
        rendering: 'TRIANGLE_STRIP',
        texture: textures[0],
        isSpinning: false,
        maxTriangles: 20,
        depth: 50,
        tiltAngle: 5,
        deviationX: 180,
        deviationY: 180
    };

    function shapeGenerator() {
        let xportMesh = shapes3dToolbox.ribbon(settings);

        geometry = new Geometry(gl, {
            position: {size: 3, data: new Float32Array(xportMesh)}
        });
        scene = new Transform();
        mesh = new Mesh(gl, {mode: gl[settings.rendering], geometry, program});
        mesh.setParent(scene);
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
    camera.position.set(2, 1, 0);

    let controls = new Orbit(camera, {
        target: new Vec3(0, 0.2, 0),
    });

    function resize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.perspective({aspect: gl.canvas.width / gl.canvas.height});
    }
    window.addEventListener('resize', resize, false);
    resize();

    let scene = new Transform();
    let texture = new Texture(gl);

    if (settings.texture != null) {
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
            mesh.rotation.y -= 0.01;
            mesh.rotation.x += 0.01;
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

        let guimaxTriangles = gui.add(obj, 'maxTriangles').min(1).max(200).step(1).listen();
        guimaxTriangles.onChange(function(value){
            obj.maxTriangles = Number(value);
            shapeGenerator();
        });

        let guiDepth = gui.add(obj, 'depth').min(1).max(200).step(1).listen();
        guiDepth.onChange(function(value){
            obj.depth = Number(value);
            shapeGenerator();
        });

        let guiTiltAngle = gui.add(obj, 'tiltAngle').min(1).max(90).step(1).listen();
        guiTiltAngle.onChange(function(value){
            obj.tiltAngle = Number(value);
            shapeGenerator();
        });

        let guiDeviationX = gui.add(obj, 'deviationX').min(0).max(360).step(10).listen();
        guiDeviationX.onChange(function(value){
            obj.deviationX = Number(value);
            shapeGenerator();
        });

        let guiDeviationY = gui.add(obj, 'deviationY').min(0).max(360).step(10).listen();
        guiDeviationY.onChange(function(value){
            obj.deviationY = Number(value);
            shapeGenerator();
        });

        let guiRndrMode = gui.add(obj, 'rendering', render_modes, obj.rendering).listen();  // none by default
        guiRndrMode.onChange(function(value){
            obj.rendering = value;
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
