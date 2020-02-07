import {Renderer, Camera, Transform, Texture, Program, Geometry, Mesh, Vec3, Orbit} from './js/ogl/ogl.js';

{

    let info = document.getElementById('info');

    let shape_params = {};

    let current_morphing = 0;
    let max_morphing = -1;    // number of morphing vertices (calculated after loading)

    // path for local environment
    let path = "assets/";

    let jquery_used = false;

    let scene, mesh, texture, renderer, program, controls, gl, camera, geometry;

    // json files of the meshes :
    const list_shapes = [
        {
            name: "wolf",
            path: path+"wolf.json"
        },
        {
            name: "elk",
            path: path+"elk.json"
        },
        {
            name: "fox",
            path: path+"fox.json"
        },
        /*  TODO : json file for horse not compatible, adapt it later
        {
            name: "horse",
            path: path+"horse.json"
        },*/
    ];

    let render_modes = ['LINES',  'LINE_STRIP', 'TRIANGLES', 'TRIANGLE_STRIP', 'TRIANGLE_FAN'];

    // textures from : https://unsplash.com/collections/1417675/google-pixel-textures-collection
    let textures = [
        '0=None',
        '1=bia-andrade-PO8Woh4YBD8-unsplash.jpg',
        '2=ferdinand-stohr-NFs6dRTBgaM-unsplash.jpg',
        '3=evan-provan-V9A-_QKLElg-unsplash.jpg',
        '4=steve-johnson-5Oe8KFH5998-unsplash.jpg'
    ];

    let speeds = ['slow', 'quick'];
    let settings = {
        animal: list_shapes[0].name,
        rendering: 'TRIANGLES',
        texture: textures[0],
        name: '8 cubes linked',
        isSpinning: false,
        isRunning: false,
        speed: "slow"
    };

    let previous_isRunning = false; // used to detect a modification of the status during an animation frame

    /**
     * Load JSON file
     * @param url
     * @param scale
     * @param onload
     */
    function loadOBJ(url, scale = 1, onload) {
        if (jquery_used) {
            loadjQuery(url, scale = 1, onload);
        } else {
            loadFetch(url, scale = 1, onload);
        }
    }

    function extract_code(value) {
        let sep = value.split('=');
        return Number(sep[0]);
    }

    function extract_value(value) {
        let sep = value.split('=');
        return sep[1];
    }

    /**
     * Generate vertices from JSON file
     * @param vertices
     * @returns {Array}
     */
    function makeVertices(vertices) {
        let divider = 10;
        let _vertices = [];
        let size = vertices.length;
        let offset = 0;
        let ytranslate = 50;  // for better positioning in the frame
        while (offset < size) {
            let vertice = {};
            vertice['x'] = vertices[offset++]/divider;
            vertice['y'] = (vertices[offset++]-ytranslate)/divider;
            vertice['z'] = vertices[offset++]/divider;
            _vertices.push(vertice);
        }
        return _vertices;
    }

    /**
     * Generate faces from JSON file
     * @param faces
     * @returns {Array}
     */
    function makeFaces(faces) {
        let _faces = [];
        let size = faces.length;
        let offset = 0;
        while (offset < size) {
            let type = faces[offset++];
            let face = [];
            face[0] = faces[offset++];
            face[1] = faces[offset++];
            face[2] = faces[offset++];

            //offset++;  // offset to jump for optimal rendering with TRIANGLES mode
            for (let i = 0; i < 5; i++) offset++;
            //offset++;  // offset to jump for optimal rendering with TRIANGLES mode

            _faces.push(face);
        }
        return _faces;
    }

    function prepareGraph() {
        renderer = new Renderer({dpr: 2});
        gl = renderer.gl;
        document.body.appendChild(gl.canvas);
        gl.clearColor(1, 1, 1, 1);

        camera = new Camera(gl);
        camera.position.set(2, 1, 0);

        controls = new Orbit(camera, {
            target: new Vec3(0, 0.2, 0),
        });

        function resize() {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.perspective({aspect: gl.canvas.width / gl.canvas.height});
        }

        window.addEventListener('resize', resize, false);
        resize();

        texture = new Texture(gl);

        if (extract_code(settings.texture) != 0) {
            const img = new Image();
            img.onload = () => texture.image = img;
            img.src = 'assets/' + extract_value(settings.texture);
        }

        program = new Program(gl, {
            vertex: renderer.isWebgl2 ? vertex300 : vertex100,
            fragment: renderer.isWebgl2 ? fragment300 : fragment100,
            uniforms: {
                tMap: {value: texture},
            },
            cullFace: null,
        });
    }

    function generateGraph() {
        let xportMesh = [];

        let divider = 10;

        if (current_morphing != -1) {
            let points = shape_params.morphings[current_morphing];
            shape_params.points = points;
        }

        let obj3d = shape_params;

        obj3d.polygons.forEach(poly => {
            poly.forEach(item => {
                if (obj3d.points != undefined) {
                    let point = obj3d.points[item];
                    xportMesh.push(point.x / divider);
                    xportMesh.push(point.y / divider);
                    xportMesh.push(point.z / divider);
                }
            });
        });

        geometry = new Geometry(gl, {
            position: {size: 3, data: new Float32Array(xportMesh)}
        });

        scene = new Transform();
        mesh = new Mesh(gl, {mode: gl[settings.rendering], geometry, program});
        mesh.setParent(scene);
    }

    let capture = false;

    let save_btn = document.getElementById('save_btn');
    save_btn.addEventListener('click', (evt)=>{
        capture = true;
    }, false);

    let handle_animation ;

    function startAnimation() {
        let timeout = 100;
        if (settings.speed == 'quick') {
            timeout = 50;
        }
        handle_animation = setInterval(() => {
            current_morphing++;
            if (current_morphing >= max_morphing) {
                current_morphing = 0;
            }
            generateGraph();
        }, timeout);
    }

    function stopAnimation() {
        clearInterval(handle_animation);
    }

    function update() {
        requestAnimationFrame(update);
        controls.update();
        if (settings.isSpinning) {
            mesh.rotation.y -= 0.01;
            mesh.rotation.x += 0.01;
        }

        if (settings.isRunning != previous_isRunning) {
            // load a new set of vertices (fixed or from morphing depending of the context)
            previous_isRunning = settings.isRunning;
            if (settings.isRunning) {
                current_morphing = 0;
                startAnimation();
            } else {
                current_morphing = -1;
                stopAnimation();
            }
            generateGraph();
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

        let list_animals = list_shapes.map(item => item.name);
        let guiAnimal = gui.add(obj, 'animal', list_animals, obj.animal).listen();
        guiAnimal.onChange(function(value){
            obj.animal = value;

            let index = list_animals.indexOf(value);
            let json_path = list_shapes[index].path;
            loadOBJ(json_path, 1, () => {
                generateGraph();
                requestAnimationFrame(update);
            });
        });

        let guiRndrMode = gui.add(obj, 'rendering', render_modes, obj.rendering).listen();
        guiRndrMode.onChange(function(value){
            obj.rendering = value;
            scene = new Transform();
            mesh = new Mesh(gl, {mode: gl[value], geometry, program});
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

        let gui_running = gui.add(obj, 'isRunning').listen();
        gui_running.onChange(function(value){
            obj.isRunning = Boolean(value);
        });

        let guiSpeed = gui.add(obj, 'speed', speeds, obj.speed).listen();
        guiSpeed.onChange(function(value){
            obj.speed = value;
            if (obj.isRunning) {
                stopAnimation();
                startAnimation();
            }
        });

    }

    /**
     * Load JSON file
     * @param url
     * @param scale
     * @param onload
     */
    function loadjQuery(url, scale = 1, onload) {

        jQuery.ajax({
            url: url
        }).done(function (datas) {
            let points = makeVertices(datas.vertices);
            let morphings = datas.morphTargets.map(item => makeVertices(item.vertices));
            max_morphing = morphings.length;
            let polygons = makeFaces(datas.faces);

            shape_params = {points: points, polygons: polygons, morphings: morphings};

            onload();
        });

    }

    /**
     * This function works locally, but don't work on Codepen, so I replaced it by the loadObj function using jQuery
     * @param url
     * @param scale
     * @param onload
     */
    function loadFetch(url, scale = 1, onload) {

        let myHeaders = new Headers({
            'Access-Control-Allow-Origin': path,
            'Content-Type': 'text/html'
        });
        let myInit = {
            method: 'GET',
            headers: myHeaders,
            mode: 'no-cors',
            type: 'text',
            cache: 'default'
        };

        let myRequest = new Request(url, myInit);

        fetch(myRequest, myInit).then(response => {
            if (response.ok) {
                response.text().then(function (content) {
                    const datas = JSON.parse(content);
                    //console.log(datas.vertices.length);
                    //console.log(datas.faces.length);

                    let points = makeVertices(datas.vertices);
                    let morphings = datas.morphTargets.map(item => makeVertices(item.vertices));
                    max_morphing = morphings.length;
                    let polygons = makeFaces(datas.faces);

                    shape_params = {points: points, polygons: polygons, morphings: morphings};

                    onload();
                });
            } else {
                console.error('server response : ' + response.status);
            }
        }).catch(err => {
            console.error(err);
        });
    }

    document.addEventListener("DOMContentLoaded", function (event) {
        console.log("DOM fully loaded and parsed");

        let json_path = list_shapes[0].path;
        loadOBJ(json_path, 1, () => {
            prepareGraph();
            generateGraph();
            addGui(settings);
            requestAnimationFrame(update);
        });

    });
}
