// admin/src/App.jsx
/*import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";

import { db, auth } from "./firebase";
import { ref, onValue, off } from "firebase/database";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Auth from "./Auth";

export default function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [locationsMap, setLocationsMap] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [following, setFollowing] = useState(true);

  // Refs
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const currentLocRef = useRef(null);

  // Surveiller auth admin
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  // Init map (seulement si connecté)
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
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: [2.3522, 48.8566],
      zoom: 12,
    });
    mapRef.current = map;
    return () => map.remove();
  }, [user]);

  // Charger users
  useEffect(() => {
    if (!user) return;
    const usersRef = ref(db, "users");
    const cb = (snap) => {
      const val = snap.val() || {};
      const list = Object.entries(val).map(([id, u]) => ({
        id,
        name: u.name || id,
      }));
      setUsers(list);
    };
    onValue(usersRef, cb);
    return () => off(usersRef);
  }, [user]);

  // Charger locations
  useEffect(() => {
    if (!user) return;
    const locRef = ref(db, "locations");
    const cb = (snap) => {
      const val = snap.val() || {};
      setLocationsMap(val);
    };
    onValue(locRef, cb);
    return () => off(locRef);
  }, [user]);

  // Suivre user sélectionné
  useEffect(() => {
    if (!user) return;

    if (currentLocRef.current) {
      off(currentLocRef.current);
      currentLocRef.current = null;
    }
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    if (!selectedId) return;

    const locRef = ref(db, `locations/${selectedId}`);
    currentLocRef.current = locRef;

    const cb = (snap) => {
      const pos = snap.val();
      if (!pos) return;
      const lngLat = [pos.lng, pos.lat];
      if (!markerRef.current) {
        markerRef.current = new maplibregl.Marker({ color: "red" })
          .setLngLat(lngLat)
          .addTo(mapRef.current);
      } else {
        markerRef.current.setLngLat(lngLat);
      }
      if (following && mapRef.current) {
        mapRef.current.flyTo({ center: lngLat, zoom: 13 });
      }
    };
    onValue(locRef, cb);

    return () => {
      off(locRef);
      if (markerRef.current) markerRef.current.remove();
    };
  }, [user, selectedId, following]);

  // Helpers
  function formatAgo(ts) {
    if (!ts) return "—";
    const d = Math.floor((Date.now() - ts) / 1000);
    if (d < 60) return `${d}s`;
    if (d < 3600) return `${Math.floor(d / 60)}m`;
    return `${Math.floor(d / 3600)}h`;
  }
  function isOnline(ts) {
    return ts && Date.now() - ts < 2 * 60 * 1000;
  }

  // Rendu final
  if (!user) {
    return <Auth onLogin={(u) => setUser(u)} />;
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>👥 Utilisateurs</h2>
        <p className="hint">Clique un nom pour suivre sa position en direct.</p>

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <button
            onClick={() => {
              // Deselect
              setSelectedId(null);
              if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
              }
            }}
            style={{ padding: "6px 10px" }}
          >
            Désélectionner
          </button>

          <label style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={following}
              onChange={(e) => setFollowing(e.target.checked)}
            />
            Follow
          </label>
        </div>

        {// bouton de déconnexion placé juste en dessous }
        <button
          onClick={() => signOut(auth)}
          style={{ marginBottom: 12, padding: "6px 10px", background: "#e74c3c", color: "white" }}
        >
          Déconnexion
        </button>

        <ul className="userList">
          {users.length === 0 && <li className="empty">Aucun utilisateur</li>}
          {users.map((u) => {
            const loc = locationsMap?.[u.id] || null;
            const ts = loc?.ts || null;
            return (
              <li
                key={u.id}
                className={`userItem ${selectedId === u.id ? "active" : ""}`}
                onClick={() => setSelectedId(u.id)}
                title={`Suivre ${u.name}`}
              >
                <span
                  className="dot"
                  style={{ background: isOnline(ts) ? "#27ae60" : "#bbb" }}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span className="name">{u.name}</span>
                  <span className="small">{ts ? formatAgo(ts) : "pas de position"}</span>
                </div>
                <span className="id">{"Employee"}</span>
              </li>
            );
          })}
        </ul>
      </aside>

      <div ref={mapContainer} className="map" />
    </div>
  );
}*/

// admin/src/App.jsx
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";

import { db, auth } from "./firebase";
import { ref, onValue, off } from "firebase/database";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Auth from "./Auth";

