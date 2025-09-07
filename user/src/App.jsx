// user/src/App.jsx
/*import { useEffect, useRef, useState } from "react";
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
}*/
// user/src/App.jsx
import { useEffect, useRef, useState } from "react";
import { db, auth } from "./firebase";
import { ref, set, update } from "firebase/database";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Auth from "./Auth";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [sharing, setSharing] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // init map
  useEffect(() => {
    if (!mapRef.current && user) {
      mapRef.current = L.map("map").setView([0, 0], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(mapRef.current);
    }
  }, [user]);

  const updateMarker = (lat, lng) => {
    if (!mapRef.current) return;
    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
    mapRef.current.setView([lat, lng], 15);
  };

  const startSharing = async () => {
    if (!user) return;

    await set(ref(db, `users/${user.uid}`), {
      name: user.email,
      createdAt: Date.now(),
    });

    if (!("geolocation" in navigator)) {
      alert("Votre navigateur ne supporte pas la géolocalisation.");
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        // update DB
        update(ref(db, `locations/${user.uid}`), {
          lat: latitude,
          lng: longitude,
          ts: Date.now(),
        });
        update(ref(db, `presence/${user.uid}`), {
          online: true,
          lastSeen: Date.now(),
        });

        // update map marker
        updateMarker(latitude, longitude);
      },
      (err) => {
        console.error("Erreur GPS", err);
        alert("Impossible d'obtenir la position : " + (err.message || err.code));
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 }
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

  if (!user) return <Auth onLogin={(u) => setUser(u)} />;

  return (
    <div className="user-layout">
      <h3 className="title">👋 Bienvenue, {user.email}</h3>
      { }
      <div id="map" style={{ height: "75vh", width: "100%" }} />

      { }
      <div className="controls">
        

        {!sharing ? (
          <button className="btn start" onClick={startSharing}>
            Démarrer le partage
          </button>
        ) : (
          <div className="sharing">
            <button className="btn stop" onClick={stopSharing}>
              Stopper le partage
            </button>
            <span className="status">Votre partage est actif !</span>
          </div>
        )}

        <button className="btn logout" onClick={() => signOut(auth)}>
          Déconnexion
        </button>
      </div>
    </div>
  );
}




