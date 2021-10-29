import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import "../css/Cube.css";
import cubeData from "../data/cube_data.json";

const colorMap = {
    red: "rgb(185, 0, 0)",
    blue: "rgb(0, 69, 173)",
    orange: "rgb(255, 89, 0)",
    yellow: "rgb(255, 213, 0)",
    white: "rgb(255,255,255)",
    green: "rgb(0, 155, 72)",
    black: "rgb(0,0,0)",
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

            //processRotateEvent(key);

            //commands.forEach(key => processRotateEvent(key))

            //const processRotateEvent = (key) => {}
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
            }
        });

        const rotateEvent = (directions) => {
            if (rotatingFace.current === null) {
                cubeList.forEach((cube) => {
                    let target = new THREE.Vector3(0, 0, 0);
                    cube.getWorldPosition(target);
                    if (
                        Math.abs(
                            target[directions.posAxis] - directions.level
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

        animate();
    }, []);

    const solveCube = (cubes) => {
        const currentCubes = cubes;
        console.log(currentCubes);

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

        // group faces is giving me 12 meshes per face somehow
        const front = groupFaces(faces, "z", false);
        const right = groupFaces(faces, "x", false);
        const up = groupFaces(faces, "y", false);
        const down = groupFaces(faces, "y", true);
        const left = groupFaces(faces, "x", true);
        const back = groupFaces(faces, "z", true);

        let cubeState = [
            faceToSortedString(front, "x", -1.1, "y", 1.1),
            faceToSortedString(right, "z", 1.1, "y", 1.1),
            faceToSortedString(up, "x", -1.1, "z", -1.1),
            faceToSortedString(down, "x", 1.1, "z", 1.1),
            faceToSortedString(left, "z", -1.1, "y", 1.1),
            faceToSortedString(back, "x", 1.1, "y", 1.1),
        ];

        console.log(cubeState);
    };

    const groupFaces = (tiles, axis, positive) => {
        const offset = positive ? 1.61 : -1.61;

        const array = tiles.filter((tile) => {
            let cords = new THREE.Vector3(0, 0, 0);
            tile.getWorldPosition(cords);
            if (Math.abs(cords[axis] + offset) < 0.1) {
                return tile;
            }
        });

        return array;
    };

    const faceToSortedString = (face, rowAxis, rowStart, colAxis, colStart) => {
        // example case: front, (front, x, -1.1, y, 1.1)
        let sortedString = "";
        let tileArray = [];
        let rowPos = rowStart;
        let colPos = colStart;

        for (let col = 0; col < 3; col++) {
            for (let row = 0; row < 3; row++) {
                const tile = face.find((tile) =>
                    tileFilter(
                        tile,
                        rowAxis,
                        colAxis,
                        rowStart - rowStart * row,
                        colStart - colStart * col
                    )
                );

                sortedString += getColorValue(tile.material.color);
            }
        }

        return sortedString;
    };

    const tileFilter = (tile, rowAxis, colAxis, rowPos, colPos) => {
        let cords = new THREE.Vector3(0, 0, 0);
        tile.getWorldPosition(cords);
        if (Math.abs(cords[rowAxis] - rowPos) < 0.1) {
            if (Math.abs(cords[colAxis] - colPos) < 0.1) {
                return true;
            }
        } else {
            return false;
        }
    };

    const getColorValue = (tileColor) => {
        // Currently testing for what values ranges each color shows
        // in order to check this or make it cleaner (like maybe using a switch statement)
        const colorValueMap = {
            white: { r: 1, g: 1, b: 1 },
            blue: { r: 0, g: 0.27058823529411763, b: 0.6784313725490196 },
            orange: { r: 1, g: 0.34901960784313724, b: 0 },
            red: { r: 0.7254901960784313, g: 0, b: 0 },
            green: { r: 0, g: 0.6078431372549019, b: 0.2823529411764706 },
            yellow: { r: 1, g: 0.8352941176470589, b: 0 },
        };

        if (tileColor.r === 1) {
            if (tileColor.g > 0.5) {
                if (tileColor.b === 1) {
                    return "w";
                } else {
                    return "y";
                }
            } else {
                return "o";
            }
        } else if (tileColor.r === 0) {
            if (tileColor.b > 0.5) {
                return "b";
            } else {
                return "g";
            }
        } else {
            return "r";
        }
    };

    useEffect(() => {
        const eventListener = (e) => {
            if (e.key.toLowerCase() === "s") {
                solveCube(cubes);
            }
        };
        window.addEventListener("keydown", eventListener);

        return () => {
            window.removeEventListener("keydown", eventListener);
        };
    }, [cubes]);

    return <div className="canvasWrapper" ref={mount} />;
}

export default Cube;
