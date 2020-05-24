import { Renderer, Camera, Transform, Program, Mesh, Plane, Sphere, Box, Cylinder, Orbit } from '../js/ogl/ogl.js';

const vertex = /* glsl */ `
            precision highp float;
            precision highp int;
            attribute vec3 position;
            attribute vec3 normal;
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            uniform mat3 normalMatrix;
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

const fragment = /* glsl */ `
            precision highp float;
            precision highp int;
            varying vec3 vNormal;
            void main() {
                vec3 normal = normalize(vNormal);
                float lighting = dot(normal, normalize(vec3(-0.3, 0.8, 0.6)));
                gl_FragColor.rgb = vec3(0.2, 0.8, 1.0) + lighting * 0.1;
                gl_FragColor.a = 1.0;
            }
        `;
{

    let info = document.getElementById('info');
    info.innerHTML = "Leap Motion - draw hands - test 1 (plug your leap motion and reload the page)";

    const renderer = new Renderer({ dpr: 2 });
    const gl = renderer.gl;
    document.body.appendChild(gl.canvas);
    gl.clearColor(1, 1, 1, 1);

    const camera = new Camera(gl, { fov: 35 });
    camera.position.set(0, 0, 7);
///    camera.lookAt([0, 0, 0]);
    const controls = new Orbit(camera);

    function resize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
    }
    window.addEventListener('resize', resize, false);
    resize();

    const scene = new Transform();

    const size_palm = .2;
    const size_finger = .1;
    const size_bone = .05;
    const size_inch = .02;

    //var illo_translate = true;  // flag to apply the translation on illo only once
    var parts = {};
    var boxes = [];

    /*
    function getCoords(leapPoint, frame) {
        let mult = 0;
        if (frame.hasOwnProperty('interactionBox')) {
            // for older version of the leap motion controller
            let iBox = frame.interactionBox;
            let normalizedPoint = iBox.normalizePoint(leapPoint, true);
            mult = 1;
            return {
                x: normalizedPoint[0] * mult,
                y: (1 - normalizedPoint[1]) * mult,
                z: normalizedPoint[2] * mult
            };
        } else {
            // for lastest version of the leap motion controller
            mult = .01;
            return {
                x: leapPoint[0] * mult,
                y: leapPoint[1] * mult - 1,
                z: leapPoint[2] * mult
            };
        }
    }
*/
    function getCoords(leapPoint, frame) {

        // for lastest version of the leap motion controller
        let mult = .01;
        return {
            x: leapPoint[0] * mult,
            y: leapPoint[1] * mult,
            z: leapPoint[2] * mult
        };

    }


    /*
            {
            radius = 0.5,
            widthSegments = 16,
            heightSegments = Math.ceil(widthSegments * 0.5),
            phiStart = 0,
            phiLength = Math.PI * 2,
            thetaStart = 0,
            thetaLength = Math.PI,
            attributes = {},
        }
     */

    /*
    const cylinderGeometry = new Cylinder(gl, {
        radialSegments: 16,
        radiusTop: 0.2,
        radiusBottom: 0.2
    });
    */

    /*
            {
                radiusTop = 0.5,
                radiusBottom = 0.5,
                height = 1,
                radialSegments = 8,
                heightSegments = 1,
                openEnded = false,
                thetaStart = 0,
                thetaLength = Math.PI * 2,
                attributes = {},
            }
     */

    const program = new Program(gl, {
        vertex,
        fragment,

        // Don't cull faces so that plane is double sided - default is gl.BACK
        cullFace: null,
    });


    function leapmotion() {

        const controller = new Leap.Controller();
        controller.connect();

        controller.on('frame', (frame) => {

            let digits = [];

            function generateBox(hand, itemType, x, y, z, width, height, depth) {
                digits.push({hand: hand, type:itemType, width: width, height: height, depth: depth, coords: {x: x, y: y, z: z}});

                let key = hand + '_' + itemType;
                if (!parts.hasOwnProperty(key)) {
//                    const boxGeometry = new Box(gl, {width: width, height: height, depth: depth});
                    const boxGeometry = new Box(gl);
                    let artefact = new Mesh(gl, { geometry: boxGeometry, program });
                    artefact.position.set(x, y, z);
                    artefact.scale.set(width, height, depth);
                    artefact.setParent(scene);
                    parts[key] = artefact;
                }
            }

            // for each hand
            frame.hands.forEach(hand => {

                // for drawing the palm
                let palmPos = getCoords(hand.palmPosition, frame);

                generateBox(hand.type,'palm', palmPos.x, palmPos.y, palmPos.z, size_palm, size_palm, size_palm);

                // For each finger
                hand.fingers.forEach((finger, id) => {

                    let size_item = size_bone;
                    if (id == 0) {
                        size_item = size_inch;
                    }
                    let carpPos = getCoords(finger.carpPosition, frame); // carpal
                    generateBox(hand.type,'carp', carpPos.x, carpPos.y, carpPos.z, size_finger, size_finger, size_finger);

                    let mcpPos = getCoords(finger.mcpPosition, frame); // metacarpal
                    generateBox(hand.type,'mcp', mcpPos.x, mcpPos.y, mcpPos.z, size_item, size_item, size_item);

                    let pipPos = getCoords(finger.pipPosition, frame); // proximal
                    generateBox(hand.type,'pip', pipPos.x, pipPos.y, pipPos.z, size_item, size_item, size_item);

                    let dipPos = getCoords(finger.dipPosition, frame); // intermediate phalange
                    generateBox(hand.type,'dip', dipPos.x, dipPos.y, dipPos.z, size_item, size_item, size_item);

                    let tipPos = getCoords(finger.tipPosition, frame); // distal phalange
                    generateBox(hand.type,'tip', tipPos.x, tipPos.y, tipPos.z, size_item, size_item, size_item);

                });

            });

            boxes.push(digits);

        });

    }

    function draw() {

        let digits = boxes.shift();
        if (digits != null) {
            digits.forEach(item => {
                let key = item.hand + '_' + item.type;
                let artefact = parts[key];
                artefact.position.set(item.coords.x, item.coords.y, item.coords.z);
            });
        }

    }
    /*
    const sphere = new Mesh(gl, { geometry: sphereGeometry, program });
    sphere.position.set(1.3, 0, 0);
    sphere.setParent(scene);

    const cylinder = new Mesh(gl, { geometry: cylinderGeometry, program });
    cylinder.position.set(-1.3, 0, 0);
    cylinder.setParent(scene);
   */


    function animate() {

      //  controls.update();

      //  sphere.rotation.y -= 0.03;
      //  cylinder.rotation.y -= 0.02;

        draw();

        renderer.render({ scene, camera });
        requestAnimationFrame(animate);
    }

    document.addEventListener("DOMContentLoaded", function (event) {
        console.log("DOM fully loaded and parsed");
        leapmotion();
        animate();
       // requestAnimationFrame(update);
    });


}
