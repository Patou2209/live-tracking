// user/src/Auth.jsx
import { useState } from "react";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import "./Auth.css";

export default function Auth({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!email || !password) {
      setMessage("Veuillez remplir tous les champs.");
      return;
    }

    try {
      let userCred;
      if (isSignup) {
        userCred = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCred = await signInWithEmailAndPassword(auth, email, password);
      }
      setMessage("Connexion réussie !");
      onLogin(userCred.user); // on remonte l’utilisateur connecté
    } catch (err) {
      setMessage("Mot de passe ou email incorrect.");
    }
  };


 
  return (
    <div className="auth-container">
      <h3>{isSignup ? "Inscription" : "Connexion"}</h3>
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
        {isSignup ? "Créer un compte" : "Se connecter"}
      </button>
      <p className="auth-switch">
        {isSignup ? "Déjà inscrit ?" : "Pas encore de compte ?"}{" "}
        <button onClick={() => setIsSignup(!isSignup)} className="auth-link">
          {isSignup ? "Se connecter" : "S'inscrire"}
        </button>
      </p>
      {message && <p className="auth-message">{message}</p>}
    </div>
  );
}
