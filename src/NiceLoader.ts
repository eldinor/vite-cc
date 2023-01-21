import {
    AssetsManager,
    FilesInput,
    MeshAssetTask,
    Scene,
} from "@babylonjs/core";

export class NiceLoader {
    scene: Scene;
    arr: Array<{}>;
    constructor(scene: Scene, arr: Array<{}>) {
        this.scene = scene;
        this.arr = arr;

        this.createUploadButton();
        this.uploadModel(scene, arr);
    }
    createUploadButton() {
        let wrapper = document.getElementById("nl-wrapper");
        if (!wrapper) {
            wrapper = document.createElement("div");
            wrapper.setAttribute("id", "nl-wrapper");
            wrapper.style.position = "absolute";
            wrapper.style.top = "15px";
            wrapper.style.width = "300px";
            wrapper.style.left = "15px";
            wrapper.style.border = "1px solid teal";
            wrapper.style.padding = "2px";
            document.body.appendChild(wrapper);
        }

        let container = document.getElementById("nl-container");
        if (!container) {
            container = document.createElement("div");
            container.setAttribute("id", "nl-container");
            wrapper.appendChild(container);
        }

        let fileInput = document.getElementById("loadFile");
        if (!fileInput) {
            fileInput = document.createElement("input");
            fileInput.setAttribute("id", "loadFile");
            fileInput.setAttribute("type", "file");
            fileInput.style.color = "transparent";
            container.appendChild(fileInput);
        }

        let deleteButton = document.getElementById("deleteButton");
        if (!deleteButton) {
            deleteButton = document.createElement("button");
            deleteButton.setAttribute("id", "deleteButton");
            deleteButton.style.float = "right";
            deleteButton.innerText = "DELETE ALL";
            deleteButton.style.display = "none";
            wrapper.appendChild(deleteButton);
        }
    }
    uploadModel(scene: Scene, arr: Array<{}>) {
        let assetsManager = new AssetsManager(scene);
        let root: any;
        let modelsArray = arr;

        assetsManager.onTaskSuccessObservable.add(function (task) {
            root = (task as MeshAssetTask).loadedMeshes[0]; //will hold the mesh that has been loaded recently\
            root.name = task.name;
            console.log("task successful", task);
            (task as MeshAssetTask).loadedMeshes.forEach((element) => {
                element.checkCollisions = true;
            });
            modelsArray.push(task);
            if (!scene.debugLayer) {
                window.alert("No Inspector found!");
            }
            scene.debugLayer.show({
                overlay: true,
                embedMode: true,
                enablePopup: false,
            });
            scene.debugLayer.select(root);
            document.getElementById("deleteButton").style.display = "initial";
        });

        assetsManager.onTaskErrorObservable.add(function (task) {
            console.log(
                "task failed: " + task.name,
                task.errorObject.message,
                task.errorObject.exception
            );
        });

        const loadButton = document.getElementById("loadFile");

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

            (document.getElementById("loadFile") as HTMLInputElement).value =
                null;
            loadButton!.innerHTML = "";
            document.getElementById("deleteButton").style.display = "none";
        };
    }
}
