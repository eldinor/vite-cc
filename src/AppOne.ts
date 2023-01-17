import { Engine } from "@babylonjs/core/Engines";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Tools } from "@babylonjs/core/Misc/tools";
import { HemisphericLight } from "@babylonjs/core/Lights";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";

import "@babylonjs/loaders/glTF";
import "@babylonjs/inspector";

import { CharacterController } from "./cc";
import { Mesh } from "@babylonjs/core/";
import {
    AbstractMesh,
    AnimationGroup,
    FilesInput,
    AssetsManager,
    MeshAssetTask,
} from "@babylonjs/core/";

interface ILoadedModels {
    name?: string;
    meshes?: any;
}

export class AppOne {
    engine: Engine;
    scene: Scene;

    constructor(readonly canvas: HTMLCanvasElement) {
        this.engine = new Engine(canvas);
        window.addEventListener("resize", () => {
            this.engine.resize();
        });
        this.scene = createScene(this.engine, this.canvas);
    }

    debug(debugOn: boolean = true) {
        if (debugOn) {
            this.scene.debugLayer.show({ overlay: true });
        } else {
            this.scene.debugLayer.hide();
        }
    }

    run() {
        this.debug(false);
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }
}

let fileInput = document.getElementById("loadFile");
if (!fileInput) {
    fileInput = document.createElement("INPUT");
    fileInput.setAttribute("id", "loadFile");
    fileInput.setAttribute("type", "file");
    fileInput.style.position = "absolute";
    fileInput.style.top = "90px";
    fileInput.style.width = "300px";
    fileInput.style.height = "40px";
    fileInput.style.right = "40px";
    fileInput.className = "form-control form-control-sm btn-success";
    document.body.appendChild(fileInput);
}

var createScene = function (engine: Engine, canvas: HTMLCanvasElement) {
    // this is the default code from the playground:

    // This creates a basic Babylon Scene object (non-mesh)
    const scene = new Scene(engine);

    // This creates and positions a free camera (non-mesh)
    const camera = new ArcRotateCamera(
        "camera",
        Tools.ToRadians(90),
        Tools.ToRadians(65),
        10,
        Vector3.Zero(),
        scene
    );

    // This targets the camera to scene origin
    camera.setTarget(Vector3.Zero());

    // This attaches the camera to the canvas
    //  camera.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;
    /*
    // Our built-in 'sphere' shape.
    var sphere = MeshBuilder.CreateSphere(
        "sphere",
        { diameter: 2, segments: 32 },
        scene
    );

    // Move the sphere upward 1/2 its height
    sphere.position.y = 1;
    */

    // Our built-in 'ground' shape.
    var ground = MeshBuilder.CreateGround(
        "ground",
        { width: 100, height: 100 },
        scene
    );
    ground.position.y = -0.01;
    ground.checkCollisions = true;

    SceneLoader.ImportMesh(
        "",
        "",
        "all-anim.glb",
        scene,
        (meshes, particleSystems, skeletons, aniGroups) => {
            var player = meshes[0];
            player.name = "Avatar";

            console.log(aniGroups);
            aniGroups.forEach((a) => a.stop());

            //   player.position = new Vector3(14, 2, -3);
            player.checkCollisions = true;

            player.ellipsoid = new Vector3(0.5, 1, 0.5);
            player.ellipsoidOffset = new Vector3(0, 1, 0);

            // character controller  needs rotation in euler.
            // if your mesh has rotation in quaternion then convert that to euler.
            // NOTE: The GLTF/GLB files have rotation in quaternion
            player.rotation = player.rotationQuaternion!.toEulerAngles();
            player.rotationQuaternion = null;

            player.rotation.y = Math.PI;
            var alpha = (3 * Math.PI) / 2 - player.rotation.y;
            var beta = Math.PI / 2.5;
            var target = new Vector3(
                player.position.x,
                player.position.y + 1.5,
                player.position.z
            );

            camera.alpha = alpha;
            camera.beta = beta;
            camera.setTarget(target);
            // make sure the keyboard keys controlling camera are different from those controlling player
            // here we will not use any keyboard keys to control camera
            camera.keysLeft = [];
            camera.keysRight = [];
            camera.keysUp = [];
            camera.keysDown = [];

            // below are all standard camera settings.
            // nothing specific to charcter controller
            camera.wheelPrecision = 15;
            camera.checkCollisions = false;
            // how close can the camera come to player
            camera.lowerRadiusLimit = 2;
            // how far can the camera go from the player
            camera.upperRadiusLimit = 5;
            camera.attachControl(canvas, false);

            var agMap = createAGmap(aniGroups);

            let cc = new CharacterController(
                player as Mesh,
                camera,
                scene,
                agMap,
                true
            );
            cc.setMode(0);
            //below makes the controller point the camera at the player head which is approx
            //1.5m above the player origin
            cc.setCameraTarget(new Vector3(0, 2, 0));

            //if the camera comes close to the player then we want cc to enter first person mode.
            cc.setNoFirstPerson(false);
            //the height of steps which the player can climb
            cc.setStepOffset(0.4);
            //the minimum and maximum slope the player can go up
            //between the two the player will start sliding down if it stops
            cc.setSlopeLimit(30, 60);

            resetAnimations(aniGroups, cc);

            //set how smmothly should we transition from one animation to another
            cc.enableBlending(0.05);

            //if somehting comes between camera and avatar move camera in front of the obstruction?
            cc.setCameraElasticity(true);
            //if something comes between camera and avatar make the obstruction invisible?
            cc.makeObstructionInvisible(false);

            cc.start();
            //
        }
    );

    /*
    scene.onPointerDown = (evt) => {
        scene.getEngine().enterPointerlock();
    };
    */

    SceneLoader.ImportMesh(
        "",
        "",
        "walls.glb",
        scene,
        (meshes, particleSystems, skeletons) => {
            let root = meshes[0];
            root.scaling.scaleInPlace(0.25);
            meshes.forEach((m) => {
                m.checkCollisions = true;
            });
        }
    );

    let assetsManager = new AssetsManager(scene);

    let mesh;
    let modelsArray: any = [];
    let book: ILoadedModels = {};
    let allLoadedArray: any = [];

    //called when a single task has been sucessfull
    assetsManager.onTaskSuccessObservable.add(function (task) {
        console.log(task);
        mesh = (task as unknown as MeshAssetTask).loadedMeshes[0]; //will hold the mesh that has been loaded recently\
        mesh.name = task.name;
        console.log("task successful", task);
        (task as unknown as MeshAssetTask).loadedMeshes.forEach((element) => {
            element.checkCollisions = true;
            console.log(task.name);

            modelsArray.push(element);
            console.log(modelsArray);
            book = {
                name: task.name,
                meshes: modelsArray,
            };
        });
        console.log(book);
        allLoadedArray.push(book);
        console.log(allLoadedArray);
        let allLoadedNames: any = [];

        allLoadedArray.forEach((element: any) => {
            console.log("element.name", element.name);
            allLoadedNames.push(element.name);
        });

        document.getElementById("allLoaded")!.innerHTML = allLoadedNames;
    });

    assetsManager.onTaskErrorObservable.add(function (task) {
        console.log(
            "task failed",
            task.errorObject.message,
            task.errorObject.exception
        );
    });

    var loadButton = document.getElementById("loadFile");

    loadButton!.onchange = function (evt) {
        let files: any = evt.target!.files;
        let filename = files[0].name;
        let blob = new Blob([files[0]]);

        FilesInput.FilesToLoad[filename.toLowerCase()] = blob as File;

        assetsManager.addMeshTask(filename, "", "file:", filename);
        assetsManager.load();
    };
    //
    /*
    var filesInput = new FilesInput(
        engine,
        scene,
        sceneLoaded,
        null,
        null,
        null,
        null,
        null,
        null
    );

    filesInput.monitorElementForDragNDrop(canvas);

    function sceneLoaded(sceneFile: any, babylonScene: any) {
        let currentScene = babylonScene;
        currentScene.createDefaultCameraOrLight(true, true, true);
    }
    */

    return scene;
};

