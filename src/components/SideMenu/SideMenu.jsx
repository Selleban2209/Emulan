import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import {open } from  "@tauri-apps/api/dialog";
import "./SideMenu.css";
import * as logos from "../../assets/export";




function SideMenu ({emuList}){


    return (
        <asside className="asideMenu">

            <div className="aside-wrapper">
            <h1>Emulan</h1>

            <div>

            </div>
            </div>
           
        </asside>

    );

}


export default SideMenu; 