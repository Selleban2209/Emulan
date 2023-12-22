import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import "./EmulatorInstance.css";
import { appWindow, WebviewWindow } from '@tauri-apps/api/window';
import { emit, listen } from '@tauri-apps/api/event'
import * as logos from "../../assets/export";

const listenTest = await listen("event_name", (eventPayload)  => {
    console.log(eventPayload);
});


function EmulatorInstance ({name, id, path,filename, extension} ){
    const [errorMsg, setErrorMsg] = useState("");

    let idS = String(id);
    async function openSavedPath(){
    console.log("extension: ", filename, extension);
    setErrorMsg(await invoke("open_saved_path", {path, name, filename}).then((message) => console.log(message)));

    }
    async function verifyRom(){
    console.log("extension: ", filename, extension);
    setErrorMsg(await invoke("verify_rom", {path, filename}));

    }

    function RenderPlatform  (){
        switch (name){
            case "Project64": return (<><p>N64</p><img src={logos.nintendo64Logo} alt="" /></>);

            case "DeSmuME_0.9.11_x64": return (<><p>NDS</p> <img src={logos.NDSLogo} alt="" style={{width:"90px",height:"20px"}}/></>);       

            default: return <p>Platform</p>
        }
    }

    return (
    <div className="instance-div">
        <p>{name}</p>
        <RenderPlatform />
        <p>{id}</p>
        <button className="verifyBtn" onClick={()=>verifyRom()}>Verify</button>
        <button className="openBtn" onClick={()=>openSavedPath()}>Open Emulator</button>     
    </div>
    );

}

export default EmulatorInstance; 