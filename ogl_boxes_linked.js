import {Renderer, Camera, Transform, Texture, Program, Geometry, Mesh, Vec3, Orbit} from './js/ogl/ogl.js';
import {vertex100, fragment100, vertex300, fragment300, render_modes, textures} from "./js/ogl_constants.js";
{
    let info = document.getElementById('info');
    info.innerHTML = '8 cubes linked V1';

    var list_shapes = shapes3dToolbox.getEightCubesLinked();
    let effect = shapes3dToolbox.excavateShape;

    let settings = {
        rendering: 'TRIANGLE_FAN',  // best rendering with TRIANGLE_FAN
        texture: textures[0],

    };

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

    function generateMeshes() {
        list_shapes.forEach(shape => {
            let xportMesh = [];
            let generateShape = shapes3dToolbox[shape.fn];
            let shape_params = shape.default;
            let obj3d = generateShape(shape_params);
            let divider = 100;
            obj3d.polygons.forEach(poly => {
                poly.forEach(item => {
                    let point = obj3d.points[item];
                    xportMesh.push(point.x/divider);
                    xportMesh.push(point.y/divider);
                    xportMesh.push(point.z/divider);
                });
            });

            let geometry = new Geometry(gl, {
                position: {size: 3, data: new Float32Array(xportMesh)}
            });

            let mesh = new Mesh(gl, {mode: gl[settings.rendering], geometry, program});
            mesh.setParent(scene);
        });

    }

    generateMeshes();

    var capture = false;

    let save_btn = document.getElementById('save_btn');
    save_btn.addEventListener('click', (evt)=>{
        capture = true;
    }, false);


    function update() {
        requestAnimationFrame(update);
        controls.update();

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

        var guiRndrMode = gui.add(obj, 'rendering', render_modes, obj.rendering).listen();  // none by default
        guiRndrMode.onChange(function(value){
            obj.rendering = value;
            scene = new Transform();
            generateMeshes();
        });

        var guiTexture = gui.add(obj, 'texture', textures, obj.texture).listen();  // none by default
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

    }

    document.addEventListener("DOMContentLoaded", function (event) {
        console.log("DOM fully loaded and parsed");
        addGui(settings);
        requestAnimationFrame(update);
    });
}
