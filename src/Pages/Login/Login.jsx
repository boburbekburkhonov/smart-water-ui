import React, { useEffect, useState } from 'react';
import logo from "../../assets/images/logo.svg";
import './Login.css'
import { api } from '../Api/Api';

const Login = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [error, setError] = useState(false);
  const [checkRemember, setCheckRemember] = useState("off");

  useEffect(() => {
    if (window.localStorage.getItem("checkRemember") == "on") {
      fetch(`${api}/auth/signIn`, {
        method: "post",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          username: window.localStorage.getItem("username"),
          password: window.localStorage.getItem("password"),
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.statusCode == 200) {
            window.localStorage.setItem("accessToken", data.data.accessToken);
            window.localStorage.setItem("refreshToken", data.data.refreshToken);
            if (data.data.user?.role != "SUPERADMIN") {
              window.location.href = "/user";
            }
          }
        });
    }
    if(localStorage.getItem('accessToken')){
      window.location.href = "/user";

    }
  }, []);

  const loginUser = async (e) => {
    e.preventDefault();

    const { username, password } = e.target;

    const request = await fetch(`${api}/auth/signin`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    });

    const response = await request.json();

    if (response.statusCode == 200) {
      window.localStorage.setItem("username", username.value);
      window.localStorage.setItem("password", password.value);
      window.localStorage.setItem("name", response.data.user.name);
      window.localStorage.setItem("role", response.data.user.role);
      window.localStorage.setItem("checkRemember", checkRemember);
      window.localStorage.setItem("accessToken", response.data.accessToken);
      window.localStorage.setItem("refreshToken", response.data.refreshToken);
      if (response.data.user?.role != "SUPERADMIN") {
        window.location.href = "/user";
      }
    } else {
      setError(true);
      setErrorMessage("Username yoki password noto'g'ri!");
    }

    username.value = "";
    password.value = "";
  };

  return (
    <div className="login-root">
    <div className="box-root flex-flex flex-direction--column" style={{minHeight: '100vh', flexGrow: 1}}>
      <div className="loginbackground box-background--white padding-top--64">
        <div className="loginbackground-gridContainer">
          <div className="box-root flex-flex" style={{gridArea: "top / start / 8 / end"}}>
            <div className="box-root" style={{backgroundImage: 'linear-gradient(white 0%, rgb(247, 250, 252) 33%))', flexGrow: 1}}>
            </div>
          </div>
          <div className="box-root flex-flex" style={{gridArea: '4 / 2 / auto / 5'}}>
            <div className="box-root box-divider--light-all-2 animationLeftRight tans3s" style={{flexGrow: 1}}></div>
          </div>
          <div className="box-root flex-flex" style={{gridArea: '6 / start / auto / 2'}}>
            <div className="box-root box-background--blue800" style={{flexGrow: 1}}></div>
          </div>
          <div className="box-root flex-flex" style={{gridArea: '7 / start / auto / 4'}}>
            <div className="box-root box-background--blue animationLeftRight" style={{flexGrow: 1}}></div>
          </div>
          <div className="box-root flex-flex" style={{gridArea: '8 / 4 / auto / 6'}}>
            <div className="box-root box-background--gray100 animationLeftRight tans3s" style={{flexGrow: 1}}></div>
          </div>
          <div className="box-root flex-flex" style={{gridArea: '2 / 15 / auto / end'}}>
            <div className="box-root box-background--cyan200 animationRightLeft tans4s" style={{flexGrow: 1}}></div>
          </div>
          <div className="box-root flex-flex" style={{gridArea: '3 / 14 / auto / end'}}>
            <div className="box-root box-background--blue animationRightLeft" style={{flexGrow: 1}}></div>
          </div>
          <div className="box-root flex-flex" style={{gridArea: '4 / 17 / auto / 20'}}>
            <div className="box-root box-background--gray100 animationRightLeft tans4s" style={{flexGrow: 1}}></div>
          </div>
          <div className="box-root flex-flex" style={{gridArea: '5 / 14 / auto / 17'}}>
            <div className="box-root box-divider--light-all-2 animationRightLeft tans3s" style={{flexGrow: 1}}></div>
          </div>
        </div>
      </div>
      <div className="box-root padding-top--24 flex-flex flex-direction--column" style={{flexGrow: 1, zIndex: 9}}>
        <div className="box-root padding-top--48 padding-bottom--24 flex-flex flex-justifyContent--center">
        </div>
        <div className="formbg-outer">
          <div className="formbg">
            <div className="formbg-inner padding-horizontal--48">
            <div className="text-center">
                    <div className="d-inline-block auth-logo">
                      <img src={logo} alt="JSLPS image" height="80" />
                    </div>
                    <h3 className="mt-3 fw-semibold main-color">
                    Smart Water
                    </h3>
                  </div>
              <form id="stripe-login" onSubmit={loginUser}>
                <div className="field padding-bottom--24">
                  <label htmlFor="email" className='fs-5'>Username</label>
                  <input type="text" name="username" placeholder='username' required />
                </div>
                <div className="field padding-bottom--24">
                  <div className="grid--50-50">
                    <label htmlFor="password" className='fs-5'>Password</label>
                  </div>
                  <input type="password" name="password" placeholder='password' required />
                </div>
                <div className="field field-checkbox  flex-flex align-center">
                  <label htmlFor="checkbox">
                    <input type="checkbox" name="checkbox" onChange={() =>
                          setCheckRemember(
                            checkRemember == "off" ? "on" : "off"
                          )
                        } /> Eslab qolish
                  </label>
                </div>

                <p className="error-message text-danger fw-semibold m-0 mt-3 mb-3 text-center fs-5">
                      {error ? errorMessage : ""}
                    </p>
                <div className="field padding-bottom--24">
                  <button className='btn btn-primary w-100 main-background-color'>Kirish</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default Login;