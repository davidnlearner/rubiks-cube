import '../css/Cube.css'
import { useEffect, useRef, useState } from 'react';

import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

function Cube() {

    //const [rotatingFace, setRotatingFace] = useState(null);
    const mount = useRef(null);
    const controls = useRef(null);

    const rotatingFace = useRef(null);

    useEffect(() => {
        let width = mount.current.clientWidth;
        let height = mount.current.clientHeight;
        let frameId;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);

        const geometry = new THREE.BoxGeometry(1, 1, 1);

        console.log(geometry.faces)

        const material = new THREE.MeshLambertMaterial({ color: 0x5555ff, vertexColors: THREE.FaceColors });

        const controls = new OrbitControls(camera, renderer.domElement);

        camera.position.x = 1;
        camera.position.y = 1;
        camera.position.z = 8;

        controls.update();

        //Light
        const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
        const hemisphereLight = new THREE.HemisphereLight(0x404040); // soft white light
        hemisphereLight.position.y = -10;
        const pointLight = new THREE.PointLight(0x404040, 1, 100);
        pointLight.position.set(50, 50, 50);

        scene.add(ambientLight, hemisphereLight, pointLight);


        //Array and group of all cubes in rubiks cube
        let cubes = [];

        //Group variable instances
        const group = new THREE.Group();
        const fullCube = new THREE.Group();

        scene.add(fullCube, group)

        //Creating cube objects
        for (let row = -1.1; row <= 1.1; row += 1.1) {
            for (let col = -1.1; col <= 1.1; col += 1.1) {
                for (let aisle = -1.1; aisle <= 1.1; aisle += 1.1) {
                    const cube = new THREE.Mesh(geometry, material);

                    //cube.geometry.faces[4].color.setHex(0x00ffff);

                    scene.add(cube);
                    cube.position.x = col;
                    cube.position.y = row;
                    cube.position.z = aisle;

                    cubes.push(cube)
                    fullCube.add(cube)
                }
            }
        }


        const renderScene = () => {
            renderer.render(scene, camera);
        }

        const handleResize = () => {
            width = mount.current.clientWidth;
            height = mount.current.clientHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderScene();
        }

        const animate = () => {
            frameId = window.requestAnimationFrame(animate);

            if (rotatingFace.current) {
                rotate(rotatingFace.current);
            }

            controls.update();
            renderer.render(scene, camera);

            renderScene();
        }

        const rotate = (selectedFace) => {
            if (selectedFace.group.rotation[selectedFace.axis] < Math.PI / 2) {
                selectedFace.group.rotation[selectedFace.axis] += 0.01;
            } else {
                rotatingFace.current = null;
                //group.remove(...group.children)
                const groupChildren = [...group.children]
                groupChildren.forEach(cube => {
                    fullCube.add(cube)
                });

                group.rotation[selectedFace.axis] = 0;
            }

        }

        mount.current.appendChild(renderer.domElement);  // adding renderer domElement
        window.addEventListener('resize', handleResize);

        //controls.current = { rotate };

        window.addEventListener("keydown", (e) => {
            if (e.key === "w") {
                rotateEvent({ level: 1.1, posAxis: 'z', rotationalAxis: 'z' })
            } else if (e.key === "a") {
                rotateEvent({ level: 1.1, posAxis: 'y', rotationalAxis: 'y' })
            } else if (e.key === "s") {
                rotateEvent({ level: 1.1, posAxis: 'x', rotationalAxis: 'x' })
            } else if (e.key === "d") {
                rotateEvent({ level: -1.1, posAxis: 'z', rotationalAxis: 'z' })
            }
        })

        const rotateEvent = (directions) => {
            if (rotatingFace.current === null) {
                cubes.forEach(cube => {
                    if (cube.position[directions.posAxis] === directions.level) {
                        group.add(cube)
                    }
                });
                rotatingFace.current = { group: group, axis: directions.rotationalAxis };
            }
        }

        animate();
    }, [])

    return (
        <div className="canvasWrapper" ref={mount} />
    );
}

export default Cube;
