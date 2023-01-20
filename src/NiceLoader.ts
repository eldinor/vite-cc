import {
    AssetsManager,
    FilesInput,
    MeshAssetTask,
    Scene,
} from "@babylonjs/core";

export function createUploadButton() {
    let container = document.getElementById("nl-container");
    if (!container) {
        container = document.createElement("div");
        container.style.position = "absolute";
        container.style.top = "40px";
        container.style.width = "430px";
        container.style.height = "40px";
        container.style.left = "40px";
        container.style.display = "inline-block";
        container.style.backgroundColor = "beige";
        document.body.appendChild(container);
    }

    let fileInput = document.getElementById("loadFile");
    if (!fileInput) {
        fileInput = document.createElement("input");
        fileInput.setAttribute("id", "loadFile");
        fileInput.setAttribute("type", "file");
        fileInput.style.float = "left";
        fileInput.style.color = "transparent";
        container.appendChild(fileInput);
    }
    /*
    let scaleInput = document.getElementById("scaleInput");
    if (!scaleInput) {
        scaleInput = document.createElement("input");
        scaleInput.setAttribute("id", "scaleInput");
        scaleInput.setAttribute("size", "1");
        scaleInput.setAttribute("type", "text");
        scaleInput.setAttribute("value", "1");
        container.appendChild(scaleInput);
    }
    */
    let deleteButton = document.getElementById("deleteButton");
    if (!deleteButton) {
        deleteButton = document.createElement("button");
        deleteButton.setAttribute("id", "deleteButton");
        deleteButton.style.float = "right";
        deleteButton.innerText = "DELETE THEM ALL!";

        container.appendChild(deleteButton);
    }
}

export function uploadModel(scene: Scene, arr: Array<{}>) {
    let assetsManager = new AssetsManager(scene);
    let root;
    let modelsArray = arr;

    assetsManager.onTaskSuccessObservable.add(function (task) {
        root = (task as MeshAssetTask).loadedMeshes[0]; //will hold the mesh that has been loaded recently\
        root.name = task.name;
        console.log("task successful", task);
        (task as MeshAssetTask).loadedMeshes.forEach((element) => {
            element.checkCollisions = true;
        });
        modelsArray.push(task);
        scene.debugLayer.select(root);
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
        let files: any = (evt.target as HTMLInputElement)!.files;
        let filename = files[0].name;
        let blob = new Blob([files[0]]);

        FilesInput.FilesToLoad[filename.toLowerCase()] = blob as File;

        assetsManager.addMeshTask(filename, "", "file:", filename);
        assetsManager.load();
    };

    // DELETE ALL
    document.getElementById("deleteButton")!.onclick = function (e) {
        modelsArray.forEach((element: any) => {
            element.loadedMeshes[0].dispose(false, true);
        });
        modelsArray = [];
        console.log("All deleted!");
        loadButton!.innerHTML = "";
    };
} //

export function NiceLoader(scene: Scene, arr: Array<{}>) {
    createUploadButton();
    uploadModel(scene, arr);
}
