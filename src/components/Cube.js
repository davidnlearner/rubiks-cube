import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import "../css/Cube.css";
import cubeData from "../data/cube_data.json";

import solver from "rubiks-cube-solver";

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
    const [group, setGroup] = useState(THREE.Group());

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
        //const group = new THREE.Group();
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

        // contains event call, needs fullCube
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
                setCubes(fullCube.children);
            }
        };

        mount.current.appendChild(renderer.domElement); // adding renderer domElement
        window.addEventListener("resize", handleResize);

        //controls.current = { rotate };

        window.addEventListener("keydown", (e) => {
            processRotateEvent(e.key);
        });

        animate();
    }, []);

    // needs cubeList and group
    //const group = new THREE.Group();
    // changed cubeList references to cubes and passed in cubes
    useEffect(() => {
        const rotateEvent = (directions, cubes) => {
            if (rotatingFace.current === null) {
                cubes.forEach((cube) => {
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

        const processRotateEvent = (key) => {
            let clockwise = /[A-Z]/.test(key);
            key = key.toLowerCase();

            if (key === "f") {
                //front counter-clockwise
                rotateEvent(
                    {
                        level: 1.1,
                        posAxis: "z",
                        rotationalAxis: "z",
                        clockwise,
                    },
                    cubes
                );
            } else if (key === "u") {
                // top counter-clockwise
                rotateEvent(
                    {
                        level: 1.1,
                        posAxis: "y",
                        rotationalAxis: "y",
                        clockwise,
                    },
                    cubes
                );
            } else if (key === "r") {
                //right counter-clockwise
                rotateEvent(
                    {
                        level: 1.1,
                        posAxis: "x",
                        rotationalAxis: "x",
                        clockwise,
                    },
                    cubes
                );
            } else if (key === "b") {
                // bottom clockwise
                clockwise = !clockwise;
                rotateEvent(
                    {
                        level: -1.1,
                        posAxis: "y",
                        rotationalAxis: "y",
                        clockwise,
                    },
                    cubes
                );
            } else if (key === "l") {
                //left clockwise
                clockwise = !clockwise;
                rotateEvent(
                    {
                        level: -1.1,
                        posAxis: "x",
                        rotationalAxis: "x",
                        clockwise,
                    },
                    cubes
                );
            }
        };
    }, [group]);

    // called from "s" keydown event
    // solves the cube
    const solveCube = (cubes) => {
        const currentCubes = cubes;
        console.log(currentCubes);

        // Creates array of all non-black tiles (tiles are the faces of the sub-cubes)
        const tiles = cubes
            .map((cube) => cube.children.slice(1))
            .flat() // converts from array of face arrays to a flattened array of tiles
            .filter(
                (tile) =>
                    tile.material.color.r +
                        tile.material.color.b +
                        tile.material.color.g >
                    0
            ); // tile color is not black

        // Groups the tiles into cube faces
        const front = groupFaces(tiles, "z", false);
        const right = groupFaces(tiles, "x", false);
        const up = groupFaces(tiles, "y", false);
        const down = groupFaces(tiles, "y", true);
        const left = groupFaces(tiles, "x", true);
        const back = groupFaces(tiles, "z", true);

        // Converts faces into sorted String representing current cube state
        let cubeState = [
            faceToSortedString(front, "x", -1.1, "y", 1.1),
            faceToSortedString(right, "z", 1.1, "y", 1.1),
            faceToSortedString(up, "x", -1.1, "z", -1.1),
            faceToSortedString(down, "x", -1.1, "z", 1.1),
            faceToSortedString(left, "z", -1.1, "y", 1.1),
            faceToSortedString(back, "x", 1.1, "y", 1.1),
        ].join("");

        let solveMoves = solver(cubeState); // takes current state and returns moves needed to solve cube
        let moveArray = solveMoves.split(" ");
        // converts output of solver into usable commands
        moveArray = moveArray
            .map((move) => {
                if (move.includes("prime")) {
                    return move[0].toUpperCase();
                } else if (move.includes("2")) {
                    return [move[0].toLowerCase(), move[0].toLowerCase()];
                } else {
                    return move.toLowerCase();
                }
            })
            .flat();

        //solveMoves = moveArray.join(" ");
        //moveArray = solveMoves.split(" ");
        moveArray.forEach((key) => processRotateEvent(key));
    };

    // called from: Solve cube
    // Takes the array of all tiles, a string axis (x, y, or z), and a boolean representing polarity(+/-)
    // Returns array of tiles on a face (furthest out tiles in given direction)
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

    // called from: Solve cube
    // Takes a face's tile array, row axis, x coordinate of first tile, column axis, y coordinate of first tile
    // Returns string reflecting the current state of the given face
    const faceToSortedString = (face, rowAxis, rowStart, colAxis, colStart) => {
        // example case: front, (front, x, -1.1, y, 1.1)
        let sortedString = "";

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

    // called from: faceToSortedString
    // Takes a tile (Mesh), row axis, column axis, row axis coordinate, column axis coordinate
    // Returns boolean of if the tile has those coordinates
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

    // called from: faceToSortedString
    // takes mesh color values (r, g, b)
    // returns single character string representing color's original face
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
                    return "f"; // white
                } else {
                    return "b"; // yellow
                }
            } else {
                return "u"; // orange
            }
        } else if (tileColor.r === 0) {
            if (tileColor.b > 0.5) {
                return "r"; // blue
            } else {
                return "l"; // green
            }
        } else {
            return "d"; // red
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
