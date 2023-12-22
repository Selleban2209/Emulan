import  React, { useEffect } from "react";
import { useState, useRef, createRef , path} from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import { Navigate, Route, Routes, Router } from "react-router-dom";
import { EmulatorInstance , SideMenu, GameView} from "./components/export";
import {open, save ,  } from  "@tauri-apps/api/dialog";
import { basename, resolveResource ,extname} from '@tauri-apps/api/path';
import "./App.css";



function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  var index = 0; 
  const [id, setId] = useState(1);
  const [emulators, setEmulator] = useState([
    {  
      id: 0,
      name: "Home",
      path: "",
      subpath: "home",
      component: <p>Test element component </p>,
      default: true,
      }
    
  ])
  
  const  readFileContents = async () =>{
    try {
      const selectedPath =  await open({
        multiple: false, 
        title: "Open any file",  
        filters: [{
          name: 'Program',
          extensions: ['exe', 'NDS', 'ISO',  'GBA']
        }]
      });
    
      if(selectedPath){
        console.log(selectedPath)
        const resourcePath = await resolveResource(selectedPath);
        const base = await basename(resourcePath);
        console.log("Basnema: ",base)
        var emulatorName = base.substring(0, base.lastIndexOf('.'));
        console.log("big test: ", emulatorName);
        var extension = base.substring( base.lastIndexOf('.'), base.length);
        console.log(extension);

        handleAddEmulator(emulatorName,String(selectedPath), base,extension)
      }
    } catch (error) {
      console.log(error);
    }
  }



  const handleAddEmulator = (name, path,  filename, extension ) => {
    const emulator = {
      id,
      name, 
      path,
      filename,
      extension,
      subpath: name,
      component: <p>Test element component </p>,
    }
    setId(id+ 1);
    setEmulator([...emulators, emulator])
    console.log("new emulator: ", emulators)
    console.log("path", emulator.path)
  }
  useEffect(() => {
    
   
    },[]);


  

  return (
    
        
    <div className="container">
      <div className="row">
          <button  onClick={readFileContents} type="submit">Select File</button>
          <button>Settings</button>
      </div>
      <div className="flexBox">
        <div className="sideMenu">
          <SideMenu className="sideMenu"  value={emulators}/>
        </div>
        <div className="emulatorTab" >
          <Routes>
          <Route  path="/" element={<p>Main menu </p>} />
          {emulators.map ((item) => (   
            <Route  path={`/${item.subpath}`} element={<EmulatorInstance key= {item.id} {...item}  /> } />
          ))}   
          </Routes>
        </div>
      </div>
    </div>
         
         );
        }
        
        
        /*    {emulators.map ( emu=>(
          <EmulatorInstance key= {emu.id} {...emu}   />
          ))}*
          
          
                {emulators.map ((item) => {
            <Route  path={`/${item.path}`} element={<p>Test element component </p>} />
          
          })

        }*/
          export default App;
          