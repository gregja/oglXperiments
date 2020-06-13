import {Renderer, Camera, Transform, Texture, Program, Geometry, Mesh, Box, Sphere, Vec3, Orbit} from '../js/ogl/ogl.js';
import {vertex100, fragment100, vertex300, fragment300, render_modes_extended, textures_extended as textures,
    gradTexture, textures_predefined} from "../js/ogl_constants.js";
import {ConvertMeshToCSG} from "../js/csg_tools.js";
{

    let info = document.getElementById('info');

    parametricalSurfaces.loadInternalShapes();
    let current_shape = parametricalSurfaces.setSurface(parametricalSurfaces.getRndItemFromList());
    let surface_listing = parametricalSurfaces.getList();
    info.innerHTML = current_shape.name;

    var ref = {
        stl_button: document.getElementById("generate-stl"),
        stl_export_link: document.getElementById("generate-stl-link"),
    };

    let generator_modes = ['0=Quad', '1=Triangle (1/2)', '2=Triangle (2/2)']; //(0=quad ; 1=triangle, draw one facet by two; 2=triangle, draw all facets)

    let settings = {
        rendering: 'TRIANGLE_STRIP',
        gen_mode: generator_modes[0],
        texture: textures[0],
        name: current_shape.name,
        isSpinning: false,
        backgroundColor: [0, 0, 0, 1]
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
//    gl.clearColor(1, 1, 1, 1);
    gl.clearColor(...settings.backgroundColor);

    var camera = new Camera(gl);
    camera.position.set(2, 1, 0);

    var controls = new Orbit(camera, {
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

    function loadTexture(param) {
        if (extract_code(param) != 0) {
            texture = new Texture(gl);
            console.log(param);
            if (param.substr(-4) != '.png') {
                console.log('xxx');
                texture.image = gradTexture([[0.75, 0.6, 0.4, 0.25], textures_predefined.palette01.colors]); // eval('param');
            } else {
                const img = new Image();
                img.onload = () => texture.image = img;
                img.src = '../assets/' + extract_value(param);
            }

        } else {
            texture = new Texture(gl);
        }
    }
    loadTexture(settings.texture);

    /*
    if (extract_code(settings.texture) != 0) {
        const img = new Image();
        img.onload = () => texture.image = img;
        img.src = '../assets/' + extract_value(settings.texture);
    }
     */
    const program = new Program(gl, {
        vertex: renderer.isWebgl2 ? vertex300 : vertex100,
        fragment: renderer.isWebgl2 ? fragment300 : fragment100,
        uniforms: {
            tMap: {value: texture},
        },
        cullFace: null,
    });

    let shape3d = parametricalSurfaces.curvesInMesh(extract_code(settings.gen_mode));
    let xportMesh = [];
    let geometry, mesh;

    shapeGenerator(settings, shape3d);

    var capture = false;

    let save_btn = document.getElementById('save_btn');
    save_btn.addEventListener('click', (evt)=>{
        capture = true;
    }, false);

    ref.stl_button.addEventListener('click', (evt)=>{
        ConvertMeshToCSG(shape3d, 10, true, ref.stl_export_link, 'stl', "parametricSurface" )
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

    function shapeGenerator(obj, shape3d) {
        scene = new Transform();
        let divider = 5;
        let rendering = obj.rendering;

        if (rendering == 'BALLS' || rendering == 'BOXES' || rendering == 'BALLS_TRIANGLE_STRIP' || rendering == 'BOXES_TRIANGLE_STRIP') {
            let tmpGeometry;
            if (obj.rendering == 'BALLS' || rendering == 'BALLS_TRIANGLE_STRIP') {
                tmpGeometry = new Sphere(gl, {radius: 0.2, widthSegments:32, heightSegments:32});
            } else {
                tmpGeometry = new Box(gl, {width: 0.2, height:0.2, depth:0.2});
            }
            //const sphereGeometry = new Sphere(gl, {radius: 0.2, widthSegments:32, heightSegments:32});
            shape3d.polygons.forEach(polygons => {
                polygons.forEach(poly => {
                    let point = shape3d.points[poly];
                    const sphere = new Mesh(gl, { geometry: tmpGeometry, program });
                    sphere.position.set(point.x/divider, point.y/divider, point.z/divider);
                    sphere.scale.set(point.x/divider, point.y/divider, point.z/divider);
                    sphere.setParent(scene);
                })
            });
            if (rendering != 'BALLS_TRIANGLE_STRIP' && rendering != 'BOXES_TRIANGLE_STRIP') {
                return;
            } else {
                rendering = 'TRIANGLE_STRIP';
            }
        }

        xportMesh = [];
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
        mesh = new Mesh(gl, {mode: gl[rendering], geometry, program});
        mesh.setParent(scene);
    }

    function addGui(obj) {
        let gui = new dat.gui.GUI();

        // Choose from accepted values
        var guiSurfList = gui.add(obj, 'name', surface_listing).listen();
        guiSurfList.onChange(function(value){
            current_shape = parametricalSurfaces.setSurface(value);
            info.innerHTML = current_shape.name;
            shape3d = parametricalSurfaces.curvesInMesh(extract_code(obj.gen_mode));
            shapeGenerator(obj, shape3d);
        });

        var guiRndrMode = gui.add(obj, 'rendering', render_modes_extended, obj.rendering).listen();  // none by default
        guiRndrMode.onChange(function(value){
            obj.rendering = value;
            //mesh = new Mesh(gl, {mode: gl[value], geometry, program});
            //mesh.setParent(scene);
            shapeGenerator(obj, shape3d);
        });

        var guiTexture = gui.add(obj, 'texture', textures, obj.texture).listen();  // none by default
        guiTexture.onChange(function(value){
            if (obj.texture != null) {
                obj.texture = value;
                loadTexture(obj.texture);
                program.uniforms.tMap = {value: texture};
            }
        });

        var guiGenMode = gui.add(obj, 'gen_mode', generator_modes, obj.gen_mode).listen();  // none by default
        guiGenMode.onChange(function(value){
            obj.gen_mode = value;
            let shape3d = parametricalSurfaces.curvesInMesh(extract_code(obj.gen_mode));
            shapeGenerator(obj, shape3d);
        });


        let gui_spinning = gui.add(obj, 'isSpinning').listen();
        gui_spinning.onChange(function(value){
            obj.isSpinning = Boolean(value);
        });

        let gui_backgcol = gui.addColor(obj, 'backgroundColor').listen();
        gui_backgcol.onChange(function(value){
            console.log(value);
             obj.backgroundColor = value.map(val => Math.floor(val)/255);

             console.log(obj.backgroundColor, settings.backgroundColor);

            gl.clearColor(obj.backgroundColor[0], obj.backgroundColor[1], obj.backgroundColor[2], obj.backgroundColor[3]);
            gl.clear(gl.COLOR_BUFFER_BIT);
        //    gl.clearColor(0, 1, 0, 1);
         //   gl.clearColor(...settings.backgroundColor);
        });
    }

    document.addEventListener("DOMContentLoaded", function (event) {
        console.log("DOM fully loaded and parsed");
        addGui(settings);
        requestAnimationFrame(update);
    });
}
