// admin/src/App.jsx
/*import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";

import * as turf from "@turf/turf";

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

  // communes + geofencing
  const [communesData, setCommunesData] = useState(null);
  const [currentCommune, setCurrentCommune] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const currentLocRef = useRef(null);
  const animationRef = useRef(null);

  const pathRef = useRef([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // Initialiser la carte
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

    // Charger GeoJSON des communes
    map.on("load", async () => {
      try {
        const response = await fetch("/communes.geojson"); // placé dans public/
        const communes = await response.json();
        setCommunesData(communes);

        map.addSource("communes", { type: "geojson", data: communes });

        // Remplissage très discret
        map.addLayer({
          id: "communes-fill",
          type: "fill",
          source: "communes",
          paint: {
            "fill-color": "#4CAF50",
            "fill-opacity": 0.05, // encore plus léger
          },
        });

        // Contours plus doux
        map.addLayer({
          id: "communes-outline",
          type: "line",
          source: "communes",
          paint: {
            "line-color": "#aaa", // gris clair
            "line-width": 1, // finesse
          },
        });

        console.log("Communes chargées !");
      } catch (err) {
        console.error("Erreur chargement communes.geojson", err);
      }
    });

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

  // Charger les positions globales
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
      if (t < 1) animationRef.current = requestAnimationFrame(animate);
    };

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);
  };

  // Helper: trouver la commune
  const findCommune = (lngLat) => {
    if (!communesData) return null;
    const pt = turf.point(lngLat);
    for (const feat of communesData.features) {
      if (turf.booleanPointInPolygon(pt, feat)) {
        return feat.properties?.name || feat.properties?.NAME || "Commune inconnue";
      }
    }
    return null;
  };

  // Suivi utilisateur + tracé + geofencing
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
    pathRef.current = [];
    if (mapRef.current?.getSource("path")) {
      mapRef.current.removeLayer("path-line");
      mapRef.current.removeSource("path");
    }

    setCurrentCommune(null);

    if (!selectedId) return;

    const locRef = ref(db, `locations/${selectedId}`);
    currentLocRef.current = locRef;

    const cb = (snap) => {
      const pos = snap.val();
      if (!pos) return;

      const newLngLat = [pos.lng, pos.lat];

      // Marker
      if (!markerRef.current) {
        markerRef.current = new maplibregl.Marker({ color: "red" })
          .setLngLat(newLngLat)
          .addTo(mapRef.current);
      } else {
        const currentLngLat = markerRef.current.getLngLat();
        animateMarkerTo([currentLngLat.lng, currentLngLat.lat], newLngLat);
      }

      // Path
      pathRef.current.push(newLngLat);
      if (!mapRef.current.getSource("path")) {
        mapRef.current.addSource("path", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: { type: "LineString", coordinates: pathRef.current },
          },
        });
        mapRef.current.addLayer({
          id: "path-line",
          type: "line",
          source: "path",
          paint: {
            "line-color": "#1976d2",
            "line-width": 3,
          },
        });
      } else {
        mapRef.current.getSource("path").setData({
          type: "Feature",
          geometry: { type: "LineString", coordinates: pathRef.current },
        });
      }

      if (following && mapRef.current) {
        mapRef.current.flyTo({ center: newLngLat, zoom: 15 });
      }

      // Détection commune
      const found = findCommune(newLngLat);
      if (found && found !== currentCommune) {
        setNotifications((prev) => [
          { ts: Date.now(), text: `Utilisateur ${selectedId} → ${found}` },
          ...prev,
        ]);
        setCurrentCommune(found);
      }
    };

    onValue(locRef, cb);

    return () => {
      off(locRef);
      if (markerRef.current) markerRef.current.remove();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (mapRef.current?.getSource("path")) {
        mapRef.current.removeLayer("path-line");
        mapRef.current.removeSource("path");
      }
    };
  }, [user, selectedId, following, communesData]);

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
        <div style={{ fontFamily: "'Reey', cursive", fontSize: 25, marginBottom: 15 }}>
          Technoweb
        </div>
        <h2><i className="fas fa-users"></i> Utilisateurs</h2>
        <p className="hint">Clique un nom pour suivre sa position en direct.</p>

        <div className="top-bar">
          <button
            onClick={() => {
              setSelectedId(null);
              if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
              }
              if (mapRef.current?.getSource("path")) {
                mapRef.current.removeLayer("path-line");
                mapRef.current.removeSource("path");
              }
              setCurrentCommune(null);
            }}
            className="deselect-button"
          >
            Désélectionner
          </button>

          <label className="follow-toggle">
            <input
              type="checkbox"
              checked={following}
              onChange={(e) => setFollowing(e.target.checked)}
            />
            Follow
          </label>
        </div>

        <button onClick={() => signOut(auth)} className="logout-button">
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
              >
                <span
                  className="dot"
                  style={{ background: isOnline(ts) ? "#27ae60" : "#bbb" }}
                />
                <div>
                  <span className="name">{u.name}</span> <br />
                  <span className="small">{ts ? formatAgo(ts) : "pas de position"}</span>
                </div>
                {selectedId === u.id && currentCommune && (
                  <span className="communeTag">{currentCommune}</span>
                )}
              </li>
            );
          })}
        </ul>

        
        <div className="notifications">
          <h3>Notifications</h3>
          {notifications.length === 0 && <div className="empty">Aucune notification</div>}
          {notifications.map((n, i) => (
            <div key={i} className="notifItem">
              <div>{n.text}</div>
              <div className="time">{new Date(n.ts).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </aside>

      <div ref={mapContainer} className="map" />
    </div>
  );
}*/

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";

