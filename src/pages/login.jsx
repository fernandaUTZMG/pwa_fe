import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // 👈 importar navigate
import "./login.css"; // Mantén tu CSS actual

export default function Login() {
  const [showRegister, setShowRegister] = useState(false);

  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Registro
  const [username, setUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const navigate = useNavigate(); // 👈 hook para redirigir

  const handleLogin = () => {
    axios
      .post("http://localhost:5000/login", { email, password })
      .then((res) => {
        alert(res.data.message);
        localStorage.setItem("userId", res.data.userId);
        localStorage.setItem("token", res.data.token); // 👈 guardar token si lo usas
        navigate("/products"); // 👈 redirige a productos
      })
      .catch((err) =>
        alert(err.response?.data?.error || "Error en login")
      );
  };

  const handleRegister = () => {
    axios
      .post("http://localhost:5000/register", {
        username,
        email: regEmail,
        password: regPassword,
      })
      .then((res) => {
        alert(res.data.message);
        setShowRegister(false);
        setUsername("");
        setRegEmail("");
        setRegPassword("");
      })
      .catch((err) =>
        alert(err.response?.data?.error || "Error en registro")
      );
  };

  return (
    <div className="login-container">
      <div className="login-form">
        {!showRegister ? (
          <>
            <h1>Iniciar Sesión</h1>
            <input
              type="email"
              placeholder="Correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleLogin}>Ingresar</button>

            <p style={{ marginTop: "15px" }}>
              ¿No tienes cuenta?{" "}
              <span
                onClick={() => setShowRegister(true)}
                style={{
                  color: "#ff7eb3",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Regístrate
              </span>
            </p>
          </>
        ) : (
          <>
            <h1>Registro</h1>
            <input
              type="text"
              placeholder="Nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="email"
              placeholder="Correo"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
            />
            <button onClick={handleRegister}>Registrarse</button>

            <p style={{ marginTop: "15px" }}>
              ¿Ya tienes cuenta?{" "}
              <span
                onClick={() => setShowRegister(false)}
                style={{
                  color: "#ff7eb3",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Inicia sesión
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
