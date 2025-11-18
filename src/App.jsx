import  React, { useEffect } from "react";
import { useState, useRef, createRef , path} from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import { useNavigate, Route, Routes, Router } from "react-router-dom";
import { EmulatorInstance , SideMenu, GameView,ManageGamesPage, SettingsPage , MainMenuPage} from "./components/export";
import {open, save ,  } from  "@tauri-apps/api/dialog";
import { basename, resolveResource ,extname} from '@tauri-apps/api/path';
import "./App.css";

function App() {
  const navigate = useNavigate();
  const [id, setId] = useState(1);
  const [emulators, setEmulators] = useState([
    {  
      id: 0,
      name: "Home",
      path: "",
      subpath: "home",
      component: <p>Test element component </p>,
      default: true,
    }
  ]);

  const handleAddEmulator = (files) => {
    const newEmulators = files.map((file, index) => ({
      id: id + index,
      name: file.name || file.rom_name,
      path: file.path || file.rom_path,
      filename: file.filename || file.rom_name,
      extension: file.extension || file.rom_extension,
      subpath: (file.name || file.rom_name).replace(/\s+/g, '-'), // Make URL-friendly
      component: <p>Test element component </p>,
    }));
    
    setEmulators(prevEmulators => [...prevEmulators, ...newEmulators]);
    setId(prevId => prevId + files.length);
  }

  return (
    <div className="container">
      <div className="headerMenu">
        <button onClick={()=> navigate('/')} className="homeButton">Games Library</button>
        <button onClick={()=> navigate('/settings')} className="settingsButton">Settings</button>  
        <button onClick={()=> navigate('/manage-games')} className="manageGamesButton">Manage Games</button>
      </div>
      <div className="flexBox">
       
        <div className="sideMenu">
          <SideMenu className="sideMenu" value={emulators}/>
        </div>
        <div className="emulatorTab">
          <Routes>
            <Route path="/" element={<MainMenuPage emulators={emulators} />} />
            <Route path="/manage-games" element={<ManageGamesPage handleAddEmulator={handleAddEmulator} />} />
            <Route path="/settings" element={<SettingsPage emulators={emulators} setEmulators={setEmulators} />} />
            {emulators.map((item) => (   
              <Route key={item.id} path={`/${item.subpath}`} element={<EmulatorInstance {...item} />} />
            ))}   
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
          