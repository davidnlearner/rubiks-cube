import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import "../css/Cube.css";
import cubeData from "../data/cube_data.json";

const colorMap = {
    red: "#B90000",
    blue: "#0045AD",
    orange: "#FF5900",
    yellow: "#FFD500",
    white: "#FFFFFF",
    green: "#009B48",
    black: "#000000",
};

const addFaces = ({ cube, cubeGroup }) => {
    const faces = ["left", "right", "top", "bottom", "front", "back"];

    faces.forEach((face) => {
        const geometry = new THREE.PlaneGeometry(0.95, 0.95);
        const material = new THREE.MeshLambertMaterial({
            color: colorMap[cube[`${face}_color`]],
            side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geometry, material);

        if (face === "front") {
            mesh.position.z += 0.51;
        } else if (face === "back") {
            mesh.position.z -= 0.51;
        } else if (face === "top") {
            mesh.position.y += 0.51;
            mesh.rotation.x = Math.PI / 2;
        } else if (face === "bottom") {
            mesh.position.y -= 0.51;
            mesh.rotation.x = Math.PI / 2;
        } else if (face === "left") {
            mesh.position.x -= 0.51;
            mesh.rotation.y = Math.PI / 2;
        } else if (face === "right") {
            mesh.position.x += 0.51;
            mesh.rotation.y = Math.PI / 2;
        }

        cubeGroup.add(mesh);
    });
};

function Cube() {
    const mount = useRef(null);
    // eslint-disable-next-line no-unused-vars
    const controls = useRef(null);

    const rotatingFace = useRef(null);

    const [cubes, setCubes] = useState([]);

    useEffect(() => {
        let width = mount.current.clientWidth;
        let height = mount.current.clientHeight;
        // eslint-disable-next-line no-unused-vars
        let frameId;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            width / height,
            0.1,
            1000
        );
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.maxDistance = 20;
        controls.minDistance = 5;

        camera.position.x = 5;
        camera.position.y = 4;
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
        let cubeList = [];

        //Group variable instances
        const group = new THREE.Group();
        const fullCube = new THREE.Group();

        scene.add(fullCube, group);

        const material = new THREE.MeshLambertMaterial({ color: 0x000000 });

        //Creating cube objects
        cubeData.forEach((cube) => {
            const cubeGroup = new THREE.Group();
            const mesh = new THREE.Mesh(geometry, material);

            cubeGroup.add(mesh);

            addFaces({ cube, cubeGroup });

            scene.add(cubeGroup);

            cubeGroup.position.x = cube.col;
            cubeGroup.position.y = cube.row;
            cubeGroup.position.z = cube.aisle;

            cubeList.push(cubeGroup);
            fullCube.add(cubeGroup);
        });

        setCubes(cubeList);

        const renderScene = () => {
            renderer.render(scene, camera);
        };

        const handleResize = () => {
            width = mount.current.clientWidth;
            height = mount.current.clientHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderScene();
        };

        const animate = () => {
            frameId = window.requestAnimationFrame(animate);

            if (rotatingFace.current) {
                rotate(rotatingFace.current);
            }

            controls.update();
            renderer.render(scene, camera);

            renderScene();
        };

        const rotate = (selectedFace) => {
            const sign = selectedFace.clockwise ? 1 : -1;
            const threshold = (sign * Math.PI) / 2;
            const rotationSpeed = 0.02 * sign;

            if (
                selectedFace.group.rotation[selectedFace.axis] < threshold &&
                sign > 0
            ) {
                selectedFace.group.rotation[selectedFace.axis] += rotationSpeed;
            } else if (
                selectedFace.group.rotation[selectedFace.axis] > threshold &&
                sign < 0
            ) {
                selectedFace.group.rotation[selectedFace.axis] += rotationSpeed;
            } else {
                selectedFace.group.rotation[selectedFace.axis] = threshold;

                rotatingFace.current = null;

                const groupChildren = [...group.children];

                groupChildren.forEach((cube) => {
                    fullCube.attach(cube);
                });

                group.rotation[selectedFace.axis] = 0;
                // console.log(
                //     fullCube.children.map((cube) => ({
                //         id: cube.id,
                //         position: cube.getWorldPosition(),
                //         direction: cube.getWorldDirection(),
                //         rotation: cube.getWorldQuaternion(),
                //     }))
                // );
                //console.log(fullCube.children);
                setCubes(fullCube.children);
            }
        };

        mount.current.appendChild(renderer.domElement); // adding renderer domElement
        window.addEventListener("resize", handleResize);

        //controls.current = { rotate };

        window.addEventListener("keydown", (e) => {
            let clockwise = /[A-Z]/.test(e.key);
            const key = e.key.toLowerCase();
            if (key === "f") {
                //front counter-clockwise
                rotateEvent({
                    level: 1.1,
                    posAxis: "z",
                    rotationalAxis: "z",
                    clockwise,
                });
            } else if (key === "u") {
                // top counter-clockwise
                rotateEvent({
                    level: 1.1,
                    posAxis: "y",
                    rotationalAxis: "y",
                    clockwise,
                });
            } else if (key === "r") {
                //right counter-clockwise
                rotateEvent({
                    level: 1.1,
                    posAxis: "x",
                    rotationalAxis: "x",
                    clockwise,
                });
            } else if (key === "b") {
                // bottom clockwise
                clockwise = !clockwise;
                rotateEvent({
                    level: -1.1,
                    posAxis: "y",
                    rotationalAxis: "y",
                    clockwise,
                });
            } else if (key === "l") {
                //left clockwise
                clockwise = !clockwise;
                rotateEvent({
                    level: -1.1,
                    posAxis: "x",
                    rotationalAxis: "x",
                    clockwise,
                });
            } else if (key === "s") {
                solveCube();
            }
        });

        const rotateEvent = (directions) => {
            if (rotatingFace.current === null) {
                cubeList.forEach((cube) => {
                    if (
                        Math.abs(
                            cube.getWorldPosition()[directions.posAxis] -
                                directions.level
                        ) < 0.1
                    ) {
                        group.add(cube);
                    }
                });
                rotatingFace.current = {
                    group: group,
                    axis: directions.rotationalAxis,
                    clockwise: directions.clockwise,
                };
            }
        };

        const solveCube = () => {
            // let currentState = "";
            // for (let i = 0; i < 54; i++) {
            //     currentState += "z";
            // }
            console.log(cubes);

            const faces = cubes
                .map((cube) => cube.children.slice(1))
                .flat() // converts from array of face arrays to a flattened array of faces
                .filter(
                    (face) =>
                        face.material.color.r +
                            face.material.color.b +
                            face.material.color.g >
                        0
                ); // face color is not black) // filters any face that is black

            for (let i = -1.1; i <= 1.1; i += 1.1) {
                for (let j = -1.1; j <= 1.1; j += 1.1) {}
            }
            const up = faces.map((face) => {
                if (Math.abs(face.getWorldPosition()["z"] + 1.1) < 0.1) {
                    return face;
                }
            });
            console.log(faces);
            let down = [];
            let front = [];
            let back = [];
            let left = [];
            let right = [];
            // Method:
            // go through each cube
            // use Math.abs(cube.getWorldPosition()[posAxis] - level) < 0.1
            // posAxis will be x, y, or z
            // level will be -1.1, 0, or 1.1
            // determine orientation
            // placement in the array reveals initial orientation and colors
            // then check rotation property and figure out final orientation
            // replace corresponding letters in currentState
        };

        animate();
    }, []);

    useEffect(() => {
        console.log("here", cubes);
    }, [cubes]);

    return <div className="canvasWrapper" ref={mount} />;
}

export default Cube;
