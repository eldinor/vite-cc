import { Engine } from "@babylonjs/core/Engines";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Tools } from "@babylonjs/core/Misc/tools";
import { HemisphericLight } from "@babylonjs/core/Lights";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { MeshAssetTask, FilesInput, AssetsManager } from "@babylonjs/core";

import "@babylonjs/loaders/glTF";
import "@babylonjs/inspector";
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
            this.scene.debugLayer.show({
                overlay: true,
                embedMode: true,
                enablePopup: false,
            });
        } else {
            this.scene.debugLayer.hide();
        }
    }

    run() {
        this.debug(true);
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
    var scene = new Scene(engine);

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
    camera.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    // Our built-in 'ground' shape.
    var ground = MeshBuilder.CreateGround(
        "ground",
        { width: 100, height: 100 },
        scene
    );

    let assetsManager = new AssetsManager(scene);

    let mesh;
    let modelsArray: any = [];

    //called when a single task has been successfull
    assetsManager.onTaskSuccessObservable.add(function (task) {
        console.log(task);
        mesh = (task as unknown as MeshAssetTask).loadedMeshes[0]; //will hold the mesh that has been loaded recently\
        mesh.name = task.name;
        console.log("task successful", task);
        (task as unknown as MeshAssetTask).loadedMeshes.forEach((element) => {
            element.checkCollisions = true;
        });
        modelsArray.push(task);
        console.log(modelsArray);
        populateList(modelsArray);
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
    document.getElementById("bottomButton")!.onclick = function (e) {
        console.log("SDFSDF SDF SDF! ! ! ! ", modelsArray);
        modelsArray.forEach((element: any) => {
            console.log("ma ma");
            element.loadedMeshes[0].dispose();
        });
        modelsArray = [];
        const section = document.getElementById("allLoaded");
        section!.innerHTML = "";
    };
    //
    return scene;
};

function populateList(array: []) {
    console.log(array);
    const section = document.getElementById("allLoaded");
    section!.innerHTML = "";
    array.forEach((element) => {
        section!.innerHTML += "<div class='btn arr'>" + (element as any).name;
        section!.innerHTML +=
            "<button id=" + (element as any).name + ">TEXT" + "</button>";
        section!.innerHTML += "</div>";
        document.getElementById((element as any).name)!.onclick = function (e) {
            console.log("wer wer wer wer", (element as any).name);
            deleteModel((element as any).name, array);
        };
    });
}

function deleteModel(name: string, arr: Array<any>) {
    console.log(arr);

    arr.forEach((item) => {
        console.log(item.name);
        if (item.name === name) {
            console.log("OKOKOKOK!!");
            item.loadedMeshes[0].dispose();
        }
    });
    /*
    let el = arr.find((element) => {
        element.name === name;
        console.log(name);
    });
    console.log(el);
*/
    // element.loadedMeshes[0].dispose();
    console.log("DELETED");
}
