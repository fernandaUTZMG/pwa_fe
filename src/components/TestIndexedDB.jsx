// src/components/TestIndexedDB.jsx
import React from "react";
import { guardarEnIndexedDB, obtenerPendientes } from "../utils/indexedDB";

const TestIndexedDB = () => {
  const handleGuardar = async () => {
    await guardarEnIndexedDB({ producto: "Labial Rojo", precio: 150 });
    const registros = await obtenerPendientes();
    console.log("Registros en IndexedDB:", registros);
    alert("¡Registro guardado! Revisa IndexedDB en DevTools");
  };

  return (
    <button className="indexeddb-btn" onClick={handleGuardar}>
      Guardar registro de prueba
    </button>
  );
};

export default TestIndexedDB;
