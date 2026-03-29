"use client";

import { useCallback, useRef, useState } from "react";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

const LIBRARIES: ("places")[] = ["places"];
const BUENOS_AIRES = { lat: -34.6037, lng: -58.3816 };
const MAP_STYLE = { width: "100%", height: "300px" };

interface Coords {
  lat: number;
  lng: number;
}

interface AddressInputProps {
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onConfirm: (address: string, coords: Coords) => void;
}

export function AddressInputProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "",
    libraries: LIBRARIES,
  });

  if (!isLoaded) return <>{children}</>;
  return <>{children}</>;
}

export function AddressInput({
  value,
  placeholder,
  disabled,
  onConfirm,
}: AddressInputProps) {
  const {
    ready,
    value: inputValue,
    suggestions: { status, data },
    setValue: setAutocompleteValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: "ar" },
    },
    defaultValue: value,
    debounce: 300,
  });

  const [showModal, setShowModal] = useState(false);
  const [pendingAddress, setPendingAddress] = useState("");
  const [pendingCoords, setPendingCoords] = useState<Coords>(BUENOS_AIRES);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback(
    async (description: string) => {
      setAutocompleteValue(description, false);
      clearSuggestions();

      try {
        const results = await getGeocode({ address: description });
        const coords = getLatLng(results[0]);
        setPendingAddress(description);
        setPendingCoords(coords);
        setShowModal(true);
      } catch {
        // Geocode failed — still show the modal at Buenos Aires center
        setPendingAddress(description);
        setPendingCoords(BUENOS_AIRES);
        setShowModal(true);
      }
    },
    [setAutocompleteValue, clearSuggestions]
  );

  const handleConfirm = () => {
    onConfirm(pendingAddress, pendingCoords);
    setShowModal(false);
  };

  const handleCancel = () => {
    setAutocompleteValue(value, false);
    setShowModal(false);
  };

  const handleMarkerDrag = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setPendingCoords({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
  };

  return (
    <>
      <div ref={wrapperRef} className="relative">
        <input
          className="input"
          placeholder={placeholder}
          disabled={disabled || !ready}
          value={inputValue}
          onChange={(e) => setAutocompleteValue(e.target.value)}
        />
        {status === "OK" && data.length > 0 && (
          <ul className="absolute z-50 left-0 right-0 mt-1 rounded-lg border border-fy-border bg-brand-surface shadow-lg max-h-48 overflow-y-auto">
            {data.map(({ place_id, description }) => (
              <li
                key={place_id}
                className="px-3 py-2 text-sm text-fy-text cursor-pointer hover:bg-brand-teal/10 transition-colors"
                onClick={() => void handleSelect(description)}
              >
                {description}
              </li>
            ))}
          </ul>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-fy-border bg-brand-surface p-4 space-y-3 animate-fade-in">
            <h3 className="text-sm font-display font-bold text-fy-text">
              Confirmar ubicacion
            </h3>
            <p className="text-xs text-fy-dim truncate">{pendingAddress}</p>

            <div className="rounded-lg overflow-hidden border border-fy-border">
              <GoogleMap
                mapContainerStyle={MAP_STYLE}
                center={pendingCoords}
                zoom={15}
                options={{
                  disableDefaultUI: true,
                  zoomControl: true,
                  styles: [
                    {
                      elementType: "geometry",
                      stylers: [{ color: "#1E293B" }],
                    },
                    {
                      elementType: "labels.text.fill",
                      stylers: [{ color: "#94A3B8" }],
                    },
                    {
                      elementType: "labels.text.stroke",
                      stylers: [{ color: "#0F172A" }],
                    },
                    {
                      featureType: "road",
                      elementType: "geometry",
                      stylers: [{ color: "#334155" }],
                    },
                    {
                      featureType: "water",
                      elementType: "geometry",
                      stylers: [{ color: "#0F172A" }],
                    },
                  ],
                }}
              >
                <MarkerF
                  position={pendingCoords}
                  draggable
                  onDragEnd={handleMarkerDrag}
                />
              </GoogleMap>
            </div>

            <p className="text-[11px] text-fy-dim">
              Podes arrastrar el pin para ajustar la ubicacion exacta.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 rounded-lg border border-fy-border py-2 text-sm font-semibold text-fy-soft"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 rounded-lg bg-brand-coral text-brand-ink py-2 text-sm font-bold"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
