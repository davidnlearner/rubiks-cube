import { useEffect, useRef } from "react";
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
    //const [rotatingFace, setRotatingFace] = useState(null);
    const mount = useRef(null);
    // eslint-disable-next-line no-unused-vars
    const controls = useRef(null);

    const rotatingFace = useRef(null);

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

            cubes.push(cubeGroup);
            fullCube.add(cubeGroup);
        });

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
            if (selectedFace.group.rotation[selectedFace.axis] < Math.PI / 2) {
                selectedFace.group.rotation[selectedFace.axis] += 0.01;
            } else {
                selectedFace.group.rotation[selectedFace.axis] = Math.PI / 2;

                rotatingFace.current = null;

                const groupChildren = [...group.children];

                groupChildren.forEach((cube) => {
                    fullCube.attach(cube);
                });

                group.rotation[selectedFace.axis] = 0;
            }
        };

        mount.current.appendChild(renderer.domElement); // adding renderer domElement
        window.addEventListener("resize", handleResize);

        //controls.current = { rotate };

        window.addEventListener("keydown", (e) => {
            if (e.key === "w") {
                rotateEvent({ level: 1.1, posAxis: "z", rotationalAxis: "z" });
            } else if (e.key === "a") {
                rotateEvent({ level: 1.1, posAxis: "y", rotationalAxis: "y" });
            } else if (e.key === "s") {
                rotateEvent({ level: 1.1, posAxis: "x", rotationalAxis: "x" });
            } else if (e.key === "d") {
                rotateEvent({ level: -1.1, posAxis: "z", rotationalAxis: "z" });
            }
        });

        const rotateEvent = (directions) => {
            if (rotatingFace.current === null) {
                cubes.forEach((cube) => {
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
                };
            }
        };

        animate();
    }, []);

    return <div className="canvasWrapper" ref={mount} />;
}

export default Cube;
