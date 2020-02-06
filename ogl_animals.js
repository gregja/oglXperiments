import {Renderer, Camera, Transform, Texture, Program, Geometry, Mesh, Vec3, Orbit} from './js/ogl/ogl.js';

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

    var shape_params = {};

    var current_morphing = 0;
    var max_morphing = -1;    // number of morphing vertices (calculated after loading)

    // path for local environment
    var path = "assets/";

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

    // let render_modes = ['LINES',  'LINE_STRIP', 'LINE_LOOP', 'TRIANGLES', 'TRIANGLE_STRIP', 'TRIANGLE_FAN', 'PAN', 'DOLLY_PAN', 'QUADS', 'QUAD_STRIP'];
    let render_modes = ['LINES',  'LINE_STRIP', 'TRIANGLES', 'TRIANGLE_STRIP', 'TRIANGLE_FAN'];

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
        name: '8 cubes linked',
        isSpinning: false,
    };

    let jquery_used = false;

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
        let _vertices = [];
        let size = vertices.length;
        let offset = 0;
        while (offset < size) {
            let vertice = {};
            vertice['x'] = vertices[offset++];
            vertice['y'] = vertices[offset++];
            vertice['z'] = vertices[offset++];
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

            //offset++;
            for (var i = 0; i < 5; i++) offset++;
            //offset++;

            _faces.push(face);
        }
        return _faces;
    }

    function generateGraph() {
        let xportMesh = [];

            let obj3d = generateShape(shape_params);
            let div = 10;
            obj3d.polygons.forEach(poly => {
                console.log(poly);
                poly.forEach(item => {
                    let point = obj3d.points[item];
                    xportMesh.push(point.x / div);
                    xportMesh.push(point.y / div);
                    xportMesh.push(point.z / div);
                });
            });


        const renderer = new Renderer({dpr: 2});
        const gl = renderer.gl;
        document.body.appendChild(gl.canvas);
        gl.clearColor(1, 1, 1, 1);

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

        let geometry = new Geometry(gl, {
            position: {size: 3, data: new Float32Array(xportMesh)}
        });

        let mesh = new Mesh(gl, {mode: gl[settings.rendering], geometry, program});
        mesh.setParent(scene);
    }

    var capture = false;

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

        var guiRndrMode = gui.add(obj, 'rendering', render_modes, obj.rendering).listen();  // none by default
        guiRndrMode.onChange(function(value){
            obj.rendering = value;
            scene = new Transform();
            mesh = new Mesh(gl, {mode: gl[value], geometry, program});
            mesh.setParent(scene);
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

        let gui_spinning = gui.add(obj, 'isSpinning').listen();
        gui_spinning.onChange(function(value){
            obj.isSpinning = Boolean(value);
        });

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
        var myInit = {
            method: 'GET',
            headers: myHeaders,
            mode: 'no-cors',
            type: 'text',
            cache: 'default'
        };

        var myRequest = new Request(url, myInit);

        fetch(myRequest, myInit).then(response => {
            if (response.ok) {
                response.text().then(function (content) {
                    const datas = JSON.parse(content);
                    console.log(datas.vertices.length);
                    console.log(datas.faces.length);

                    let points = makeVertices(datas.vertices);
                    let morphings = datas.morphTargets.map(item => makeVertices(item.vertices));
                    max_morphing = morphings.length;
                    let polygons = makeFaces(datas.faces);

                    shape_params = {points: points, polygons: polygons, morphings: morphings};

                    onload();
                });
            } else {
                console.error('server githack response : ' + response.status);
            }
        }).catch(err => {
            console.error(err);
        });
    }

    document.addEventListener("DOMContentLoaded", function (event) {
        console.log("DOM fully loaded and parsed");

        let json_path = list_shapes[0].path;
        loadOBJ(json_path, 1, () => {
            generateGraph();
            addGui(settings);
            requestAnimationFrame(update);
        });

    });
}
