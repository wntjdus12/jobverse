import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import "./RegisterPage.css"

const RegisterPage = () => {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [secPassword, setSecPassword] = useState('')
    const [error, setError] = useState("")
    const navigate = useNavigate()

    const handleSubmit = async(event) => {
        event.preventDefault()
        try{
            if (password !== secPassword){
            throw new Error("패스워드가 일치하지 않습니다. 다시 입력해주세요.")
            } 
            const response = await api.post('/user', {name, email, password});
            if(response.status == 200){
                navigate('/login')
            }else {
                throw new Error(response.data.error)
            }
            console.log("rrr", response)
        }catch(error){
            setError(error.message)
        }

    }
  return (
    <div className="display-center">
        {error && <div className="red-error">{error}</div>}
      <Form className="login-box" onSubmit={handleSubmit}>
        <h1 style={{ textAlign: "center" , fontWeight: "bold" }}>회원가입</h1>
        <Form.Group className="mb-3" controlId="formName">
          <Form.Label>닉네임</Form.Label>
          <Form.Control type="string" placeholder="Name" onChange={(event)=>setName(event.target.value)}/>
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>이메일</Form.Label>
          <Form.Control type="email" placeholder="Enter email" onChange={(event)=>setEmail(event.target.value)}/>
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>비밀번호</Form.Label>
          <Form.Control type="password" placeholder="Password" onChange={(event)=>setPassword(event.target.value)}/>
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>비밀번호 확인</Form.Label>
          <Form.Control type="password" placeholder="re-enter the password" onChange={(event)=>setSecPassword(event.target.value)}/>
        </Form.Group>

        <Button style={{ display: "block", margin: "0 auto" }} className="button-primary" type="submit">
          회원가입
        </Button>
      </Form>
    </div>
  );
};

export default RegisterPage;
