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
// user/src/App.jsx
import { useEffect, useRef, useState } from "react";
import { db, auth } from "./firebase";
import { ref, set, update } from "firebase/database";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Auth from "./Auth";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [sharing, setSharing] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapContainer = useRef(null);
  const watchIdRef = useRef(null);

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // Init map
  useEffect(() => {
    if (!user) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: [
              "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: [0, 0],
      zoom: 2,
    });

    mapRef.current = map;

    return () => map.remove();
  }, [user]);

  // Mise à jour du marqueur et centrage fluide
  const updateMarker = (lat, lng) => {
    if (!mapRef.current) return;

    const lngLat = [lng, lat];

    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({ color: "blue" })
        .setLngLat(lngLat)
        .addTo(mapRef.current);
    } else {
      markerRef.current.setLngLat(lngLat);
    }

    // Fly to the new location
    mapRef.current.flyTo({ center: lngLat, zoom: 15, speed: 1.2 });
  };

  // Start sharing
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
        const { latitude, longitude, accuracy } = pos.coords;

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

        // update marker
        updateMarker(latitude, longitude);
      },
      (err) => {
        console.error("Erreur GPS", err);
        alert("Erreur lors de la localisation : " + err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 15000,
      }
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

      {/* Carte utilisateur */}
      <div ref={mapContainer} style={{ height: "75vh", width: "100%" }} className="map" />

      {/* Contrôles */}
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
            <span className="status">Partage actif !</span>
          </div>
        )}

        <button className="btn logout" onClick={() => signOut(auth)}>
          Déconnexion
        </button>
      </div>
    </div>
  );
}
