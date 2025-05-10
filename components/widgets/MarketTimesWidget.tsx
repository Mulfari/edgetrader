"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  format,
  addDays,
  getDay,
  isToday, // Necesario para comparar fechas
  startOfDay, // Para obtener el inicio del día
  differenceInMinutes,
  isAfter,
  isBefore,
  setHours,
  setMinutes,
  setSeconds,
  formatDistanceStrict,
  getHours, // Necesario para input manual
  getMinutes, // Necesario para input manual
  isValid, // Para validar la fecha creada manualmente
  parse, // Para parsear la hora obtenida de zonas horarias
  addSeconds, // Para calcular la hora precisa en el centro
  differenceInDays, // Para calcular el offset del día del marcador
  Locale, // <--- Añadir Locale aquí
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useDrag } from '@use-gesture/react';
import { motion, useMotionValue, AnimatePresence, animate } from 'framer-motion'; // Añadir AnimatePresence y animate
import { useGesture } from '@use-gesture/react'; // Cambiar useDrag por useGesture
// *** Shadcn/ui Imports ***
import { Button } from "@/components/ui/button"; // Asumiendo ruta estándar
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Asumiendo ruta estándar
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Asumiendo ruta estándar
import { Label } from "@/components/ui/label"; // Asumiendo ruta estándar
import { Clock, Settings } from 'lucide-react'; // Icono opcional y Settings icon
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu" // Asumiendo ruta estándar

// Constantes
const HOURS_IN_DAY = 24;
// *** Ampliar a 5 días (Hoy + 2 pasados + 2 futuros) ***
const TOTAL_TIMELINE_WIDTH_MULTIPLIER = 5;
const DAYS_TOTAL = TOTAL_TIMELINE_WIDTH_MULTIPLIER;

// *** Zona Horaria del Mercado Americano (Ejemplo: Nueva York) ***
const AMERICAN_MARKET_TZ = "America/New_York";

// Interface MarketSession - actualmente no usada pero la dejamos por si se reactiva
interface MarketSession { /* ... */ }
const marketSessions: MarketSession[] = [ /* ... */ ]; // Datos de ejemplo no usados activamente

// *** Zonas Horarias Relevantes ***
const relevantTimeZones: { label: string; tz: string }[] = [
    { label: "UTC", tz: "UTC" },
    { label: "Nueva York", tz: "America/New_York" },
    { label: "Londres", tz: "Europe/London" },
    { label: "Tokio", tz: "Asia/Tokyo" },
];

// *** Helper para obtener hora UTC desde zona horaria (con limitaciones) ***
const getUtcTimeFromTimeZone = (timeZone: string): Date | null => {
    try {
        // Usar Intl.DateTimeFormat para obtener las partes de la fecha/hora en la zona deseada
        const formatter = new Intl.DateTimeFormat('en-CA', { // 'en-CA' suele dar YYYY-MM-DD
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });

        // Obtener la fecha/hora actual para formatear
        const now = new Date();
        const parts = formatter.formatToParts(now);

        // Construir un objeto con las partes clave
        const dateParts: Record<string, string> = {};
        parts.forEach(({ type, value }) => {
            if (type !== 'literal') {
                dateParts[type] = value;
            }
        });

        // Verificar si tenemos todas las partes necesarias
        if (!dateParts.year || !dateParts.month || !dateParts.day || !dateParts.hour || !dateParts.minute || !dateParts.second) {
             console.error("Could not extract all date parts for time zone:", timeZone, dateParts);
             return new Date(); // Fallback a UTC actual
        }

        // Construir la cadena ISO 8601 SIN offset (YYYY-MM-DDTHH:mm:ss)
        // El constructor de Date interpretará esto en la ZONA LOCAL del navegador.
        // ¡Esto sigue siendo una aproximación! No refleja la hora UTC real correspondiente a esa hora local en la zona de destino.
        const isoStringLocal = `${dateParts.year}-${dateParts.month}-${dateParts.day}T${dateParts.hour === '24' ? '00' : dateParts.hour}:${dateParts.minute}:${dateParts.second}`;

        console.warn("Constructed ISO-like string (parsed as local):", isoStringLocal, "for time zone:", timeZone);
        const dateInLocal = new Date(isoStringLocal);

        if (isValid(dateInLocal)) {
            console.warn("Time zone conversion without a dedicated library provides an approximation based on local interpretation.");
            // Devolvemos esta fecha. Su valor interno (timestamp UTC) será el que corresponde
            // a esa hora YYYY-MM-DD HH:mm:ss interpretada en la zona local del navegador.
            // Visualmente, al formatearla sin especificar zona, mostrará esa hora.
            // La línea de tiempo y el marcador rojo usarán su valor UTC interno.
            return dateInLocal;
        }

        console.error("Could not create valid date from parts for time zone:", timeZone, isoStringLocal);
        return new Date(); // Fallback final a UTC actual

    } catch (error) {
        console.error("Error getting time for time zone:", timeZone, error);
        return new Date(); // Fallback a la hora UTC actual en caso de error
    }
};

// *** Helper para formateo relativo usando formatDistanceStrict
const formatRelativeTime = (targetDate: Date | null, baseDate: Date | null): string => {
  if (!targetDate || !baseDate || !isValid(targetDate) || !isValid(baseDate)) { // Añadir validación
      return "-"; 
  }
  
  const diffMinutes = differenceInMinutes(targetDate, baseDate);
  
  // Si la diferencia es muy pequeña
  if (Math.abs(diffMinutes) < 1) {
    return "Ahora"; // O "Centro coincide"
  }
  
  // Determinar prefijo y formatear
  const prefix = isAfter(targetDate, baseDate) ? "En " : "Hace ";
  const formattedDistance = formatDistanceStrict(targetDate, baseDate, { 
      locale: es, 
      roundingMethod: 'round' 
  });
  
  return prefix + formattedDistance;
};

