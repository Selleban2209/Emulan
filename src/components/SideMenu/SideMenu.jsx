import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import {open } from  "@tauri-apps/api/dialog";


import { Link, useMatch, useResolvedPath } from "react-router-dom"
import "./SideMenu.css";
import * as logos from "../../assets/export";   


function SideMenu (emuList){

    const emulators = emuList.value; 
    return (
        <div className="asideMenu">
          <Link to="/" className="upperLinkMenu"> Main menu test</Link>
            <ul>
            {emulators.map((item) =>(
                <CustomLink to={`/${item.rom_subpath}`}>{item.rom_name}</CustomLink>
              ))}
            </ul>
        </div>

    );

}

function CustomLink({ to, children, ...props }) {
    const resolvedPath = useResolvedPath(to)
    const isActive = useMatch({ path: resolvedPath.pathname, end: true })
  
    return (
      <li className={isActive ? "active" : ""}>
        <Link to={to} {...props}>
          {children}
        </Link>
      </li>
    )
  }


export default SideMenu; 

