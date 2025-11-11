// src/db.js
const DB_NAME = "database";
const DB_VERSION = 2;
const STORE_USERS = "users";
const STORE_PRODUCTS = "products";
const STORE_CARTS = "carts";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_USERS)) {
        db.createObjectStore(STORE_USERS, { keyPath: "userId" });
      }
      if (!db.objectStoreNames.contains(STORE_PRODUCTS)) {
        db.createObjectStore(STORE_PRODUCTS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_CARTS)) {
        db.createObjectStore(STORE_CARTS, { keyPath: "userId" });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

// ---------- USUARIOS ----------
export async function saveUser(user) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_USERS, "readwrite");
    const store = tx.objectStore(STORE_USERS);
    store.put(user);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("saveUser error:", err);
    throw err;
  }
}

export async function getUser(email) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_USERS, "readonly");
    const store = tx.objectStore(STORE_USERS);
    const getAll = store.getAll();

    return new Promise((resolve, reject) => {
      getAll.onsuccess = () => {
        const user = getAll.result.find((u) => u.email === email);
        resolve(user);
      };
      getAll.onerror = () => reject(getAll.error);
    });
  } catch (err) {
    console.error("getUser error:", err);
    throw err;
  }
}

// ---------- PRODUCTOS ----------
export async function saveProducts(products) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_PRODUCTS, "readwrite");
    const store = tx.objectStore(STORE_PRODUCTS);

    products.forEach((p) => {
      store.put({ ...p, id: p._id || p.id });
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("saveProducts error:", err);
    throw err;
  }
}

export async function getProducts() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_PRODUCTS, "readonly");
    const store = tx.objectStore(STORE_PRODUCTS);
    const getAll = store.getAll();

    return new Promise((resolve, reject) => {
      getAll.onsuccess = () => resolve(getAll.result);
      getAll.onerror = () => reject(getAll.error);
    });
  } catch (err) {
    console.error("getProducts error:", err);
    throw err;
  }
}

// ---------- CARRITO ----------
export async function saveCart(cartItems, userId = "default") {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CARTS, "readwrite");
    const store = tx.objectStore(STORE_CARTS);
    store.put({ userId, items: cartItems });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("saveCart error:", err);
    throw err;
  }
}

export async function getCart(userId = "default") {
  if (!userId) {
    console.warn("⚠️ getCart llamado sin userId, usando 'default'");
    userId = "default";
  }

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CARTS, "readonly");
    const store = tx.objectStore(STORE_CARTS);
    const getItem = store.get(userId);

    return new Promise((resolve, reject) => {
      getItem.onsuccess = () => resolve(getItem.result?.items || []);
      getItem.onerror = () => reject(getItem.error);
    });
  } catch (err) {
    console.error("getCart error:", err);
    throw err;
  }
}