// *** Nueva función para formatear duración precisa (Horas y Minutos) ***
const formatPreciseDuration = (dateFuture: Date, datePast: Date, locale: Locale): string => {
    if (!isValid(dateFuture) || !isValid(datePast)) return "-";

    const totalMinutes = differenceInMinutes(dateFuture, datePast);
    if (totalMinutes < 0) return "-"; // Debería ser una duración hacia el futuro o cero
    if (totalMinutes === 0) return "Ahora";

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    let parts: string[] = [];
    if (hours > 0) {
        parts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`);
    }
    if (minutes > 0) {
        parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);
    }
    
    return parts.length > 0 ? parts.join(' ') : "Menos de un minuto";
};

// Función auxiliar para obtener HH:mm de una zona horaria
const getCurrentTimeInZoneString = (timeZone: string): string => {
    try {
        const now = new Date();
        // Usamos Intl.DateTimeFormat que es nativo y maneja zonas horarias para formateo
        const formatter = new Intl.DateTimeFormat("en-GB", { // en-GB suele dar formato HH:mm
            timeZone: timeZone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // Formato 24h
        });
        return formatter.format(now);
    } catch (error) {
        console.error("Error formatting time for zone:", timeZone, error);
        return "--:--"; // Fallback
    }
};

// *** Estado para modo de tiempo: 'auto' (local) o string tz ***
type TimeSourceMode = 'auto' | string; // string para la tz específica

// Constante para la clave de localStorage
const LOCAL_STORAGE_KEY = 'marketTimesWidgetSettings';

// Interfaz para definir la estructura de los ajustes guardados
interface SavedSettings {
    // Guardamos el modo activo
    activeMode: TimeSourceMode | 'local'; // Incluir 'local' aquí solo para la carga desde localStorage
    // Guardamos la última hora manual fijada (si aplica)
    manualUtcString: string | null;
    autoRecenterEnabled: boolean;
}

export default function MarketTimesWidget() {
  // Hora UTC que se usa para posicionar el marcador rojo y como base si no es 'auto' o 'local'
  const [displayedTimeUtc, setDisplayedTimeUtc] = useState<Date | null>(null);
  // Hora actual del sistema (local o UTC según el modo) para mostrar arriba izq
  const [displayClockTime, setDisplayClockTime] = useState<Date>(new Date());
  // Modo de fuente de tiempo activo
  const [timeMode, setTimeMode] = useState<TimeSourceMode>('auto'); // Por defecto en automático (Ahora significa LOCAL)
  // Estado para la fecha en el centro del visor (basado en displayedTimeUtc)
  const [centeredDate, setCenteredDate] = useState<Date | null>(null);
  const [autoRecenterEnabled, setAutoRecenterEnabled] = useState(true); // Estado para controlar el re-centrado (solo en modo 'auto')
  // Fecha base para construir el inicio de la línea de tiempo (generalmente basada en displayedTimeUtc)
  const [timelineBaseDate, setTimelineBaseDate] = useState<Date>(new Date());
  // Estado para la hora precisa en el centro y su visibilidad
  const [centeredPreciseTime, setCenteredPreciseTime] = useState<Date | null>(null);
  const [showCenteredPreciseTime, setShowCenteredPreciseTime] = useState<boolean>(false);
  const outerContainerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollX = useMotionValue(0); // Representa translateX
  const dragStartPos = useRef(0); // Almacena la posición X al INICIO de un drag o después de una animación
  const isDragging = useRef(false);
  const initialSetupDoneRef = useRef(false); // Ref para controlar la configuración inicial
  const recenterTimerRef = useRef<NodeJS.Timeout | null>(null); // Ref para el temporizador de re-centrado
  const lastWheelSnapTimeRef = useRef(0); // Ref para throttle de la rueda
  const THROTTLE_INTERVAL = 150; // ms - Intervalo para throttle
  const clockUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null); // Ref para el intervalo de actualización del reloj

  // Calcular timelineStartDate basado en el estado estable timelineBaseDate
  const timelineStartDate = useMemo(() => {
      // Calcula el inicio del día de la fecha base y resta los días necesarios para llegar al día 0
      if (!timelineBaseDate || !isValid(timelineBaseDate)) { // Añadir validación para timelineBaseDate
          // Retornar un valor por defecto o null si timelineBaseDate no es válida,
          // para evitar errores en addDays o startOfDay.
          // O quizás timelineBaseDate siempre se inicializa a new Date(), por lo que siempre será válida.
          // Por ahora, asumimos que timelineBaseDate es válida.
          return addDays(startOfDay(new Date()), -Math.floor(DAYS_TOTAL / 2)); // Fallback si es necesario
      }
      return addDays(startOfDay(timelineBaseDate), -Math.floor(DAYS_TOTAL / 2));
  }, [timelineBaseDate]); // Solo se recalcula si la fecha base cambia

  // *** Calcular segmentos de mercado americano ***
  const americanMarketSegments = useMemo(() => {
    const segments = [];
    // Asegurarse de que timelineStartDate es válida antes de proceder
    if (!timelineStartDate || !isValid(timelineStartDate)) return [];

    // Horas UTC aproximadas para el mercado de NY (9:30 AM - 4:00 PM ET)
    // EDT (UTC-4): 9:30 -> 13:30 UTC, 16:00 -> 20:00 UTC
    // EST (UTC-5): 9:30 -> 14:30 UTC, 16:00 -> 21:00 UTC
    // Usaremos 13:30-20:00 UTC como una aproximación general.
    // Es una simplificación y no tiene en cuenta el DST dinámicamente de forma perfecta sin una librería de TZ completa.
    const MARKET_OPEN_UTC_H = 13;
    const MARKET_OPEN_UTC_M = 30;
    const MARKET_CLOSE_UTC_H = 20;
    const MARKET_CLOSE_UTC_M = 0;

    for (let dayOffset = 0; dayOffset < DAYS_TOTAL; dayOffset++) {
        const currentProcessedDayUtc = addDays(startOfDay(timelineStartDate), dayOffset);

        // Determinar el día de la semana en Nueva York para currentProcessedDayUtc
        const nyPartsFormatter = new Intl.DateTimeFormat('en-CA', { // en-CA da YYYY-MM-DD
            timeZone: AMERICAN_MARKET_TZ,
            year: 'numeric', month: '2-digit', day: '2-digit',
        });
        const datePartsInNy = nyPartsFormatter.formatToParts(currentProcessedDayUtc).reduce((acc, part) => {
            if (part.type !== 'literal') acc[part.type] = part.value;
            return acc;
        }, {} as Record<string, string>);
        
        // Construimos una fecha (mediodía para evitar problemas de borde de día) con esas partes de NY,
        // interpretada como UTC, para luego obtener el día de la semana UTC (que será el día de NY).
        // Asegurarse de que las partes existen antes de construir la fecha
        if (!datePartsInNy.year || !datePartsInNy.month || !datePartsInNy.day) {
            console.warn("Could not get date parts in NY for day offset:", dayOffset);
            continue; // Saltar este día si no se pueden obtener las partes
        }
        const dateInNyForWeekdayCheck = new Date(`${datePartsInNy.year}-${datePartsInNy.month}-${datePartsInNy.day}T12:00:00Z`);
        
        if (!isValid(dateInNyForWeekdayCheck)) {
            console.warn("Constructed date for NY weekday check is invalid for offset:", dayOffset, datePartsInNy);
            continue; // Saltar si la fecha construida es inválida
        }
        const dayOfWeekInNy = dateInNyForWeekdayCheck.getUTCDay(); // 0=Dom, 1=Lun, ..., 6=Sab

        if (dayOfWeekInNy >= 1 && dayOfWeekInNy <= 5) { // Si es Lunes a Viernes en NY
            // Las horas UTC se establecen en el mismo día UTC que currentProcessedDayUtc.
            const openUtc = setSeconds(setMinutes(setHours(currentProcessedDayUtc, MARKET_OPEN_UTC_H), MARKET_OPEN_UTC_M),0);
            const closeUtc = setSeconds(setMinutes(setHours(currentProcessedDayUtc, MARKET_CLOSE_UTC_H), MARKET_CLOSE_UTC_M),0);

            segments.push({
                id: `market-us-${dayOffset}`,
                startUtc: openUtc,
                endUtc: closeUtc,
            });
        }
    }
    return segments;
}, [timelineStartDate]);

  // *** Función Auxiliar para Animar al Centro ***
  const animateToCenterTime = (targetDate: Date | null) => {
      // Si targetDate es null, intentamos centrar en la hora UTC actual (modo auto inicial)
      const dateToCenter = targetDate ?? new Date();

      if (!timelineRef.current || !outerContainerRef.current || !timelineStartDate) {
           console.warn("Cannot animate to center, refs or timelineStartDate not ready.");
           return;
       }
       console.log("Animating to center target date:", dateToCenter); // Log

      // Calcular posición X objetivo basada en dateToCenter (que es UTC)
      const totalSeconds = dateToCenter.getUTCHours() * 3600 + dateToCenter.getUTCMinutes() * 60 + dateToCenter.getUTCSeconds();
      const dayOffset = differenceInDays(startOfDay(dateToCenter), timelineStartDate); // Offset respecto al inicio FIJO
            const secondsInTimeline = (dayOffset * HOURS_IN_DAY * 3600) + totalSeconds;
            // Asegurarse de que DAYS_TOTAL y HOURS_IN_DAY estén disponibles y sean correctos
            const totalSecondsInTimeline = DAYS_TOTAL * HOURS_IN_DAY * 3600;
            if (totalSecondsInTimeline <= 0) {
                console.error("Total seconds in timeline is zero or negative, cannot calculate progress.");
                return;
            }
            const currentProgress = Math.max(0, Math.min(1, secondsInTimeline / totalSecondsInTimeline)); // Clamp 0-1

            const containerWidth = outerContainerRef.current.offsetWidth;
            const timelineTotalWidth = timelineRef.current.offsetWidth;

            // Prevenir división por cero o resultados NaN si los anchos no están listos
            if (containerWidth <= 0 || timelineTotalWidth <= 0) {
                  console.warn("Container or timeline width not ready for animation calculation.");
                  // Podríamos intentar un reintento o simplemente no animar
                  return;
             }


      let targetTranslateX = -(currentProgress * timelineTotalWidth) + (containerWidth / 2);
      const minTranslateX = containerWidth > 0 ? -(timelineTotalWidth - containerWidth) : -timelineTotalWidth;
      const effectiveMinTranslateX = Math.min(0, minTranslateX);
      targetTranslateX = Math.max(effectiveMinTranslateX, Math.min(0, targetTranslateX));

      // ANIMA suavemente a la posición objetivo
      animate(scrollX, targetTranslateX, {
          type: "spring",
          stiffness: 150,
          damping: 25,
          restDelta: 0.5 // Ajustar si es necesario
      });
      dragStartPos.current = targetTranslateX; // Actualizar drag start pos

      // Limpiar cualquier temporizador de re-centrado automático pendiente
      if (recenterTimerRef.current) {
         console.log("Clearing pending recenter timer due to manual centering action.");
         clearTimeout(recenterTimerRef.current);
         recenterTimerRef.current = null;
     }
  };

  // *** useEffect Inicial (Carga de Ajustes y Configuración Inicial) ***
  useEffect(() => {
        let initialSettingsLoaded = false;
        let initialDateToCenter: Date | null = null; // La hora UTC a la que centrar inicialmente
        let modeToSet: TimeSourceMode = 'auto'; // Modo por defecto
        let autoRecenterToSet = true;

        // --- Intento de Carga desde localStorage --- 
        const savedSettingsString = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedSettingsString) {
            try {
                const savedSettings: SavedSettings = JSON.parse(savedSettingsString);
                // Validar datos cargados mínimamente
                // Permitir 'local' aquí solo para la carga
                if (
                    (savedSettings.activeMode === 'auto' || savedSettings.activeMode === 'local' || typeof savedSettings.activeMode === 'string') &&
                    typeof savedSettings.autoRecenterEnabled === 'boolean' &&
                    (savedSettings.manualUtcString === null || typeof savedSettings.manualUtcString === 'string')
                ) {
                    const loadedManualDate = savedSettings.manualUtcString ? new Date(savedSettings.manualUtcString) : null;

                    // Si el modo guardado es una ZONA HORARIA ESPECÍFICA (no 'auto' ni el antiguo 'local')
                    // y hay una fecha manual válida, la usamos
                    if (savedSettings.activeMode !== 'auto' && savedSettings.activeMode !== 'local' && loadedManualDate && isValid(loadedManualDate)) {
                        console.log("Loading saved settings (specific timezone):", savedSettings);
                        modeToSet = savedSettings.activeMode as TimeSourceMode; // Sabemos que es un string tz
                        autoRecenterToSet = savedSettings.autoRecenterEnabled;
                        setDisplayedTimeUtc(loadedManualDate); // Restaurar la hora manual/tz fijada
                        setTimelineBaseDate(loadedManualDate);
                        setCenteredDate(startOfDay(loadedManualDate));
                        initialDateToCenter = loadedManualDate; // Centrar en la hora manual/tz
                        initialSettingsLoaded = true;
                    }
                    // Si el modo guardado es 'auto' o el antiguo 'local'
                    else if (savedSettings.activeMode === 'auto' || savedSettings.activeMode === 'local') {
                         // Tratar el 'local' antiguo como el nuevo 'auto' (hora local del dispositivo)
                         console.log(`Loading saved settings (auto/local mapped to auto):`, savedSettings);
                         modeToSet = 'auto'; // Siempre establecer a 'auto'
                         autoRecenterToSet = savedSettings.autoRecenterEnabled;
                         // No restauramos displayedTimeUtc, se establecerá en el efecto del reloj/modo
                         const now = new Date();
                         setTimelineBaseDate(now); // Base en la hora actual
                         setCenteredDate(startOfDay(now));
                         initialDateToCenter = now; // Centrar en la hora actual para 'auto' (local)
                         initialSettingsLoaded = true;
                    } else {
                         // Caso: El modo era un string (tz) pero no había fecha manual válida guardada
                         console.warn("Saved timezone mode had invalid date string, using defaults.");
                    }
                } else {
                    console.warn("Saved settings structure is invalid, using defaults.");
                }
            } catch (error) {
                console.error("Error parsing saved settings, using defaults:", error);
                localStorage.removeItem(LOCAL_STORAGE_KEY); // Limpiar si está corrupto
            }
        }

        // --- Configuración por Defecto (si no se cargaron ajustes) ---
        if (!initialSettingsLoaded) {
            console.log("No valid saved settings found, applying defaults.");
            // Los valores por defecto ya están en useState, solo necesitamos la fecha para centrar
            initialDateToCenter = new Date(); // Centrar en la hora actual por defecto
        }

        // Aplicar estado inicial después de cargar/determinar defaults
        setTimeMode(modeToSet);
        setAutoRecenterEnabled(autoRecenterToSet);

        // --- Centrado Inicial (usando timeout corto) ---
        const timeoutId = setTimeout(() => {
            if (!initialSetupDoneRef.current) {
                // Solo animar si tenemos una fecha válida (cargada o now)
                 if (initialDateToCenter && isValid(initialDateToCenter)) {
                      console.log("Triggering initial centering animation for:", initialDateToCenter);
                     animateToCenterTime(initialDateToCenter);
                 } else {
                      console.warn("Initial date to center is invalid, skipping animation.");
                 }
                initialSetupDoneRef.current = true; // Marcar inicialización completa
                console.log("Initial setup complete.");
            }
        }, 50); // Pequeño retraso para asegurar que los refs estén listos

        // --- Limpieza ---
        return () => clearTimeout(timeoutId);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // << Ejecutar solo una vez al montar

    // *** NUEVO useEffect para manejar el reloj/modo de tiempo ***
    useEffect(() => {
        // Limpiar intervalo anterior al cambiar de modo
        if (clockUpdateIntervalRef.current) {
            clearInterval(clockUpdateIntervalRef.current);
            clockUpdateIntervalRef.current = null;
        }

        // --- Lógica basada en timeMode ---
        if (timeMode === 'auto') {
            console.log("Setting mode to 'auto' (Local Device Time)");
            // Actualizar inmediatamente y luego cada segundo
            const updateLocalTime = () => {
                if (!isDragging.current) { // Solo actualizar si no se está arrastrando
                    const now = new Date(); // Hora UTC actual
                    // Para mostrar, usamos la hora local del navegador (formateada luego)
                    setDisplayClockTime(now); // Guardamos 'now' pero la formatearemos localmente
                    // Para el marcador, seguimos usando UTC para la coherencia de la línea de tiempo
                    setDisplayedTimeUtc(now);
                }
            };
            updateLocalTime(); // Llamada inicial
            clockUpdateIntervalRef.current = setInterval(updateLocalTime, 1000);

        // ELIMINADO: } else if (timeMode === 'local') { ... }

        } else { // Es una zona horaria específica (string tz)
             console.log(`Setting mode to specific time zone: ${timeMode}`);
             // No hay intervalo, establecemos la hora una vez
             const newTime = getUtcTimeFromTimeZone(timeMode); // Usamos la función existente (con limitaciones)
             if (newTime && isValid(newTime)) {
                 setDisplayClockTime(newTime); // Actualizar reloj mostrado
                 setDisplayedTimeUtc(newTime); // Actualizar marcador y base
                 setTimelineBaseDate(newTime); // Actualizar base para recalculcular timelineStartDate
                 // CenteredDate se actualizará automáticamente por el efecto que depende de displayedTimeUtc
                 // Animar al centro DESPUÉS de actualizar el estado
                 // Usamos un pequeño timeout para asegurar que el estado se propague antes de animar
                 setTimeout(() => animateToCenterTime(newTime), 0);
             } else {
                 console.error(`Could not get valid time for time zone: ${timeMode}. Falling back to auto.`);
                 // Opcional: Mostrar error al usuario
                 setTimeMode('auto'); // Volver a 'auto' si falla
             }
        }

        // Función de limpieza: se ejecuta si timeMode cambia o al desmontar
        return () => {
            if (clockUpdateIntervalRef.current) {
                console.log("Cleaning up clock interval.");
                clearInterval(clockUpdateIntervalRef.current);
                clockUpdateIntervalRef.current = null;
            }
        };
    }, [timeMode]); // Depende del modo de tiempo seleccionado


    // Calcular posición del marcador (siempre basado en displayedTimeUtc)
    const currentMarkerPositionPercent = useMemo(() => {
        // Asegurar que displayedTimeUtc sea una fecha válida antes de calcular
        if (!displayedTimeUtc || !isValid(displayedTimeUtc)) return 0;

        // Asegurar que timelineStartDate sea una fecha válida
        if (!timelineStartDate || !isValid(timelineStartDate)) return 0;


        // Calcular segundos UTC del marcador
        const markerTotalSecondsUtc = displayedTimeUtc.getUTCHours() * 3600 + displayedTimeUtc.getUTCMinutes() * 60 + displayedTimeUtc.getUTCSeconds();
        // Calcular offset en días desde el inicio FIJO de la línea de tiempo
        const markerDayOffset = differenceInDays(startOfDay(displayedTimeUtc), timelineStartDate);
        // Calcular segundos totales dentro de la línea de tiempo completa (5 días)
        const markerSecondsInTimeline = (markerDayOffset * HOURS_IN_DAY * 3600) + markerTotalSecondsUtc;
        // Calcular el total de segundos en la línea de tiempo
        const totalSecondsInTimeline = DAYS_TOTAL * HOURS_IN_DAY * 3600;

        // Evitar división por cero
        if (totalSecondsInTimeline <= 0) return 0;

        // Calcular porcentaje, asegurándose de que esté entre 0 y 100
        const percentage = (markerSecondsInTimeline / totalSecondsInTimeline) * 100;
        return Math.max(0, Math.min(100, percentage)); // Clamp 0-100

    }, [displayedTimeUtc, timelineStartDate]); // Depende de la hora UTC y del inicio de la línea de tiempo


    // Calcular fecha centrada cuando cambia el scroll - Usa displayedTimeUtc como referencia para el día relativo si es necesario
    useEffect(() => {
        let lastProcessedDayString: string | null = null; // Para comparar si el día cambió

        const unsubscribe = scrollX.on("change", (latestX) => {
            if (outerContainerRef.current && timelineRef.current && timelineStartDate && isValid(timelineStartDate)) {
                const containerWidth = outerContainerRef.current.offsetWidth;
                const timelineTotalWidth = timelineRef.current.offsetWidth;

                // Evitar cálculos si los anchos no son válidos
                 if (containerWidth <= 0 || timelineTotalWidth <= 0) {
                     // Limpiar estados dependientes para evitar mostrar datos incorrectos
                      setCenteredPreciseTime(null);
                      setShowCenteredPreciseTime(false);
                      // Podríamos incluso resetear centeredDate aquí si es necesario
                      // setCenteredDate(null);
                     return;
                }

                // Calcular punto central y progreso
                const centerPointX = -latestX + containerWidth / 2;
                const centerProgress = Math.max(0, Math.min(1, centerPointX / timelineTotalWidth)); // Clamp progress 0-1

                // Calcular fecha y hora precisas en el centro
                const totalSecondsOffset = centerProgress * (DAYS_TOTAL * HOURS_IN_DAY * 3600);
                const newCenteredPreciseTime = addSeconds(timelineStartDate, totalSecondsOffset);

                if (isValid(newCenteredPreciseTime)) {
                    setCenteredPreciseTime(newCenteredPreciseTime); // Actualizar hora precisa siempre

                    // Actualizar centeredDate solo si el día ha cambiado
                    const newDay = startOfDay(newCenteredPreciseTime);
                    const newDayString = format(newDay, 'yyyy-MM-dd');
                    if (newDayString !== lastProcessedDayString) {
                        setCenteredDate(newDay);
                        lastProcessedDayString = newDayString;
                    }

                    // Determinar si mostrar la hora precisa del centro comparando con el marcador
                    if (displayedTimeUtc && isValid(displayedTimeUtc)) {
                         // Calcular posición en píxeles del marcador
                         const markerTotalSeconds = displayedTimeUtc.getUTCHours() * 3600 + displayedTimeUtc.getUTCMinutes() * 60 + displayedTimeUtc.getUTCSeconds();
                         const markerDayOffset = differenceInDays(startOfDay(displayedTimeUtc), timelineStartDate);
                         const markerSecondsInTimeline = (markerDayOffset * HOURS_IN_DAY * 3600) + markerTotalSeconds;
                         const markerProgress = markerSecondsInTimeline / (DAYS_TOTAL * HOURS_IN_DAY * 3600);
                         const markerPixelX = markerProgress * timelineTotalWidth;

                         // Comparar con la posición central en píxeles
                         const centerPixelX = centerPointX;
                         const pixelDifference = Math.abs(markerPixelX - centerPixelX);
                         const threshold = 5; // Mostrar si la diferencia es > 5 píxeles
                         setShowCenteredPreciseTime(pixelDifference > threshold);
                    } else {
                         // Si no hay hora del marcador válida, no mostrar la hora del centro
                         setShowCenteredPreciseTime(false);
                    }

                } else {
                    // Si la fecha calculada no es válida, limpiar estados
                     setCenteredPreciseTime(null);
                     setShowCenteredPreciseTime(false);
                }
            } else {
                 // Si faltan refs o timelineStartDate, limpiar estados relacionados con la posición central
                 console.warn("Missing refs or timelineStartDate in scrollX effect, clearing centered time.")
                 setCenteredPreciseTime(null);
                 setShowCenteredPreciseTime(false);
            }
        });

        // Resetear el día guardado si las dependencias principales cambian
        lastProcessedDayString = null;

        return () => {
            unsubscribe();
            lastProcessedDayString = null; // Limpiar al desmontar o re-ejecutar
        };
    }, [scrollX, displayedTimeUtc, timelineStartDate]); // Dependencias clave

    // Configurar useGesture para drag y wheel
    const gestureBind = useGesture(
        {
            // --- onDrag Handler --- 
            onDrag: ({ active, offset: [ox], movement: [mx], first, event }) => {
                if (first) { // Al inicio del drag
                    isDragging.current = true;
                    scrollX.stop(); // Detener animaciones previas (como recenter)
                     console.log("Drag started, stopped any existing scrollX animation.");
                     if (recenterTimerRef.current) {
                         clearTimeout(recenterTimerRef.current);
                         recenterTimerRef.current = null;
                         console.log("Drag started, cancelled recenter timer.");
                     }
                }

                // Calcular nueva posición X limitada durante el drag
                let newX = ox; // offset[0] es la posición absoluta desde el inicio del gesto
                if (timelineRef.current && outerContainerRef.current) {
                    const timelineTotalWidth = timelineRef.current.offsetWidth;
                    const containerWidth = outerContainerRef.current.offsetWidth;
                    // Asegurar que los anchos son válidos
                    if (timelineTotalWidth > 0 && containerWidth > 0) {
                        const minTranslateX = containerWidth > 0 ? -(timelineTotalWidth - containerWidth) : -timelineTotalWidth;
                        const effectiveMinTranslateX = Math.min(0, minTranslateX); // Asegurar <= 0
                        newX = Math.max(effectiveMinTranslateX, Math.min(0, newX));
                    } else {
                         newX = 0; // Fallback si los anchos no están listos
                    }
                } else {
                    newX = 0; // Fallback si los refs no están listos
                }

                scrollX.set(newX); // Actualizar la posición visualmente

                if (!active) { // Al finalizar el drag
                     isDragging.current = false;
                     console.log("Drag ended. Mode:", timeMode, "Final X:", newX);
                     dragStartPos.current = newX; // Guardar la posición final como nueva base

                    // Si estamos en modo AUTO, programar re-centrado suave después de un retraso
                    // SOLO si la opción está habilitada
                    if (timeMode === 'auto' && autoRecenterEnabled) {
                        console.log("Scheduling auto recenter (enabled)...");
                        // Asegurarse de no programar si ya hay uno pendiente (aunque se limpia al inicio del drag)
                         if (recenterTimerRef.current) clearTimeout(recenterTimerRef.current);

                        recenterTimerRef.current = setTimeout(() => {
                            // Doble verificación: ¿seguimos en modo auto, sin arrastrar y opción habilitada?
                            if (!isDragging.current && timeMode === 'auto' && autoRecenterEnabled && displayedTimeUtc && timelineRef.current && outerContainerRef.current) {
                                console.log("Executing auto recenter animation.");
                                animateToCenterTime(displayedTimeUtc); // Re-centrar en la hora UTC actual
                            } else {
                                 console.log("Auto recenter conditions not met, skipping execution.");
                            }
                            recenterTimerRef.current = null; // Limpiar ref del temporizador
                        }, 15000); // 15 segundos de retraso
                    }
                }
            },
            // --- onWheel Handler --- 
            onWheel: ({ delta: [, dy], event }) => {
                event?.preventDefault(); // Prevenir scroll vertical de la página

                const direction = Math.sign(-dy); // +1 para scroll down/right, -1 para scroll up/left
                if (direction === 0) return;

                const now = Date.now();
                // Throttle: Ignorar si el último salto fue hace menos de X ms
                if (now - lastWheelSnapTimeRef.current < THROTTLE_INTERVAL) {
                    return;
                }
                lastWheelSnapTimeRef.current = now; // Actualizar timestamp del último salto procesado

                // Cancelar recenter timer si existe (porque el usuario interactuó)
                if (recenterTimerRef.current) {
                    clearTimeout(recenterTimerRef.current);
                    recenterTimerRef.current = null;
                    console.log("Wheel snap triggered, cancelled recenter timer.");
                }

                // Detener animación actual de scrollX para evitar conflictos
                scrollX.stop();

                // Calcular target X para la hora siguiente/anterior
                if (outerContainerRef.current && timelineRef.current && timelineStartDate && isValid(timelineStartDate)) {
                    const containerWidth = outerContainerRef.current.offsetWidth;
                    const timelineTotalWidth = timelineRef.current.offsetWidth;

                    // Asegurarse de que los anchos son válidos
                     if (containerWidth <= 0 || timelineTotalWidth <= 0) return;

                    const currentX = scrollX.get();

                    // Calcular progreso y segundos actuales en el centro
                    const centerPointX = -currentX + containerWidth / 2;
                    const centerProgress = Math.max(0, Math.min(1, centerPointX / timelineTotalWidth));
                    const centerTotalSeconds = centerProgress * (DAYS_TOTAL * HOURS_IN_DAY * 3600);

                    // Calcular índice de hora actual y objetivo
                    const currentHourIndex = Math.round(centerTotalSeconds / 3600); // Redondear a la hora más cercana como base
                    let targetHourIndex = currentHourIndex + direction;

                    // Clamp targetHourIndex dentro de los límites [0, totalHoras - 1]
                    const totalHoursInTimeline = DAYS_TOTAL * HOURS_IN_DAY;
                    targetHourIndex = Math.max(0, Math.min(totalHoursInTimeline - 1, targetHourIndex));

                    // Calcular segundos y progreso objetivo
                    const targetSeconds = targetHourIndex * 3600;
                    const targetProgress = targetSeconds / (totalHoursInTimeline * 3600);

                    // Calcular la posición X necesaria para centrar esa hora
                    let targetTranslateX = -(targetProgress * timelineTotalWidth) + (containerWidth / 2);
                    const minTranslateX = containerWidth > 0 ? -(timelineTotalWidth - containerWidth) : -timelineTotalWidth;
                    const effectiveMinTranslateX = Math.min(0, minTranslateX);
                    targetTranslateX = Math.max(effectiveMinTranslateX, Math.min(0, targetTranslateX));

                    // Animar suavemente al target X
                    animate(scrollX, targetTranslateX, {
                        type: "spring",
                        stiffness: 180, // Un poco más rígido para el snap
                        damping: 25,
                        restDelta: 0.5
                    });
                    dragStartPos.current = targetTranslateX; // Actualizar pos base por si se arrastra después
                }
            }
        },
        {
            // --- Configuración de Drag --- 
            drag: {
                axis: 'x',
                threshold: 5, // Píxeles antes de iniciar el drag
                from: () => [scrollX.get(), 0], // Iniciar desde la posición actual de scrollX
                pointer: { touch: true }, // Habilitar drag táctil
                preventDefault: true, // Prevenir comportamiento nativo (útil en táctil)
            },
            // --- Configuración de Wheel --- 
            wheel: {
                eventOptions: { passive: false }, // Necesario para preventDefault() en wheel
            }
        }
    );


    // Determinar si mostrar el indicador de fecha - Usa centeredDate
    const showDateIndicator = centeredDate && !isToday(centeredDate); // Simplificado: muestra si no es hoy

    // *** Handler para cambiar el modo de tiempo desde el Dropdown ***
    const handleTimeModeChange = (newMode: TimeSourceMode) => {
        console.log("Changing time mode to:", newMode);
        // Directamente establecer el modo. El useEffect [timeMode] se encargará del resto.
        setTimeMode(newMode);

        // Si cambiamos a un modo NO automático (zona horaria específica), cancelamos cualquier recenter pendiente
        if (newMode !== 'auto' && recenterTimerRef.current) {
           clearTimeout(recenterTimerRef.current);
           recenterTimerRef.current = null;
           console.log("Mode changed to specific timezone, cancelled recenter timer.");
        }
    };


    // *** useEffect para Guardar Ajustes en localStorage ***
    useEffect(() => {
        // No guardar hasta que la configuración inicial (carga/default) esté completa
        if (!initialSetupDoneRef.current) {
            return;
        }

       // Solo guardar si tenemos un modo y una hora UTC válida (si aplica para zonas horarias)
       // En modo 'auto' (local), displayedTimeUtc se actualiza pero no necesitamos guardarlo específicamente.
       if (!timeMode || (timeMode !== 'auto' && (!displayedTimeUtc || !isValid(displayedTimeUtc)))) {
            console.log("Skipping save to localStorage: initial setup not done or invalid state for non-auto mode.");
            return;
        }

        console.log("Saving settings to localStorage...");

        const settingsToSave: SavedSettings = {
            activeMode: timeMode,
           // Guardar la hora UTC actual SOLO si el modo NO es 'auto' (es una zona horaria específica)
           manualUtcString: (timeMode !== 'auto' && displayedTimeUtc)
                ? displayedTimeUtc.toISOString()
                : null,
            autoRecenterEnabled,
        };

        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settingsToSave));
        } catch (error) {
            console.error("Error saving settings to localStorage:", error);
        }

    }, [timeMode, displayedTimeUtc, autoRecenterEnabled]); // Guardar cuando cambien estos estados


    // *** Obtener Etiqueta del Modo Actual para Mostrar ***
    const currentTimeModeLabel = useMemo(() => {
       if (timeMode === 'auto') return 'Local'; // Cambiado de 'UTC' a 'Local'
        // ELIMINADO: if (timeMode === 'local') return 'Local';
        const foundZone = relevantTimeZones.find(zone => zone.tz === timeMode);
        return foundZone ? foundZone.label : 'Manual'; // Fallback a 'Manual' si es un tz no conocido
    }, [timeMode]);

    return (
      <div className="w-full h-full overflow-hidden bg-card text-card-foreground border rounded-lg shadow-sm p-4 relative select-none flex flex-col"> {/* Añadido flex flex-col */}

        {/* Controles Superiores: Hora y Menú Configuración */}
        <div className="flex justify-between items-center mb-2 z-20 relative"> {/* Contenedor para elementos superiores */}
         {/* Indicador de Hora Actual (Arriba Izquierda) */}
          {displayClockTime && isValid(displayClockTime) && (
            <div className="bg-background/70 backdrop-blur-sm border border-border/30 px-2 py-0.5 rounded-full flex items-center text-xs shadow-sm pointer-events-none">
              <span className="font-mono font-medium text-foreground/90">
                {/* Formatear siempre como hora local del displayClockTime que ya está ajustado por modo */}
                {format(displayClockTime, 'HH:mm:ss')}
              </span>
              <span className="ml-1 text-muted-foreground">{currentTimeModeLabel}</span>
             </div>
          )}

        {/* Indicador de Fecha Condicional (Movido arriba) */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0"> {/* Centrado absoluto */}
      <AnimatePresence>
            {showDateIndicator && centeredDate && isValid(centeredDate) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
                className="bg-background/80 backdrop-blur-sm text-foreground text-xs font-medium px-2 py-0.5 rounded-full border shadow-sm pointer-events-none"
          >
            {format(centeredDate, 'EEE, d MMM', { locale: es })}
          </motion.div>
        )}
      </AnimatePresence>
        </div>

        {/* Botón de Configuración / Menú Desplegable (Derecha) */}
        <div className="ml-auto"> { /* Empuja el botón a la derecha */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-7 w-7"> {/* Botón icono */}
                <Settings className="h-4 w-4" />
                <span className="sr-only">Configuración</span>
              </Button>
            </DropdownMenuTrigger>
             <DropdownMenuContent align="end" className="w-60"> {/* Ancho ajustado */}
               {/* 1. Selección de Fuente de Tiempo */}
                <DropdownMenuLabel>Fuente de Tiempo</DropdownMenuLabel>
                {/* Usar onValueChange para modos simples como 'auto' */}
                <DropdownMenuRadioGroup value={timeMode} onValueChange={handleTimeModeChange as (value: string) => void}>
                   {/* Opción Automática (Tiempo Real Local) */}
                   <DropdownMenuRadioItem value="auto">Automático (Hora Local)</DropdownMenuRadioItem>

                   {/* ELIMINADO: Opción Local del Dispositivo */}
                   {/* <DropdownMenuRadioItem value="local">Local del Dispositivo</DropdownMenuRadioItem> */}
                </DropdownMenuRadioGroup> {/* Cerrar RadioGroup aquí */}

                    <DropdownMenuSeparator />
                    {/* Opciones de Zona Horaria - Usan DropdownMenuItem con onClick */}
                     <DropdownMenuLabel className="text-muted-foreground text-xs px-2">Fijar a hora actual de:</DropdownMenuLabel>
                     {relevantTimeZones.map((zone) => {
                       // Llamar a la función para obtener la hora formateada
                        const currentTimeString = getCurrentTimeInZoneString(zone.tz);
                        return (
                           // Usar DropdownMenuItem y onClick para manejar la selección de zonas horarias
                           <DropdownMenuItem key={zone.tz} onClick={() => handleTimeModeChange(zone.tz)}>
                               {/* Mostrar etiqueta y hora */} 
                                <span className="flex-grow">{zone.label}</span>
                                <span className="ml-2 text-xs text-muted-foreground">{currentTimeString}</span>
                           </DropdownMenuItem>
                        );
                     })}


               <DropdownMenuSeparator />

                {/* 2. Comportamiento General */}
                <DropdownMenuLabel>Comportamiento</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                    checked={autoRecenterEnabled}
                    onCheckedChange={setAutoRecenterEnabled}
                   // Deshabilitar visualmente si el modo no es 'auto'
                   disabled={timeMode !== 'auto'}
                   className="data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed"
                >
                    Volver al centro tras 15s 
                   <span className={`ml-auto text-xs ${timeMode === 'auto' ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                        (Solo Auto)
                    </span>
                </DropdownMenuCheckboxItem>

            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Contenedor Exterior: Captura drag, oculta overflow (El div principal ahora es flex-col, este es un hijo) */}
      <div
        ref={outerContainerRef}
        {...gestureBind()}
        className="w-full h-[120px] overflow-hidden cursor-grab active:cursor-grabbing flex-grow" // Aumentado h-[100px] a h-[120px]
        style={{ touchAction: 'pan-x', userSelect: 'none' }} // Añadido userSelect
      >
        {/* Contenedor INTERNO */}
        <div
          className="w-full h-full relative"
        >
          {/* *** Puntero Central Fijo (Condicional) *** */}
          <AnimatePresence>
               {showCenteredPreciseTime && (
                   <motion.div
                       // Línea corta superpuesta al riel, centrada H y V
                       className="absolute left-1/2 top-[3.5rem] h-[8px] w-0.5 bg-blue-500 z-[5] pointer-events-none" // top=my-14, h=riel_height
                       style={{ transform: 'translateX(-50%)' }}
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       exit={{ opacity: 0 }}
                       transition={{ duration: 0.2 }}
                   /> // Sin contenido interno
               )}
          </AnimatePresence>

          {/* Línea de tiempo interna - Animada con translateX */}
          <motion.div
            ref={timelineRef}
            className="absolute top-0 left-0 h-[8px] bg-gray-200 dark:bg-gray-700 rounded-full my-14 pointer-events-none z-[1]" // my-14 = 3.5rem
            style={{
              width: `${100 * TOTAL_TIMELINE_WIDTH_MULTIPLIER}%`,
              x: scrollX
            }}
          >
            {/* Marcas de Hora */}
            {[...Array(HOURS_IN_DAY * TOTAL_TIMELINE_WIDTH_MULTIPLIER)].map((_, i) => {
              const displayHour = i % HOURS_IN_DAY;
              const isMajorTick = i % 3 === 0;
              // Calcular a qué día pertenece esta marca (0 = primer día, 1 = segundo, ...)
              const dayIndex = Math.floor(i / HOURS_IN_DAY);
              // Calcular la fecha de esta marca - Usar centeredDate como referencia para el día base
              // Si no hay centeredDate (inicialización), usar la hora actual mostrada
              const baseDateForTicks = centeredDate || displayedTimeUtc || new Date();
              const tickDate = addDays(timelineStartDate, dayIndex);
              // Determinar si la fecha de la marca es 'hoy' real, no basado en centeredDate
              const isTickBasedOnRealToday = isToday(tickDate);
              // Determinar si la fecha de la marca coincide con el día de la fecha centrada
              const isTickOnCenteredDay = centeredDate ? format(tickDate, 'yyyy-MM-dd') === format(centeredDate, 'yyyy-MM-dd') : false;

              return (
                <div
                  key={`hour-${i}`}
                  className="absolute top-1/2 h-full flex flex-col items-center -translate-y-1/2 pointer-events-none"
                  style={{ left: `${(i / (HOURS_IN_DAY * TOTAL_TIMELINE_WIDTH_MULTIPLIER)) * 100}%` }}
                >
                  {/* Línea de marca - Resaltar si es el día centrado */}
                  <div className={`w-px ${isMajorTick ? 'h-4 -mt-2' : 'h-2 -mt-1'} ${isTickOnCenteredDay ? 'bg-violet-400' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                  {/* Etiqueta de hora - Resaltar si es el día centrado */}
                  {isMajorTick && (
                     <span className={`absolute -bottom-5 text-[10px] mt-1 ${isTickOnCenteredDay ? 'text-violet-600 dark:text-violet-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>{String(displayHour).padStart(2, '0')}h</span>
                   )}
                  {/* Etiqueta de Día (al inicio de cada día) - Resaltar si es el día centrado */}
                  {displayHour === 0 && i > 0 && ( // Mostrar etiqueta de día, excepto en la marca 0
                       <span className={`absolute -top-8 text-[10px] font-medium whitespace-nowrap px-1.5 py-0.5 rounded ${isTickOnCenteredDay ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300' : 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400'}`}>
                           {isValid(tickDate) ? format(tickDate, 'EEE d', { locale: es }) : 'Invalid Date'}
                       </span>
                   )}
                </div>
              );
            })}

            {/* Marcador Hora Actual - Usa displayedTimeUtc */}
            {displayedTimeUtc && isValid(displayedTimeUtc) && (
              <motion.div
                className="absolute top-0 h-[100px] -mt-[46px] w-1 bg-red-600 dark:bg-red-500 rounded-full shadow-lg transform -translate-x-1/2 z-10 flex items-center justify-center pointer-events-none"
                initial={false} // No animar en la carga inicial
                animate={{ left: `${currentMarkerPositionPercent}%` }} // Animar la propiedad left
                transition={{ type: "spring", stiffness: 200, damping: 25 }} // Transición suave tipo resorte
                // Otros tipos de transición que puedes probar:
                // transition={{ type: "tween", ease: "easeInOut", duration: 0.5 }}
               >
                  {/* Elementos internos del marcador */}
                 <div className="absolute -top-1 h-3 w-3 bg-red-600 dark:bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></div>
              </motion.div>
            )}

            {/* Segmentos de Mercado Americano */}
            {americanMarketSegments.map(segment => {
                if (!timelineStartDate || !isValid(timelineStartDate)) return null;

                // Calcular inicio del segmento en segundos desde timelineStartDate
                const segmentStartDayOffset = differenceInDays(startOfDay(segment.startUtc), timelineStartDate);
                const segmentStartSecondsInDay = segment.startUtc.getUTCHours() * 3600 + segment.startUtc.getUTCMinutes() * 60 + segment.startUtc.getUTCSeconds();
                const segmentStartTotalSeconds = (segmentStartDayOffset * HOURS_IN_DAY * 3600) + segmentStartSecondsInDay;

                // Calcular fin del segmento en segundos desde timelineStartDate
                const segmentEndDayOffset = differenceInDays(startOfDay(segment.endUtc), timelineStartDate);
                const segmentEndSecondsInDay = segment.endUtc.getUTCHours() * 3600 + segment.endUtc.getUTCMinutes() * 60 + segment.endUtc.getUTCSeconds();
                const segmentEndTotalSeconds = (segmentEndDayOffset * HOURS_IN_DAY * 3600) + segmentEndSecondsInDay;

                const totalTimelineSeconds = DAYS_TOTAL * HOURS_IN_DAY * 3600;
                if (totalTimelineSeconds <= 0) return null;

                const leftPercent = (segmentStartTotalSeconds / totalTimelineSeconds) * 100;
                const widthPercent = ((segmentEndTotalSeconds - segmentStartTotalSeconds) / totalTimelineSeconds) * 100;

                if (widthPercent <= 0 || leftPercent < 0 || (leftPercent + widthPercent) > 100 ) {
                     // No renderizar si no tiene ancho, o está fuera de los límites de la línea de tiempo de 5 días
                     // Esto también previene renderizar segmentos que podrían empezar antes del inicio de la timeline
                     // o terminar después del final de la timeline visible.
                     // Podríamos clamp los valores si quisiéramos mostrar segmentos parciales.
                     // Por ahora, solo los que caen completamente dentro o empiezan dentro.
                    return null;
                }

                // *** Lógica para el texto del tooltip (title) ***
                let titleText = `Mercado Americano (aprox. ${format(segment.startUtc, 'HH:mm')} - ${format(segment.endUtc, 'HH:mm')} UTC)`;
                if (displayedTimeUtc && isValid(displayedTimeUtc) && isValid(segment.startUtc) && isValid(segment.endUtc)) {
                    const now = displayedTimeUtc;
                    const opens = segment.startUtc;
                    const closes = segment.endUtc;

                    if (isBefore(now, opens)) {
                        const durationToOpen = formatPreciseDuration(opens, now, es);
                        titleText = `Mercado Americano: Abre en ${durationToOpen} (Apertura: ${format(opens, 'EEE d, HH:mm', { locale: es })} UTC)`;
                    } else if (isAfter(now, closes)) {
                        // Para "cerró hace", dateFuture es now, datePast es closes
                        const durationSinceClose = formatPreciseDuration(now, closes, es);
                        titleText = `Mercado Americano: Cerró hace ${durationSinceClose} (Cierre: ${format(closes, 'EEE d, HH:mm', { locale: es })} UTC)`;
                    } else {
                        // Para "cierra en", dateFuture es closes, datePast es now
                        const durationToClose = formatPreciseDuration(closes, now, es);
                        // Para "abrió hace", dateFuture es now, datePast es opens
                        const durationSinceOpen = formatPreciseDuration(now, opens, es);
                        titleText = `Mercado Americano: Abierto. Abrió hace ${durationSinceOpen}. Cierra en ${durationToClose} (Cierre: ${format(closes, 'EEE d, HH:mm', { locale: es })} UTC)`;
                    }
                }

                return (
                    <div
                        key={segment.id}
                        className="absolute top-1/2 -translate-y-1/2 h-5 bg-red-400/30 dark:bg-red-600/30 rounded border border-red-500/40 dark:border-red-700/40 transition-all duration-150 hover:bg-red-400/50 dark:hover:bg-red-600/50 hover:border-red-500/70 dark:hover:border-red-700/70 pointer-events-auto shadow-sm" // Aumentada altura, añadido borde, sombra y ajustado hover
                        style={{
                            left: `${Math.max(0, leftPercent)}%`, // Asegurar que no sea < 0
                            width: `${Math.min(widthPercent, 100 - Math.max(0, leftPercent))}%`, // Asegurar que no exceda el 100%
                            zIndex: 2 // Debajo del marcador principal (z-10) y encima del riel base (z-1)
                        }}
                        title={titleText} // Usar el titleText dinámico
                    />
                );
            })}
          </motion.div>
        </div>
      </div>

      {/* Indicador de Tiempo Relativo del Centro (Abajo Condicional) */}
      {showCenteredPreciseTime && centeredPreciseTime && isValid(centeredPreciseTime) && (
        <div className="text-center text-xs text-blue-600 dark:text-blue-400 mt-1 pb-1 pointer-events-none space-x-1.5"> {/* Añadido space-x */} 
           {/* Hora Precisa */}
           <span className="font-mono">{format(centeredPreciseTime, 'HH:mm:ss')}</span>
           <span className="text-muted-foreground/80 dark:text-muted-foreground/60">UTC</span>
           {/* Tiempo Relativo (entre paréntesis) */} 
           <span className="text-blue-600/90 dark:text-blue-400/90">
              ({formatRelativeTime(centeredPreciseTime, displayedTimeUtc)})
           </span>
        </div>
      )}

    </div>
  );
}

// ... (CSS para scrollbar-hide sigue siendo necesario en globals.css) ...

// Asegúrate de tener las clases CSS para ocultar scrollbar en globals.css:
/*
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;  
    scrollbar-width: none;  
}
*/ 