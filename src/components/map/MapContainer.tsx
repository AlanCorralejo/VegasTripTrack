"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { 
  Search, 
  MapPin, 
  Trash2, 
  Sparkles, 
  ArrowUp, 
  ArrowDown, 
  Clock, 
  Navigation, 
  RotateCcw,
  Check,
  Plus,
  GripVertical
} from "lucide-react";

interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

// Iconic Las Vegas locations for quick access
const QUICK_LOCATIONS: Omit<Location, "id">[] = [
  { name: "Bellagio", lat: 36.1129, lng: -115.1765 },
  { name: "Caesars Palace", lat: 36.1162, lng: -115.1745 },
  { name: "The Venetian", lat: 36.1212, lng: -115.1697 },
  { name: "MGM Grand", lat: 36.1026, lng: -115.1702 },
  { name: "Welcome Sign", lat: 36.0820, lng: -115.1728 },
  { name: "Fremont St", lat: 36.1699, lng: -115.1439 },
  { name: "Stratosphere", lat: 36.1475, lng: -115.1556 },
];

export function MapContainer() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(true);
  const [darkTheme, setDarkTheme] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.FeatureGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline[]>([]);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // 1. Monitor theme updates (Dark Mode matching)
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setDarkTheme(isDark);
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      // Centered on Las Vegas Strip
      const map = L.map(mapContainerRef.current, {
        zoomControl: false, // Custom placement later
      }).setView([36.1147, -115.1728], 13);
      mapRef.current = map;

      // Add zoom control to bottom right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Add tile layer
      const tilesUrl = darkTheme
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

      const tiles = L.tileLayer(tilesUrl, {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);
      tileLayerRef.current = tiles;

      // Create layer for markers
      markersLayerRef.current = L.featureGroup().addTo(map);

      // Handle map clicks to place custom pins
      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const formattedLat = parseFloat(lat.toFixed(5));
        const formattedLng = parseFloat(lng.toFixed(5));
        
        const newLoc: Location = {
          id: `click-${Date.now()}`,
          name: `Pin (${formattedLat}, ${formattedLng})`,
          lat: formattedLat,
          lng: formattedLng,
        };

        setLocations((prev) => {
          const updated = [...prev, newLoc];
          return autoOptimize ? solveAndSetRoute(updated) : updated;
        });
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 3. React to Dark/Light theme changes
  useEffect(() => {
    if (tileLayerRef.current) {
      const tilesUrl = darkTheme
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
      tileLayerRef.current.setUrl(tilesUrl);
    }
  }, [darkTheme]);

  // 4. Debounced Search Suggestion Loading (Nominatim OSM)
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        // Querying OSM Nominatim with Las Vegas keyword for relevance
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery + " Las Vegas"
          )}&limit=5`
        );
        if (response.ok) {
          const data: Suggestion[] = await response.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error("Geocoding fetch error:", err);
      } finally {
        setLoadingSearch(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Haversine Distance helper
  const getHaversineDistance = (l1: { lat: number; lng: number }, l2: { lat: number; lng: number }) => {
    const R = 6371; // Earth radius in km
    const dLat = ((l2.lat - l1.lat) * Math.PI) / 180;
    const dLng = ((l2.lng - l1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((l1.lat * Math.PI) / 180) *
        Math.cos((l2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Traveling Salesperson Problem Solver (TSP)
  const solveAndSetRoute = (locs: Location[]): Location[] => {
    if (locs.length <= 2) return locs;

    // Pin the first stop as start point
    const start = locs[0];
    const pool = locs.slice(1);

    // If small amount of points, solve optimally using brute force
    if (pool.length <= 7) {
      let bestRoute = [start, ...pool];
      let minDistance = Infinity;

      const permute = (arr: Location[], accumulated: Location[] = []) => {
        if (arr.length === 0) {
          const currentRoute = [start, ...accumulated];
          let dist = 0;
          for (let i = 0; i < currentRoute.length - 1; i++) {
            dist += getHaversineDistance(currentRoute[i], currentRoute[i + 1]);
          }
          if (dist < minDistance) {
            minDistance = dist;
            bestRoute = currentRoute;
          }
        } else {
          for (let i = 0; i < arr.length; i++) {
            const current = arr.slice();
            const next = current.splice(i, 1);
            permute(current.slice(), accumulated.concat(next));
          }
        }
      };

      permute(pool);
      return bestRoute;
    } else {
      // Nearest Neighbor Greedy Heuristic
      const route = [start];
      const unvisited = [...pool];
      let current = start;

      while (unvisited.length > 0) {
        let nearestIndex = 0;
        let minDistance = Infinity;

        for (let i = 0; i < unvisited.length; i++) {
          const d = getHaversineDistance(current, unvisited[i]);
          if (d < minDistance) {
            minDistance = d;
            nearestIndex = i;
          }
        }

        current = unvisited[nearestIndex];
        route.push(current);
        unvisited.splice(nearestIndex, 1);
      }

      return route;
    }
  };

  // Trigger optimization manually
  const handleOptimizeManual = () => {
    if (locations.length <= 2) return;
    const optimized = solveAndSetRoute(locations);
    setLocations(optimized);
  };

  // Add location to route
  const addLocation = (name: string, lat: number, lng: number) => {
    const newLoc: Location = {
      id: `${Date.now()}-${Math.random()}`,
      name,
      lat,
      lng,
    };

    setLocations((prev) => {
      const updated = [...prev, newLoc];
      return autoOptimize ? solveAndSetRoute(updated) : updated;
    });
    setSearchQuery("");
    setSuggestions([]);
  };

  // Remove location
  const removeLocation = (id: string) => {
    setLocations((prev) => {
      const updated = prev.filter((loc) => loc.id !== id);
      return autoOptimize ? solveAndSetRoute(updated) : updated;
    });
  };

  // Move location manual ordering
  const moveLocation = (index: number, direction: "up" | "down") => {
    if (autoOptimize) return; // Disabled under autoOptimize
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= locations.length) return;

    const updated = [...locations];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setLocations(updated);
  };

  // Drag and Drop Event Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (autoOptimize) return;
    e.dataTransfer.setData("text/plain", index.toString());
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (autoOptimize) return;
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    setDraggedIndex(null);
    if (autoOptimize) return;

    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(fromIndex) || fromIndex === targetIndex) return;

    const updated = [...locations];
    const [removed] = updated.splice(fromIndex, 1);
    updated.splice(targetIndex, 0, removed);
    setLocations(updated);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Clear all locations
  const handleClearAll = () => {
    setLocations([]);
    setRouteInfo(null);
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    }
    routeLayerRef.current.forEach((layer) => layer.remove());
    routeLayerRef.current = [];
  };

  // 5. Update Map Elements on locations change
  useEffect(() => {
    const updateMap = async () => {
      const map = mapRef.current;
      const markersLayer = markersLayerRef.current;
      if (!map || !markersLayer) return;

      // Clean existing overlays
      markersLayer.clearLayers();
      routeLayerRef.current.forEach((layer) => layer.remove());
      routeLayerRef.current = [];

      if (locations.length === 0) {
        setRouteInfo(null);
        return;
      }

      // 1. Draw markers for all stops
      locations.forEach((loc, index) => {
        const customIcon = L.divIcon({
          html: `<div class="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground font-black border-2 border-card shadow-md text-xs select-none">
                   ${index + 1}
                 </div>`,
          className: "custom-stop-marker-wrapper",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([loc.lat, loc.lng], { icon: customIcon });
        marker.bindPopup(`
          <div class="p-1 font-sans text-xs">
            <p class="font-bold text-foreground text-sm">${index + 1}. ${loc.name}</p>
            <p class="text-muted-foreground mt-1">Coordenadas: ${loc.lat}, ${loc.lng}</p>
          </div>
        `);
        markersLayer.addLayer(marker);
      });

      // 2. Fetch OSRM routing if 2 or more paradas
      if (locations.length >= 2) {
        setLoadingRoute(true);
        // OSRM coordinates URL format: lon1,lat1;lon2,lat2
        const coordsQuery = locations
          .map((loc) => `${loc.lng},${loc.lat}`)
          .join(";");

        try {
          const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${coordsQuery}?overview=full&geometries=geojson`
          );
          
          if (res.ok) {
            const data = await res.json();
            if (data.routes && data.routes.length > 0) {
              const route = data.routes[0];
              const geojsonCoords = route.geometry.coordinates;

              // Convert OSRM GeoJSON coords [lon, lat] to Leaflet [lat, lon]
              const leafletCoords = geojsonCoords.map((coord: [number, number]) => [
                coord[1],
                coord[0],
              ]);

              // Neon Gold Vegas Route Style
              const glowLine = L.polyline(leafletCoords, {
                color: "#eab308", // Yellow-500 glow
                weight: 7,
                opacity: 0.3,
                lineCap: "round",
                lineJoin: "round",
              }).addTo(map);

              const mainLine = L.polyline(leafletCoords, {
                color: "#eab308", // Golden route line
                weight: 3.5,
                opacity: 0.95,
                lineCap: "round",
                lineJoin: "round",
              }).addTo(map);

              routeLayerRef.current = [glowLine, mainLine];

              // Save metrics (distance in km, duration in minutes)
              setRouteInfo({
                distance: route.distance / 1000,
                duration: route.duration / 60,
              });

              // Fit bounds to fit route
              map.fitBounds(markersLayer.getBounds(), {
                padding: [50, 50],
                maxZoom: 16,
              });
            }
          } else {
            throw new Error("Route calculation error");
          }
        } catch (err) {
          console.error("OSRM Route API failed, drawing straight lines fallback:", err);
          // Fallback straight dotted lines
          const straightCoords = locations.map((loc) => [loc.lat, loc.lng] as L.LatLngExpression);
          const fallbackLine = L.polyline(straightCoords, {
            color: "#ef4444",
            weight: 3,
            dashArray: "6, 8",
            opacity: 0.75,
          }).addTo(map);
          routeLayerRef.current = [fallbackLine];

          // Compute approximate Haversine distance
          let totalDist = 0;
          for (let i = 0; i < locations.length - 1; i++) {
            totalDist += getHaversineDistance(locations[i], locations[i+1]);
          }
          setRouteInfo({
            distance: totalDist,
            duration: totalDist * 1.5, // Rough estimate (1.5 mins per km)
          });
        } finally {
          setLoadingRoute(false);
        }
      } else {
        setRouteInfo(null);
        // Only 1 marker: center on it
        const bounds = markersLayer.getBounds();
        map.setView(bounds.getCenter(), 14);
      }
    };

    updateMap();
  }, [locations]);

  // Quick helper to format duration
  const formatDuration = (mins: number) => {
    if (mins < 60) return `${Math.round(mins)} min`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = Math.round(mins % 60);
    return `${hrs}h ${remainingMins}m`;
  };

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Leaflet CSS Injector */}
      <link 
        rel="stylesheet" 
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" 
        crossOrigin="" 
      />



      {/* Main Glassmorphic Search & Options Panel */}
      <div className="flex flex-col gap-3 p-4 bg-card border border-border rounded-3xl shadow-sm">
        <h2 className="text-lg font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary animate-pulse" />
          Ruteador Las Vegas
        </h2>

        {/* Input Search Field */}
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
            <Search className="h-4.5 w-4.5" />
          </div>
          <input
            type="text"
            placeholder="Buscar casino, restaurante, hotel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-secondary border border-border text-foreground rounded-2xl py-3 pl-10 pr-4 text-sm font-semibold placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 focus:border-primary transition-all"
          />
          {loadingSearch && (
            <div className="absolute inset-y-0 right-3 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            </div>
          )}

          {/* Autocomplete Dropdown List */}
          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 z-50 mt-2 bg-card border border-border rounded-2xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
              {suggestions.map((item) => (
                <button
                  key={item.place_id}
                  onClick={() =>
                    addLocation(
                      item.display_name.split(",")[0], // Clean name
                      parseFloat(item.lat),
                      parseFloat(item.lon)
                    )
                  }
                  className="w-full text-left px-4 py-3 hover:bg-secondary text-xs font-semibold text-foreground border-b border-border/40 last:border-b-0 flex items-start gap-2.5 transition-colors"
                >
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">{item.display_name.split(",")[0]}</span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                      {item.display_name.split(",").slice(1).join(",").trim()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Add Buttons */}
        <div className="flex flex-col gap-1.5 mt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Acceso Rápido</span>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {QUICK_LOCATIONS.map((loc) => {
              const alreadyAdded = locations.some(
                (l) => Math.abs(l.lat - loc.lat) < 0.0001 && Math.abs(l.lng - loc.lng) < 0.0001
              );
              return (
                <button
                  key={loc.name}
                  disabled={alreadyAdded}
                  onClick={() => addLocation(loc.name, loc.lat, loc.lng)}
                  className={`flex items-center gap-1 text-[11px] font-bold py-1 px-2.5 rounded-full border transition-all active:scale-[0.97] ${
                    alreadyAdded
                      ? "bg-primary/10 text-primary border-primary/20 cursor-not-allowed opacity-60"
                      : "bg-secondary text-foreground border-border hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  {alreadyAdded ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  {loc.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggle Options */}
        <div className="flex items-center justify-between border-t border-border pt-3 mt-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span className="text-xs font-bold text-foreground">Auto-Optimizar Ruta Corta</span>
          </div>
          <button
            onClick={() => {
              const nextVal = !autoOptimize;
              setAutoOptimize(nextVal);
              if (nextVal) {
                setLocations((prev) => solveAndSetRoute(prev));
              }
            }}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              autoOptimize ? "bg-primary" : "bg-secondary border-border"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                autoOptimize ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Map Display Area */}
      <div className="relative h-[340px] w-full rounded-3xl overflow-hidden border border-border shadow-sm bg-secondary">
        <div ref={mapContainerRef} className="w-full h-full z-10" />
        
        {/* Info Overlay floating inside map */}
        {routeInfo && (
          <div className="absolute top-3 left-3 z-20 bg-background/90 backdrop-blur-md border border-border p-3 rounded-2xl shadow-lg flex items-start gap-2.5 max-w-[220px]">
            <div className="p-2 rounded-xl bg-primary/10 text-primary flex-shrink-0 mt-0.5">
              <Navigation className="h-4.5 w-4.5 animate-pulse" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Resumen de Ruta</span>
              <span className="text-xs font-extrabold text-foreground mt-0.5">Distancia: {routeInfo.distance.toFixed(1)} km</span>
              
              <div className="flex flex-col gap-1 mt-2 text-[10px] font-bold">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="w-3.5 text-center text-xs">🚶</span>
                  <span>A pie: {formatDuration((routeInfo.distance / 4.8) * 60)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-primary">
                  <span className="w-3.5 text-center text-xs">🚗</span>
                  <span>En auto: {formatDuration(routeInfo.duration)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tip showing clickability */}
        {locations.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <span className="bg-background/95 backdrop-blur-md text-[11px] font-bold text-muted-foreground px-4 py-2 rounded-full border border-border shadow-md">
              📍 Haz clic en el mapa para añadir pines
            </span>
          </div>
        )}
      </div>

      {/* Stops list and Actions */}
      {locations.length > 0 && (
        <div className="bg-card border border-border rounded-3xl p-4 flex flex-col gap-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                Paradas en el Itinerario ({locations.length})
              </h3>
              {!autoOptimize && locations.length > 1 && (
                <span className="text-[9px] text-yellow-500 dark:text-yellow-400 font-bold mt-0.5">
                  🖐️ Arrastra las paradas para reordenarlas
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1.5">
              {!autoOptimize && locations.length > 2 && (
                <button
                  onClick={handleOptimizeManual}
                  className="flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-extrabold py-1.5 px-3 rounded-xl transition-all"
                >
                  <Sparkles className="h-3 w-3" />
                  Optimizar
                </button>
              )}
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 bg-destructive/10 hover:bg-destructive/20 text-destructive text-[10px] font-extrabold py-1.5 px-3 rounded-xl transition-all"
              >
                <RotateCcw className="h-3 w-3" />
                Limpiar
              </button>
            </div>
          </div>

          {/* Stops List */}
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {locations.map((loc, index) => {
              const isDraggingThis = draggedIndex === index;
              const isDragOverThis = dragOverIndex === index && draggedIndex !== index;

              return (
                <div
                  key={loc.id}
                  draggable={!autoOptimize}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center justify-between bg-secondary p-3 rounded-2xl border transition-all ${
                    isDraggingThis ? "opacity-35 border-dashed border-muted-foreground/35 scale-[0.98]" : ""
                  } ${
                    isDragOverThis ? "border-yellow-500 bg-yellow-500/5 dark:bg-yellow-500/10 scale-[1.01]" : "border-border/50 hover:border-border"
                  } ${
                    !autoOptimize ? "cursor-grab active:cursor-grabbing" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {!autoOptimize && (
                      <div className="text-muted-foreground/40 hover:text-muted-foreground/80 transition-colors flex-shrink-0 cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-4.5 w-4.5" />
                      </div>
                    )}
                    <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-black">
                      {index + 1}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-bold text-foreground truncate max-w-[150px]">
                        {loc.name}
                      </span>
                      <span className="text-[9px] text-muted-foreground truncate">
                        {loc.lat}, {loc.lng}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Manual Ordering Buttons (only when autoOptimize is inactive) */}
                    {!autoOptimize && (
                      <>
                        <button
                          onClick={() => moveLocation(index, "up")}
                          disabled={index === 0}
                          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-all"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => moveLocation(index, "down")}
                          disabled={index === locations.length - 1}
                          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground transition-all"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}

                    {/* Remove Stop Button */}
                    <button
                      onClick={() => removeLocation(loc.id)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all ml-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