function createAGmap(allAGs: any) {
    //lets map ag groups to the character controller actions.
    let agMap = {
        idle: allAGs[4],
        //  strafeLeft: allAGs[3],
        //   strafeRight: allAGs[4],
        //   turnRight: allAGs[5],
        walk: allAGs[7],
        //  fall: allAGs[8],
        //   slideBack: allAGs[9],
        runJump: allAGs[5],
        // turnLeft: allAGs[11],
        walkBack: allAGs[8],
        run: allAGs[6],
        idleJump: allAGs[5],
    };

    return agMap;
}

export function resetAnimations(aniGs: any, cc: CharacterController) {
    const ags = aniGs as AnimationGroup[];

    const idleAG: AnimationGroup | null = ags.find(
        (ag) => ag.name?.toLowerCase() === `idle`
    ) as AnimationGroup;
    const jumpAG = ags.find((ag) =>
        [`jump`, `jump_idle`].includes(ag.name?.toLowerCase())
    ) as AnimationGroup;
    const walkAG = ags.find(
        (ag) => ag.name?.toLowerCase() === `walk`
    ) as AnimationGroup;
    const runAG = ags.find(
        (ag) => ag.name?.toLowerCase() === `run`
    ) as AnimationGroup;

    const backAG = ags.find(
        (ag) => ag.name?.toLowerCase() === `walk_backward`
    ) as AnimationGroup;

    const danceAGs = ags.filter((ag) =>
        ag.name.toLowerCase().startsWith(`dance_`)
    );

    const greetingAG = ags.find(
        (ag) => ag.name.toLowerCase() === `greeting`
    ) as AnimationGroup;

    console.log(greetingAG);

    cc.setIdleAnim(idleAG, 1, true);
    cc.setWalkAnim(walkAG, 1, true);
    cc.setRunAnim(runAG, 1, true);
    cc.setIdleJumpAnim(jumpAG, 0.5, false);
    cc.setRunJumpAnim(jumpAG, 0.5, false);
    cc.setWalkBackAnim(backAG, 1, true);
    // cc.setDanceAnims(danceAGs, 1, true);
    cc.setGreetingAnim(greetingAG, 1, true);
}
