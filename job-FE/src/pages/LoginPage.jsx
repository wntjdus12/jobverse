import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api from "../utils/api";
import "./LoginPage.css"

const LoginPage = ({setUser, user}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const response = await api.post('/user/login', { email, password });
      if (response.status === 200) {
        setUser(response.data.user);
        sessionStorage.setItem("token", response.data.token);
        api.defaults.headers["authorization"] = "Bearer " + response.data.token;
        setError("");
        navigate("/");
      }
      throw new Error(response.message);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSocialLogin = (provider) => {
    window.location.href = `http://your-backend-url.com/auth/${provider}`;
    // 예시: /auth/kakao 또는 /auth/google
  };
  
  if(user){
    return <Navigate to="/"/>
  }

  return (
    <div className="display-center login-box-wrapper">
      <div className="bus-track">
        <img src="/job.png" width={160} className="moving-bus" alt="JobVerse Bus"  />
      </div>
      <div>
        {error && <div className="red-error">{error}</div>}
      <Form className="login-box" onSubmit={handleLogin}>
        <h5 style={{marginLeft:20}}>반가워요!</h5>
        
        <h2><span style={{fontWeight:1000, color:"#9370DB"}}>" JobVerse "</span> 에 오신 것을 환영해요</h2>
        <hr></hr>
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>이메일</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            onChange={(event) => setEmail(event.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>비밀번호</Form.Label>
          <Form.Control
            type="password"
            placeholder="Password"
            onChange={(event) => setPassword(event.target.value)}
          />
        </Form.Group>

        <div className="button-box">
          <Button style={{ display: "block", marginLeft:"180px" }} type="submit" className="button-primary">
            로그인
          </Button>
          <span className="register-text">
            계정이 없다면? <Link to="/register" className="register-link">회원가입 하기</Link>
          </span>
        </div>

        
        <div className="divider">
          <span>OR</span>
        </div>
        <div className="social-buttons">
          <img
            src="/kakao-icon.png"
            alt="카카오 로그인"
            onClick={() => handleSocialLogin("kakao")}
            className="social-icon"
            width={30}
            style={{marginLeft:10}}
          />
          <img
            src="/google-icon.png"
            alt="구글 로그인"
            onClick={() => handleSocialLogin("google")}
            className="social-icon"
            width={50}
          />
        </div>

      </Form>
      </div> 
    </div>
  );
};

export default LoginPage;
