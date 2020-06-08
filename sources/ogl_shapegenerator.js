import {Renderer, Camera, Transform, Texture, Program, Geometry, Mesh, Vec3, Orbit} from '../js/ogl/ogl.js';
import {vertex100, fragment100, vertex300, fragment300, render_modes, textures} from "../js/ogl_constants.js";
import {ConvertMeshToCSG} from "../js/csg_tools.js";
{

    let info = document.getElementById('info');
    info.innerHTML = "3D Shape Generator";

    let ref = {
        stl_button: document.getElementById("generate-stl"),
        stl_export_link: document.getElementById("generate-stl-link"),
    };

    let generateShape = shapes3dToolbox.customShape;
    let shape3d;
    let divider = 100;  // divider to adapt shapes to the WebGL space coordinates
    let geometry, mesh; // global variables to access in different contexts

    let settings = {
        rendering: 'TRIANGLE_STRIP',
        texture: textures[0],
        isSpinning: false,
        count: 5,
        radius: 5,
        twist: 2,
        hcount: 1.5,
        phase: 2,
        hradius: 5
    };

    function shapeGenerator(rendering) {

        let shape_params = {
            count: settings.count,
            radius: settings.radius,
            twist: settings.twist,
            hcount: settings.hcount,
            phase: settings.phase,
            hradius: settings.hradius
        };

        // generate the "top" of the shape only (the algorithm for the "bottom" is not working correctly)
        shape_params.rendrParts = 1;

        shape3d = generateShape(shape_params);

        let xportMesh = [];
        let translation_y = 50;
        shape3d.polygons.forEach(polygons => {
            polygons.forEach(poly => {
                let point = shape3d.points[poly];
                xportMesh.push(point.x/divider);
                xportMesh.push((point.y-translation_y)/divider);
                xportMesh.push(point.z/divider);
            })
        });

        geometry = new Geometry(gl, {
            position: {size: 3, data: new Float32Array(xportMesh)}
        });
        scene = new Transform();
        mesh = new Mesh(gl, {mode: gl[rendering], geometry, program});
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
        let width = window.innerWidth*.8;
        let height = window.innerHeight;
        renderer.setSize(width, height);
        camera.perspective({aspect: width / height});
    }
    window.addEventListener('resize', resize, false);
    resize();

    let scene = new Transform();
    let texture = new Texture(gl);

    if (settings.texture != null) {
        const img = new Image();
        img.onload = () => texture.image = img;
        img.src = '../assets/' + extract_value(settings.texture);
    }

    const program = new Program(gl, {
        vertex: renderer.isWebgl2 ? vertex300 : vertex100,
        fragment: renderer.isWebgl2 ? fragment300 : fragment100,
        uniforms: {
            tMap: {value: texture},
        },
        cullFace: null,
    });

    shapeGenerator(settings.rendering);

    let capture = false;

    let save_btn = document.getElementById('save_btn');
    save_btn.addEventListener('click', (evt)=>{
        capture = true;
    }, false);

    ref.stl_button.addEventListener('click', (evt)=>{

        ConvertMeshToCSG(shape3d, 10, true, ref.stl_export_link, 'stl' )

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

        let guiRndrMode = gui.add(obj, 'rendering', render_modes, obj.rendering).listen();  // none by default
        guiRndrMode.onChange(function(value){
            obj.rendering = value;
            scene = new Transform();
            let mesh = new Mesh(gl, {mode: gl[value], geometry, program});
            mesh.setParent(scene);
        });

        let guiTexture = gui.add(obj, 'texture', textures, obj.texture).listen();  // none by default
        guiTexture.onChange(function(value){
            if (obj.texture != null) {
                obj.texture = value;
                if (extract_code(obj.texture) != 0) {
                    const img = new Image();
                    img.onload = () => texture.image = img;
                    img.src = '../assets/' + extract_value(obj.texture);
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

        let count = gui.add(obj, 'count').min(1).max(100).step(1).listen();
        count.onChange(function(value){
            obj.count = Number(value);
            shapeGenerator(obj.rendering);
        });

        let radius = gui.add(obj, 'radius').min(-10).max(100).step(1).listen();
        radius.onChange(function(value){
            obj.radius = Number(value);
            shapeGenerator(obj.rendering);
        });

        let twist = gui.add(obj, 'twist').min(-2).max(2).step(.1).listen();
        twist.onChange(function(value){
            obj.twist = Number(value);
            shapeGenerator(obj.rendering);
        });

        let hcount = gui.add(obj, 'hcount').min(0).max(2).step(.1).listen();
        hcount.onChange(function(value){
            obj.hcount = Number(value);
            shapeGenerator(obj.rendering);
        });

        let phase = gui.add(obj, 'phase').min(0).max(4).step(1).listen();
        phase.onChange(function(value){
            obj.phase = Number(value);
            shapeGenerator(obj.rendering);
        });

        let hradius = gui.add(obj, 'hradius').min(-10).max(10).step(1).listen();
        hradius.onChange(function(value){
            obj.hradius = Number(value);
            shapeGenerator(obj.rendering);
        });
    }

    document.addEventListener("DOMContentLoaded", function (event) {
        console.log("DOM fully loaded and parsed");
        addGui(settings);
        requestAnimationFrame(update);
    });
}
