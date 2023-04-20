import  React from "react";
import { useState, useRef, createRef , path} from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import { Navigate, Route, Routes } from "react-router-dom";
import { EmulatorInstance , SideMenu} from "./components/export";
import {open, save ,  } from  "@tauri-apps/api/dialog";
import { basename, resolveResource ,extname} from '@tauri-apps/api/path';
import "./App.css";



function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  var index = 0; 
  const [id, setId] = useState(0);
  const [emulators, setEmulator] = useState([

  ])
  
  const  readFileContents = async () =>{
    try {
      const selectedPath =  await open({
        multiple: false, 
        title: "Open any file",  
        filters: [{
          name: 'Program',
          extensions: ['exe']
        }]
      });
    
      if(selectedPath){
        console.log(selectedPath)
        const resourcePath = await resolveResource(selectedPath);
        const base = await basename(resourcePath);
        var emulatorName = base.substring(0, base.lastIndexOf('.'));
        console.log("big test: ", emulatorName)
        handleAddEmulator(emulatorName,String(selectedPath))
      }
    } catch (error) {
      console.log(error);
    }
  }

  const imageContent  = async ()=> {
    const selected = await open({
      multiple: true,
      filters: [{
      name: 'Image',
      extensions: ['png', 'jpeg', 'exe']
      }]
   });
    if(selected!==null){
      console.log( "imageContent test: ", selected)
    }
  }
  const handleAddEmulator = (name, path) => {
    const emulator = {
      id,
      name, 
      path,
      component: <SideMenu/>
    }
    setId(id+ 1);
    setEmulator([...emulators, emulator])
    console.log("new emulator: ", emulators)
  }


  async function openPath(path){
    await invoke("openSavedPath", path);

  }

  return (
    <div className="container">
      <div className="row">
          <button  onClick={readFileContents} type="submit">Select File</button>
      
        </div>
      <div className="flexBox">

        
        <SideMenu/>
      <div className="emulatorTab" >
    
        {emulators.map ( emu=>(
          <EmulatorInstance key= {emu.id} {...emu}   />
          ))}

          </div>
      </div>
    </div>
  );
}

export default App;
