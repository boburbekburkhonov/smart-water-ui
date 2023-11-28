import React from 'react';
import { api } from "../Api/Api";
import { useState } from "react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import AdminDashboard from '../AdminDashboard/AdminDashboard';
import AdminLastData from '../AdminLastData/AdminLastData';
import AdminLastDataNews from '../AdminLastDataNews/AdminLastDataNews';
import AdminData from '../AdminData/AdminData';
import AdminMap from '../AdminMap/AdminMap';
import AdminStations from '../AdminStations/AdminStations';
import menuBar from "../../assets/images/menu-bar.png";
import dashboard from "../../assets/images/dashboard.png";
import dashboardBlack from "../../assets/images/dashboard-black.png";
import news from "../../assets/images/news.png";
import newsWhite from "../../assets/images/news-white.png";
import newsLastdata from "../../assets/images/lastdata.png";
import newsLastdataBlack from "../../assets/images/lastdata-black.png";
import stations from "../../assets/images/station.png";
import stationsWhite from "../../assets/images/station-white.png";
import map from "../../assets/images/map.png";
import mapBlack from "../../assets/images/map-black.png";
import userLogout from "../../assets/images/user-logout.png";
import logout from "../../assets/images/logout.png";
import "./Admin.css";
import { useEffect } from 'react';

const Admin = () => {
    const token = window.localStorage.getItem("accessToken");
    const role = window.localStorage.getItem("role");
    const username = window.localStorage.getItem("username");
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
        window.location.href = "/";
        }
    }, []);

    function logoutFunction() {
        window.localStorage.removeItem("name");
        window.localStorage.removeItem("role");
        window.localStorage.removeItem("username");
        window.localStorage.removeItem("password");
        window.localStorage.removeItem("accessToken");
        window.localStorage.removeItem("refreshToken");
        window.localStorage.removeItem("checkRemember");
        window.location.reload();
    }

    return (
        <HelmetProvider>
            <div className="admin-wrapper">
                <div className="sidebar">
                <div className="logo-details">
                    <img
                    className="bx bx-menu"
                    src={menuBar}
                    alt="menuBar"
                    width={55}
                    height={39}
                    />
                </div>
                <ul className="nav-links">
                    <li>
                    <a
                        className={
                        location.pathname == "/admin"
                            ? "sidebar-active sidebar-style cursor-pointer"
                            : "sidebar-style cursor-pointer"
                        }
                        onClick={() => navigate("/admin")}
                    >
                        <img
                        className="bx bx-menu"
                        src={
                            location.pathname == "/admin" ? dashboardBlack : dashboard
                        }
                        alt="menuBar"
                        width={26}
                        height={26}
                        />
                        <span className="link_name ms-3">Dashboard</span>
                    </a>
                    <ul className="sub-menu blank">
                        <li>
                        <a className="link_name cursor-pointer">Dashboard</a>
                        </li>
                    </ul>
                    </li>

                    <li className="mt-3">
                    <a
                        className={
                        location.pathname == "/admin/lastdata"
                            ? "sidebar-active sidebar-style cursor-pointer"
                            : "sidebar-style cursor-pointer"
                        }
                        onClick={() => navigate("/admin/lastdata")}
                    >
                        <img
                        className="bx bx-menu"
                        src={
                            location.pathname == "/admin/lastdata"
                            ? newsLastdataBlack
                            : newsLastdata
                        }
                        alt="menuBar"
                        width={36}
                        height={33}
                        />
                        <span className="link_name ms-3">Oxirgi ma'lumotlar</span>
                    </a>
                    <ul className="sub-menu blank">
                        <li>
                        <a className="link_name cursor-pointer">Oxirgi ma'lumotlar</a>
                        </li>
                    </ul>
                    </li>

                    <li className="mt-3">
                    <a
                        className={
                        location.pathname == "/admin/data"
                            ? "sidebar-active sidebar-style cursor-pointer"
                            : "sidebar-style cursor-pointer"
                        }
                        onClick={() => navigate("/admin/data")}
                    >
                        <img
                        className="bx bx-menu"
                        src={location.pathname == "/admin/data" ? news : newsWhite}
                        alt="menuBar"
                        width={26}
                        height={26}
                        />
                        <span className="link_name ms-3">Ma'lumotlar</span>
                    </a>
                    <ul className="sub-menu blank">
                        <li>
                        <a className="link_name cursor-pointer">Ma'lumotlar</a>
                        </li>
                    </ul>
                    </li>

                    <li className="mt-3">
                    <a
                        className={
                        location.pathname == "/admin/map"
                            ? "sidebar-active sidebar-style cursor-pointer"
                            : "sidebar-style cursor-pointer"
                        }
                        onClick={() => navigate("/admin/map")}
                    >
                        <img
                        className="bx bx-menu"
                        src={location.pathname == "/admin/map" ? mapBlack : map}
                        alt="menuBar"
                        width={26}
                        height={26}
                        />
                        <span className="link_name ms-3">Xarita</span>
                    </a>
                    <ul className="sub-menu blank">
                        <li>
                        <a className="link_name cursor-pointer">Xarita</a>
                        </li>
                    </ul>
                    </li>

                    <li className="mt-3">
                    <div className="icon-link">
                        <a
                        className={
                            location.pathname == "/admin/stations"
                            ? "sidebar-active sidebar-style cursor-pointer"
                            : "sidebar-style cursor-pointer"
                        }
                        onClick={() => navigate("/admin/stations")}
                        >
                        <img
                            className="bx bx-menu"
                            src={
                            location.pathname == "/admin/stations"
                                ? stations
                                : stationsWhite
                            }
                            alt="menuBar"
                            width={33}
                            height={35}
                        />
                        <span className="link_name ms-3">Stansiyalar</span>
                        </a>
                    </div>
                    <ul className="sub-menu">
                        <li>
                        <a className="link_name cursor-pointer">Stansiyalar</a>
                        </li>
                    </ul>
                    </li>

                    <li className="mt-3 logout-item-admin">
                    <a
                        className="sidebar-style cursor-pointer"
                        onClick={logoutFunction}
                    >
                        <img
                        className="bx bx-menu"
                        src={logout}
                        alt="menuBar"
                        width={26}
                        height={26}
                        />
                        <span className="link_name ms-3">Logout</span>
                    </a>
                    <ul className="sub-menu blank">
                        <li>
                        <a className="link_name cursor-pointer">Logout</a>
                        </li>
                    </ul>
                    </li>
                </ul>
                </div>
                <header className="home-section-header">
                <div className="container-fluid py-3">
                    <div className="dropdown text-end d-flex align-items-center justify-content-between">
                    <h2 className="admin-page-heading m-0">Smart Water</h2>

                    <div className='d-flex'>
                        <img
                        className="bx bx-menu"
                        src={userLogout}
                        alt="menuBar"
                        width={30}
                        height={30}
                        />
                        <span className="mx-2">{username}</span>
                    </div>
                    </div>
                </div>
                </header>

                <Routes>
                <Route
                    path="/*"
                    element={<AdminDashboard />}
                />
                <Route
                    path="/lastdata"
                    element={<AdminLastData />}
                />
                <Route
                    path="/lastdata/:news"
                    element={<AdminLastDataNews />}
                />
                <Route path="/data" element={<AdminData />} />
                <Route path="/map" element={<AdminMap />} />
                <Route
                    path="/stations"
                    element={<AdminStations />}
                />
                </Routes>
            </div>

            <Helmet>
                <script src="../src/assets/js/menuBar.js"></script>
            </Helmet>
        </HelmetProvider>
    );
};

export default Admin;