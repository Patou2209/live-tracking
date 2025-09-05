// admin/src/Auth.jsx
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, ADMIN_EMAIL } from "./firebase";
import "./Auth.css";

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!email || !password) {
      setMessage("Veuillez remplir tous les champs.");
      return;
    }

    try {
      if (email !== ADMIN_EMAIL) {
        setMessage("Accès refusé : cet utilisateur n'est pas admin.");
        return;
      }

      const userCred = await signInWithEmailAndPassword(auth, email, password);
      setMessage("Connexion réussie !");
      onLogin(userCred.user);
    } catch (err) {
      setMessage("Erreur : " + err.message);
    }
  };

  return (
    <div className="auth-container">
      <h3>Connexion Admin</h3>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="auth-input"
      />
      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="auth-input"
      />
      <button onClick={handleSubmit} className="auth-btn">
        Se connecter
      </button>
      {message && <p className="auth-message">{message}</p>}
    </div>
  );
}