import * as turf from "@turf/turf";

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

  // communes + geofencing
  const [communesData, setCommunesData] = useState(null);
  const [currentCommunes, setCurrentCommunes] = useState({});
  const [notifications, setNotifications] = useState([]);

  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const currentLocRef = useRef(null);
  const animationRef = useRef(null);

  const pathRef = useRef([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

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
      center: [15.2663, -4.4419],
      zoom: 12,
    });

    mapRef.current = map;

    map.on("load", async () => {
      try {
        const response = await fetch("/communes.geojson");
        const communes = await response.json();
        setCommunesData(communes);

        map.addSource("communes", { type: "geojson", data: communes });

        map.addLayer({
          id: "communes-fill",
          type: "fill",
          source: "communes",
          paint: {
            "fill-color": "#4CAF50",
            "fill-opacity": 0.05,
          },
        });

        map.addLayer({
          id: "communes-outline",
          type: "line",
          source: "communes",
          paint: {
            "line-color": "#aaa",
            "line-width": 1,
          },
        });

        console.log("Communes chargées !");
      } catch (err) {
        console.error("Erreur chargement communes.geojson", err);
      }
    });

    return () => map.remove();
  }, [user]);

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

  const animateMarkerTo = (startLngLat, endLngLat, duration = 1000) => {
    const marker = markerRef.current;
    if (!marker) return;
    const startTime = performance.now();

    const animate = (time) => {
      const t = Math.min((time - startTime) / duration, 1);
      const lng = startLngLat[0] + (endLngLat[0] - startLngLat[0]) * t;
      const lat = startLngLat[1] + (endLngLat[1] - startLngLat[1]) * t;
      marker.setLngLat([lng, lat]);
      if (t < 1) animationRef.current = requestAnimationFrame(animate);
    };

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);
  };

  const findCommune = (lngLat) => {
    if (!communesData) return null;
    const pt = turf.point(lngLat);
    for (const feat of communesData.features) {
      if (turf.booleanPointInPolygon(pt, feat)) {
        return feat.properties?.name || feat.properties?.NAME || "Commune inconnue";
      }
    }
    return null;
  };

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
    pathRef.current = [];
    if (mapRef.current?.getSource("path")) {
      mapRef.current.removeLayer("path-line");
      mapRef.current.removeSource("path");
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

      pathRef.current.push(newLngLat);
      if (!mapRef.current.getSource("path")) {
        mapRef.current.addSource("path", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: { type: "LineString", coordinates: pathRef.current },
          },
        });
        mapRef.current.addLayer({
          id: "path-line",
          type: "line",
          source: "path",
          paint: {
            "line-color": "#1976d2",
            "line-width": 3,
          },
        });
      } else {
        mapRef.current.getSource("path").setData({
          type: "Feature",
          geometry: { type: "LineString", coordinates: pathRef.current },
        });
      }

      if (following && mapRef.current) {
        mapRef.current.flyTo({ center: newLngLat, zoom: 15 });
      }

      const found = findCommune(newLngLat);
      setCurrentCommunes((prev) => {
        const previous = prev[selectedId];
        if (found && found !== previous) {
          setNotifications((notif) => [
            { ts: Date.now(), text: `Utilisateur ${selectedId} → ${found}` },
            ...notif,
          ]);
          return { ...prev, [selectedId]: found };
        }
        return prev;
      });
    };

    onValue(locRef, cb);

    return () => {
      off(locRef);
      if (markerRef.current) markerRef.current.remove();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (mapRef.current?.getSource("path")) {
        mapRef.current.removeLayer("path-line");
        mapRef.current.removeSource("path");
      }
    };
  }, [user, selectedId, following, communesData]);

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
        <div className="brand">Technoweb</div>
        <h2><i className="fas fa-users"></i> Utilisateurs</h2>
        <p className="hint">Clique un nom pour suivre sa position en direct.</p>

        <div className="top-bar">
          <button
            onClick={() => {
              setSelectedId(null);
              if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
              }
              if (mapRef.current?.getSource("path")) {
                mapRef.current.removeLayer("path-line");
                mapRef.current.removeSource("path");
              }
              setCurrentCommunes({});
            }}
            className="deselect-button"
          >
            Désélectionner
          </button>

          <label className="follow-toggle">
            <input
              type="checkbox"
              checked={following}
              onChange={(e) => setFollowing(e.target.checked)}
            />
            Follow
          </label>
        </div>

        <button onClick={() => signOut(auth)} className="logout-button">
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
              >
                <span
                  className="dot"
                  style={{ background: isOnline(ts) ? "#27ae60" : "#bbb" }}
                />
                <div>
                  <span className="name">{u.name}</span> <br />
                  <span className="small">{ts ? formatAgo(ts) : "pas de position"}</span>
                </div>
                {selectedId === u.id && currentCommunes[u.id] && (
                  <span className="communeTag">{currentCommunes[u.id]}</span>
                )}
              </li>
            );
          })}
        </ul>

        <div className="notifications">
          <h3>Notifications</h3>
          {notifications.length > 0 && (
            <button className="clear-all-btn" onClick={() => setNotifications([])}>
              Tout supprimer
            </button>
          )}
          {notifications.length === 0 && <div className="empty">Aucune notification</div>}
          {notifications.map((n, i) => (
            <div key={i} className="notifItem">
              <div className="notifContent">
                <span>{n.text}</span>
                <button
                  onClick={() =>
                    setNotifications((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  className="delete-notif-btn"
                  title="Supprimer"
                >
                  ✖
                </button>
              </div>
              <div className="time">{new Date(n.ts).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </aside>

      <div ref={mapContainer} className="map" />
    </div>
  );
}
