import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import "./EmulatorInstance.css";
import { appWindow, WebviewWindow } from '@tauri-apps/api/window';
import { emit, listen } from '@tauri-apps/api/event'
import * as logos from "../../assets/export";

const listenTest = await listen("event_name", (eventPayload)  => {
    console.log(eventPayload);
});


function EmulatorInstance ({rom_id, rom_name, rom_path, rom_filename, rom_extension, rom_subpath  } ){
    const [errorMsg, setErrorMsg] = useState("");

    let idS = String(rom_id);
    async function openSavedPath(){
        console.log("OPENING! filename: ", rom_filename,"Exstension: ", rom_extension);
        invoke("open_saved_path", {
            path: rom_path,
            name: rom_name,
            filename: rom_filename,
            extension: rom_extension,
        })
        .then((message) => {
            console.log(message);
            setErrorMsg(message);
        })
        .catch((error) => {
            console.error(error);
            setErrorMsg(String(error));
        });   
    }
    async function verifyRom(){
    console.log("extension: ", rom_filename, rom_extension);
    setErrorMsg(await invoke("verify_rom", {path: rom_path,  filename: rom_filename}))
        .then((message) => console.log(message))
        .catch((error) => console.log(error));

    }

    function RenderPlatform  (){
        switch (rom_name){
            case "Project64": return (<><p>N64</p><img src={logos.nintendo64Logo} alt="" /></>);

            case "DeSmuME_0.9.11_x64": return (<><p>NDS</p> <img src={logos.NDSLogo} alt="" style={{width:"90px",height:"20px"}}/></>);       

            default: return <p>Platform</p>
        }

    }

    return (
    <div className="instance-div">
        <p>{rom_name}</p>
        <RenderPlatform />
        <p>{rom_id}</p>
        <button className="verifyBtn" onClick={()=>verifyRom()}>Verify</button>
        <button className="openBtn" onClick={()=>openSavedPath()}>Open Emulator</button>     
    </div>
    );

}

export default EmulatorInstance; 