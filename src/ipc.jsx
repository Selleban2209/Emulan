import { invoke } from "@tauri-apps/api/tauri";

export async function openSavedPath(){
    setErrorMsg(await invoke("open_saved_path", {path, name, filename}).then((message) => console.log(message)));

    }

export async function verifyRom(path,filename){
    return  invoke("verify_rom", {path, filename});

}