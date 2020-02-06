import {Renderer, Camera, Transform, Texture, Program, Geometry, Mesh, Vec3, Orbit} from './js/ogl/ogl.js';

{

    let info = document.getElementById('info');

    var list_shapes = ['cube', 'diamond', 'dodecahedron', 'gem', 'humanoid', 'icosahedron', 'icosphere',
        'magnolia', 'shuttle', 'skyscraper', 'hand', 'hand2',
        'teapot', 'tetrahedron', 'toroid', 'torusknot', 'twistedtorus', 'head'];
    var current_shape = list_shapes[0];

    let render_modes = ['LINES',  'LINE_STRIP', 'TRIANGLES', 'TRIANGLE_STRIP', 'TRIANGLE_FAN'];

    let divider = 500;  // divider to adapt shapes to the WebGL space coordinates
    let geometry, mesh; // global variables to access in different contexts

    // textures from : https://unsplash.com/collections/1417675/google-pixel-textures-collection
    let textures = [
        '0=None',
        '1=bia-andrade-PO8Woh4YBD8-unsplash.jpg',
        '2=ferdinand-stohr-NFs6dRTBgaM-unsplash.jpg',
        '3=evan-provan-V9A-_QKLElg-unsplash.jpg',
        '4=steve-johnson-5Oe8KFH5998-unsplash.jpg'
    ];

    let settings = {
        rendering: 'TRIANGLE_STRIP',
        texture: textures[0],
        name: current_shape,
        isSpinning: false
    };

    function shapeGenerator(value, rendering) {
        info.innerHTML = "3D object : " + value;

        let newshape = shapes3dToolbox.import3dObjAsync ({
            url: "./assets/"+settings.name+".obj.txt",
            scaleTo: 200,
            reorder: false,
            center: true
        }, function(newshape){
            let xportMesh = [];
            /*
            obj3d.polygons.forEach((vertices, idx) => {
                let shape = [];
                vertices.forEach(item => {
                    shape.push(obj3d.points[item]);
                });
            });
            */
            console.log(newshape);
            newshape.polygons.forEach(polygons => {

                polygons.forEach(poly => {
                    let point = newshape.points[poly];
                    xportMesh.push(point.x/divider);
                    xportMesh.push((point.y+100)/divider);
                    xportMesh.push(point.z/divider);
                })
            });
//console.log(xportMesh);
            geometry = new Geometry(gl, {
                position: {size: 3, data: new Float32Array(xportMesh)}
            });
            scene = new Transform();
            mesh = new Mesh(gl, {mode: gl[rendering], geometry, program});
            mesh.setParent(scene);

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

    shapeGenerator(settings.name, settings.rendering);

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

        // Choose from accepted values
        let guiSurfList = gui.add(obj, 'name', list_shapes).listen();
        guiSurfList.onChange(function(value){
            shapeGenerator(value, obj.rendering);
        });

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
