import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; 
import "./login.css";
import { saveUser, getUser } from "../db";
import { subscribeUserToPush } from "../pushManager";

export default function Login() {
  const [showRegister, setShowRegister] = useState(false);

  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Registro
  const [username, setUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  console.log("API_URL:", API_URL);

  // ------------------ LOGIN ------------------
  const handleLogin = async () => {
    if (loading) return; 
    setLoading(true);

    if (navigator.onLine) {
      try {
        const res = await axios.post(
          `${API_URL}/login`,
          { email, password },
          { headers: { "Content-Type": "application/json" } } // evita problemas de CORS
        );

        console.log("🧩 LOGIN RESPONSE:", res.data);

        // Guardar datos localmente
        localStorage.setItem("userId", res.data.userId);
        localStorage.setItem("token", res.data.token);
        await saveUser({ userId: res.data.userId, email, password });

        // Suscripción a push notifications
        await subscribeUserToPush(res.data.userId);

        // Mensaje y navegación
        alert(res.data.message);
        navigate("/products");

      } catch (err) {
        console.error("🔴 ERROR LOGIN AXIOS:", err);
        console.error("📦 RESPONSE COMPLETA:", err.response);
        alert(err.response?.data?.error || "Error en login");
      } finally {
        setLoading(false);
      }
    } else {
      // Modo offline
      try {
        const user = await getUser(email);
        if (user && user.password === password) {
          localStorage.setItem("userId", user.userId);
          alert("Inicio de sesión en modo offline");
          navigate("/products");
        } else {
          alert("No puedes iniciar sesión sin internet porque tus datos no coinciden.");
        }
      } catch (err) {
        console.error("Error login offline:", err);
        alert("No puedes iniciar sesión sin internet.");
      } finally {
        setLoading(false);
      }
    }
  };

  // ------------------ REGISTER ------------------
  const handleRegister = async () => {
    if (navigator.onLine) {
      try {
        const res = await axios.post(
          `${API_URL}/register`,
          { username, email: regEmail, password: regPassword },
          { headers: { "Content-Type": "application/json" } }
        );
        alert(res.data.message);
        setShowRegister(false);
        setUsername(""); setRegEmail(""); setRegPassword("");
      } catch (err) {
        console.error("🔴 ERROR REGISTER AXIOS:", err);
        alert(err.response?.data?.error || "Error en registro");
      }
    } else {
      const pendingUsers = JSON.parse(localStorage.getItem("pendingUsers") || "[]");
      pendingUsers.push({ username, email: regEmail, password: regPassword });
      localStorage.setItem("pendingUsers", JSON.stringify(pendingUsers));
      alert("Registro guardado localmente. Se sincronizará cuando tengas internet.");
      setShowRegister(false);
      setUsername(""); setRegEmail(""); setRegPassword("");
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        {!showRegister ? (
          <>
            <h1>Iniciar Sesión</h1>
            <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={handleLogin} disabled={loading}>
              {loading ? "Cargando..." : "Ingresar"}
            </button>
            <p style={{ marginTop: "15px" }}>
              ¿No tienes cuenta?{" "}
              <span onClick={() => setShowRegister(true)} className="link-action">Regístrate</span>
            </p>
          </>
        ) : (
          <>
            <h1>Registro</h1>
            <input type="text" placeholder="Nombre de usuario" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input type="email" placeholder="Correo" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
            <input type="password" placeholder="Contraseña" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
            <button onClick={handleRegister}>Registrarse</button>
            <p style={{ marginTop: "15px" }}>
              ¿Ya tienes cuenta?{" "}
              <span onClick={() => setShowRegister(false)} className="link-action">Inicia sesión</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
