// user/src/App.jsx
import { useEffect, useRef, useState } from "react";
import { db, auth } from "./firebase";
import { ref, set, update } from "firebase/database";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Auth from "./Auth";
import "./App.css"; // <-- ton CSS pour les styles

export default function App() {
  const [user, setUser] = useState(null);
  const [sharing, setSharing] = useState(false);
  const watchIdRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // clean-up presence + geolocation
  useEffect(() => {
    const cleanup = () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (user) {
        update(ref(db, `presence/${user.uid}`), {
          online: false,
          lastSeen: Date.now(),
        }).catch(() => {});
      }
    };
    window.addEventListener("beforeunload", cleanup);
    return () => window.removeEventListener("beforeunload", cleanup);
  }, [user]);

  const startSharing = async () => {
    if (!user) return;

    // write profile
    await set(ref(db, `users/${user.uid}`), {
      name: user.email, // tu peux remplacer par displayName si tu veux
      createdAt: Date.now(),
    });

    if (!("geolocation" in navigator)) {
      alert("Votre navigateur ne supporte pas la géolocalisation.");
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        update(ref(db, `locations/${user.uid}`), {
          lat: latitude,
          lng: longitude,
          ts: Date.now(),
        });
        update(ref(db, `presence/${user.uid}`), {
          online: true,
          lastSeen: Date.now(),
        });
      },
      (err) => {
        console.error("Erreur GPS", err);
        alert("Impossible d'obtenir la position : " + (err.message || err.code));
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    watchIdRef.current = id;
    setSharing(true);
  };

  const stopSharing = () => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharing(false);
    if (user) {
      update(ref(db, `presence/${user.uid}`), {
        online: false,
        lastSeen: Date.now(),
      }).catch(() => {});
    }
  };

  // Si pas connecté → afficher la page Auth
  if (!user) return <Auth onLogin={(u) => setUser(u)} />;

  // Sinon → interface stylée
  return (
    <div className="user-layout">
      <h3 className="title">👋 Bienvenue, {user.email}</h3>


      <div className="form">

        {!sharing ? (
          <button className="btn start" onClick={startSharing}>
            Demarrer le partage
          </button>
        ) : (
          <div className="sharing">
            <button className="btn stop" onClick={stopSharing}>
            Stopper le partage
            </button>
            <span className="status"> Votre partage est actif !</span>
          </div>
        )}

        <button className="btn logout" onClick={() => signOut(auth)}>
        Déconnexion
        </button>
        
      </div>
    </div>
  );
}



