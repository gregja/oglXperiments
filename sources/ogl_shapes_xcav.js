import {Renderer, Camera, Transform, Texture, Program, Geometry, Mesh, Vec3, Orbit} from '../js/ogl/ogl.js';
import {vertex100, fragment100, vertex300, fragment300, render_modes, textures} from "../js/ogl_constants.js";
{

    let info = document.getElementById('info');

    let list_shapes = shapes3dToolbox.getGeneratorsList2();
    let shapes3DList = [];
    list_shapes.forEach((item, id) => {
        shapes3DList.push(item.name);
    });

    let current_shape = list_shapes[shapes3dToolbox.getRandomInt(list_shapes.length)];
    let effect = shapes3dToolbox.excavateShape;

    let divider = 500;  // divider to adapt shapes to the WebGL space coordinates
    let geometry, mesh; // global variables to access in different contexts

    let thickness_modes = [1, 2, 4, 8, 10, 12, 16];
    let edge_modes = [1, 2, 3];

    let settings = {
        rendering: 'TRIANGLE_STRIP',
        texture: textures[0],
        name: current_shape.name,
        isSpinning: false,
        edgeMode: edge_modes[2],   // best rendering with that mode
        thickness : thickness_modes[3]
    };

    function shapeGenerator() {
        info.innerHTML = "3D object : " + settings.name;
        let current_shape = shapes3dToolbox.getShapeByName(settings.name);
        let shape3dTemp = eval(`shapes3dToolbox.${current_shape.fn}(current_shape.default)`);

        let shape3d = effect(shape3dTemp, {bridge_mode: settings.edgeMode, thickness_ratio: settings.thickness});

        let xportMesh = [];

        shape3d.polygons.forEach(polygons => {
            polygons.forEach(poly => {
                let point = shape3d.points[poly];
                xportMesh.push(point.x/divider);
                xportMesh.push(point.y/divider);
                xportMesh.push(point.z/divider);
            })
        });

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

    shapeGenerator();

    let capture = false;

    let save_btn = document.getElementById('save_btn');
    save_btn.addEventListener('click', (evt)=>{
        capture = true;
    }, false);

    function update() {

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

        requestAnimationFrame(update);
    }

    function addGui(obj) {
        let gui = new dat.gui.GUI();

        // Choose from accepted values
        let guiSurfList = gui.add(obj, 'name', shapes3DList, obj.name).listen();
        guiSurfList.onChange(function(value){
            console.log('mouchard ', value);
            obj.name = value;
            shapeGenerator();
        });

        let guiRndrMode = gui.add(obj, 'rendering', render_modes, obj.rendering).listen();
        guiRndrMode.onChange(function(value){
            obj.rendering = value;
            scene = new Transform();
            let mesh = new Mesh(gl, {mode: gl[value], geometry, program});
            mesh.setParent(scene);
        });

        let guiTexture = gui.add(obj, 'texture', textures, obj.texture).listen();
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

        let guiThickness = gui.add(obj, 'thickness', thickness_modes, obj.thickness).listen();
        guiThickness.onChange(function(value){
            if (obj.thickness != null) {
                obj.thickness = value;

                // TODO : à compléter
                scene = new Transform();
                mesh = new Mesh(gl, {mode: gl[value], geometry, program});
                mesh.setParent(scene);

                shapeGenerator();
            }
        });

        let guiEdgemode = gui.add(obj, 'edgeMode', edge_modes, obj.edgeMode).listen();
        guiEdgemode.onChange(function(value){
            if (obj.edgeMode != null) {
                obj.edgeMode = value;

                // TODO : à compléter
                scene = new Transform();
                mesh = new Mesh(gl, {mode: gl[value], geometry, program});
                mesh.setParent(scene);

                shapeGenerator();
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