export default function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [locationsMap, setLocationsMap] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [following, setFollowing] = useState(true);

  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const currentLocRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // Initialiser la carte une fois connecté
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
            attribution:
              '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: [15.2663, -4.4419], // Kinshasa
      zoom: 12,
    });

    mapRef.current = map;
    return () => map.remove();
  }, [user]);

  // Charger les utilisateurs
  useEffect(() => {
    if (!user) return;
    const usersRef = ref(db, "users");
    const cb = (snap) => {
      const val = snap.val() || {};
      const list = Object.entries(val).map(([id, u]) => ({
        id,
        name: u.name || id,
      }));
      setUsers(list);
    };
    onValue(usersRef, cb);
    return () => off(usersRef);
  }, [user]);

  // Charger les positions
  useEffect(() => {
    if (!user) return;
    const locRef = ref(db, "locations");
    const cb = (snap) => {
      const val = snap.val() || {};
      setLocationsMap(val);
    };
    onValue(locRef, cb);
    return () => off(locRef);
  }, [user]);

  // Animation du marqueur
  const animateMarkerTo = (startLngLat, endLngLat, duration = 1000) => {
    const marker = markerRef.current;
    if (!marker) return;

    const startTime = performance.now();

    const animate = (time) => {
      const t = Math.min((time - startTime) / duration, 1);

      const lng = startLngLat[0] + (endLngLat[0] - startLngLat[0]) * t;
      const lat = startLngLat[1] + (endLngLat[1] - startLngLat[1]) * t;

      marker.setLngLat([lng, lat]);

      if (t < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);
  };

  // Suivre l'utilisateur sélectionné
  useEffect(() => {
    if (!user) return;

    if (currentLocRef.current) {
      off(currentLocRef.current);
      currentLocRef.current = null;
    }
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    if (!selectedId) return;

    const locRef = ref(db, `locations/${selectedId}`);
    currentLocRef.current = locRef;

    const cb = (snap) => {
      const pos = snap.val();
      if (!pos) return;

      const newLngLat = [pos.lng, pos.lat];

      if (!markerRef.current) {
        markerRef.current = new maplibregl.Marker({ color: "red" })
          .setLngLat(newLngLat)
          .addTo(mapRef.current);
      } else {
        const currentLngLat = markerRef.current.getLngLat();
        animateMarkerTo([currentLngLat.lng, currentLngLat.lat], newLngLat);
      }

      if (following && mapRef.current) {
        mapRef.current.flyTo({ center: newLngLat, zoom: 13 });
      }
    };

    onValue(locRef, cb);

    return () => {
      off(locRef);
      if (markerRef.current) markerRef.current.remove();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [user, selectedId, following]);

  const formatAgo = (ts) => {
    if (!ts) return "—";
    const d = Math.floor((Date.now() - ts) / 1000);
    if (d < 60) return `${d}s`;
    if (d < 3600) return `${Math.floor(d / 60)}m`;
    return `${Math.floor(d / 3600)}h`;
  };

  const isOnline = (ts) => ts && Date.now() - ts < 2 * 60 * 1000;

  if (!user) {
    return <Auth onLogin={(u) => setUser(u)} />;
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>👥 Utilisateurs</h2>
        <p className="hint">Clique un nom pour suivre sa position en direct.</p>

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <button
            onClick={() => {
              setSelectedId(null);
              if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
              }
            }}
            style={{ padding: "6px 10px" }}
          >
            Désélectionner
          </button>

          <label style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={following}
              onChange={(e) => setFollowing(e.target.checked)}
            />
            Follow
          </label>
        </div>

        <button
          onClick={() => signOut(auth)}
          style={{ marginBottom: 12, padding: "6px 10px", background: "#e74c3c", color: "white" }}
        >
          Déconnexion
        </button>

        <ul className="userList">
          {users.length === 0 && <li className="empty">Aucun utilisateur</li>}
          {users.map((u) => {
            const loc = locationsMap?.[u.id] || null;
            const ts = loc?.ts || null;
            return (
              <li
                key={u.id}
                className={`userItem ${selectedId === u.id ? "active" : ""}`}
                onClick={() => setSelectedId(u.id)}
                title={`Suivre ${u.name}`}
              >
                <span
                  className="dot"
                  style={{ background: isOnline(ts) ? "#27ae60" : "#bbb" }}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span className="name">{u.name}</span>
                  <span className="small">{ts ? formatAgo(ts) : "pas de position"}</span>
                </div>
                <span className="id">{"Employee"}</span>
              </li>
            );
          })}
        </ul>
      </aside>

      <div ref={mapContainer} className="map" />
    </div>
  );
}


