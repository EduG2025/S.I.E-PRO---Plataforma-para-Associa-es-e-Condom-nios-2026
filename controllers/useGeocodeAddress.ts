import { useRef, useState } from 'react';

export interface Coordinates {
    lat: number;
    lng: number;
}

interface AddressInput {
    cep?: string;
    street: string;
    number: string;
    neighborhood?: string;
    city: string;
    state: string;
}

interface UseGeocodeResult {
    coords: Coordinates | null;
    isLoading: boolean;
    error: string | null;
    geocode: (address: AddressInput) => Promise<void>;
    setManualCoords: (coords: Coordinates) => void;
    isManualOverride: boolean;
}

/**
 * Cache simples em memória (CEP/endereço → coordenadas)
 */
const geocodeCache = new Map<string, Coordinates>();

/**
 * Rate limit global (evita spam de requisições)
 */
let lastRequestAt = 0;
const RATE_LIMIT_MS = 3000; // 1 request a cada 3s

export function useGeocodeAddress(): UseGeocodeResult {
    const [coords, setCoords] = useState<Coordinates | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // flag para saber se usuário moveu manualmente o marcador
    const manualOverrideRef = useRef(false);

    const buildKey = (a: AddressInput) =>
        `${a.cep || ''}|${a.street}|${a.number}|${a.neighborhood || ''}|${a.city}|${a.state}`.toUpperCase();

    const geocode = async (address: AddressInput) => {
        setError(null);

        if (!address.street || !address.number || !address.city || !address.state) {
            return;
        }

        const cacheKey = buildKey(address);

        // 1️⃣ Cache
        if (geocodeCache.has(cacheKey)) {
            setCoords(geocodeCache.get(cacheKey)!);
            manualOverrideRef.current = false;
            return;
        }

        // 2️⃣ Rate limit
        const now = Date.now();
        if (now - lastRequestAt < RATE_LIMIT_MS) {
            setError('Aguarde alguns segundos antes de tentar novamente.');
            return;
        }
        lastRequestAt = now;

        setIsLoading(true);

        try {
            const query = encodeURIComponent(
                `${address.street}, ${address.number}, ${address.neighborhood || ''}, ${address.city}, ${address.state}, Brasil`
            );

            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`,
                {
                    headers: {
                        Accept: 'application/json'
                    }
                }
            );

            const data = await res.json();

            if (!data || data.length === 0) {
                setError('Endereço não localizado no mapa.');
                return;
            }

            const newCoords = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };

            geocodeCache.set(cacheKey, newCoords);
            manualOverrideRef.current = false;
            setCoords(newCoords);
        } catch {
            setError('Falha ao consultar serviço de geolocalização.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Usado quando o usuário arrasta o marcador manualmente
     */
    const setManualCoords = (c: Coordinates) => {
        manualOverrideRef.current = true;
        setCoords(c);
    };

    return {
        coords,
        isLoading,
        error,
        geocode,
        setManualCoords,
        isManualOverride: manualOverrideRef.current
    };
}
