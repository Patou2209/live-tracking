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


/*


import { useEffect, useRef, useState } from "react";
import { db, auth } from "./firebase";
import { ref, set, update } from "firebase/database";
import { onAuthStateChanged, signOut } from "firebase/auth";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";
import Auth from "./Auth";

export default function App() {
  const [user, setUser] = useState(null);
  const [sharing, setSharing] = useState(false);
  const mapRef = useRef(null);
  const mapContainer = useRef(null);
  const markerRef = useRef(null);
  const watchIdRef = useRef(null);

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // Init carte dès que l'utilisateur est là
  useEffect(() => {
    if (!mapRef.current && user) {
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
        center: [2.3522, 48.8566], // Centre par défaut : Paris
        zoom: 13,
      });

      mapRef.current = map;
    }
  }, [user]);

  // Fonction pour mettre ou déplacer le marqueur
  const updateMarker = (lat, lng) => {
    if (!mapRef.current) return;
    const lngLat = [lng, lat];

    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({ color: "#2ecc71" })
        .setLngLat(lngLat)
        .addTo(mapRef.current);
    } else {
      markerRef.current.setLngLat(lngLat);
    }

    mapRef.current.flyTo({ center: lngLat, zoom: 15 });
  };

  // Démarrer le partage de position
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

    let firstUpdate = true;

    const options = {
      enableHighAccuracy: true, // demande le GPS si dispo
      timeout: 15000,           // attend max 15s
      maximumAge: 10000,        // accepte une position de 10s max
    };

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

        if (firstUpdate) {
          updateMarker(latitude, longitude); // on centre la carte la première fois
          firstUpdate = false;
        } else {
          markerRef.current?.setLngLat([longitude, latitude]);
        }
      },
      (err) => {
        console.error("Erreur de géolocalisation :", err);
        alert("Erreur lors de la localisation : " + err.message);
      },
      options
    );

    watchIdRef.current = id;
    setSharing(true);
  };

  // Stopper le partage
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

      <div ref={mapContainer} className="map" />

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
} */

  //user/ App.jsx
import { useEffect, useRef, useState } from "react";
import { db, auth } from "./firebase";
import { ref, set, update } from "firebase/database";
import { onAuthStateChanged, signOut } from "firebase/auth";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";
import Auth from "./Auth";

export default function App() {
  const [user, setUser] = useState(null);
  const [sharing, setSharing] = useState(false);

  const mapRef = useRef(null);
  const mapContainer = useRef(null);
  const markerRef = useRef(null);
  const watchIdRef = useRef(null);

  // Authentification
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // Initialisation de la carte (centrée sur Kinshasa par défaut)
  useEffect(() => {
    if (!mapRef.current && user) {
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
        center: [15.3, -4.3], // Kinshasa
        zoom: 13,
      });

      mapRef.current = map;
    }
  }, [user]);

  // Fonction pour créer ou déplacer le marqueur
  const updateMarker = (lat, lng) => {
    const lngLat = [lng, lat];
    const marker = markerRef.current;

    if (!mapRef.current) return;

    if (!marker) {
      // Première fois : créer le marqueur
      markerRef.current = new maplibregl.Marker({ color: "#2ecc71" })
        .setLngLat(lngLat)
        .addTo(mapRef.current);
    } else {
      // Déplacement fluide
      marker.setLngLat(lngLat);
    }
  };

  // Démarrer le partage de localisation
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

    let hasCentered = false;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        // Envoi Firebase
        update(ref(db, `locations/${user.uid}`), {
          lat: latitude,
          lng: longitude,
          ts: Date.now(),
        });

        update(ref(db, `presence/${user.uid}`), {
          online: true,
          lastSeen: Date.now(),
        });

        // Mettre à jour le marqueur
        updateMarker(latitude, longitude);

        // Centrer une seule fois quand la position est précise
        if (!hasCentered && accuracy < 100) {
          mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 15 });
          hasCentered = true;
        }
      },
      (err) => {
        console.error("Erreur géolocalisation :", err);
        alert("Erreur localisation : " + err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );

    watchIdRef.current = id;
    setSharing(true);
  };

  // Arrêter le partage
  const stopSharing = () => {
    if (watchIdRef.current !== null) {
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

  // Clean-up à la fermeture
  useEffect(() => {
    const cleanup = () => stopSharing();
    window.addEventListener("beforeunload", cleanup);
    return () => window.removeEventListener("beforeunload", cleanup);
  }, [user]);

  // Non connecté
  if (!user) return <Auth onLogin={(u) => setUser(u)} />;

  // UI connectée
  return (
    <div className="user-layout">
      <h3 className="title">👋 Bienvenue, {user.email}</h3>

      <div ref={mapContainer} className="map" />

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
            <span className="status">📡 Partage en cours...</span>
          </div>
        )}

        <button className="btn logout" onClick={() => signOut(auth)}>
          Déconnexion
        </button>
      </div>
    </div>
  );
}



