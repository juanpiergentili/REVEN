// Catálogo de vehículos comercializados en Argentina
// Basado en datos reales de operaciones + enriquecido

export interface VehicleVersion {
  nombre: string;
  combustible?: string;
  transmision?: string;
}

export interface VehicleModel {
  nombre: string;
  segmento: string;
  versiones: VehicleVersion[];
}

export interface VehicleBrand {
  nombre: string;
  modelos: VehicleModel[];
}

export type BodyType = 'Sedán' | 'Hatchback' | 'SUV' | 'Pick Up' | 'Pick Up Liviana' | 'Familiar' | 'Deportivo' | 'Utilitario' | 'Minivan/Minibus' | 'Coupé' | 'Convertible';
export type Transmission = 'MANUAL' | 'AUTOMATICO';
export type FuelType = 'NAFTA' | 'DIESEL' | 'GNC' | 'HIBRIDO' | 'ELECTRICO';

export const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: 'Sedán', label: 'Sedán' },
  { value: 'Hatchback', label: 'Hatchback' },
  { value: 'SUV', label: 'SUV / Crossover' },
  { value: 'Pick Up', label: 'Pick Up' },
  { value: 'Pick Up Liviana', label: 'Pick Up Liviana' },
  { value: 'Familiar', label: 'Familiar / Rural' },
  { value: 'Deportivo', label: 'Deportivo / Coupé' },
  { value: 'Utilitario', label: 'Utilitario / Furgón' },
  { value: 'Minivan/Minibus', label: 'Minivan / Minibus' },
];

export const FUEL_TYPES: { value: FuelType; label: string }[] = [
  { value: 'NAFTA', label: 'Nafta' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'GNC', label: 'GNC' },
  { value: 'HIBRIDO', label: 'Híbrido' },
  { value: 'ELECTRICO', label: 'Eléctrico' },
];

export const TRANSMISSIONS: { value: Transmission; label: string }[] = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'AUTOMATICO', label: 'Automática' },
];

export const KM_RANGES = [
  { value: '0-10000', label: '0 - 10.000 km', min: 0, max: 10000 },
  { value: '10000-50000', label: '10.000 - 50.000 km', min: 10000, max: 50000 },
  { value: '50000-100000', label: '50.000 - 100.000 km', min: 50000, max: 100000 },
  { value: '100000-plus', label: 'Más de 100.000 km', min: 100000, max: 999999 },
];

export const COLORS = [
  { value: 'blanco', label: 'Blanco', hex: '#FFFFFF' },
  { value: 'negro', label: 'Negro', hex: '#1a1a1a' },
  { value: 'gris', label: 'Gris', hex: '#808080' },
  { value: 'rojo', label: 'Rojo', hex: '#DC2626' },
  { value: 'azul', label: 'Azul', hex: '#2563EB' },
  { value: 'bordo', label: 'Bordó', hex: '#7B1F3A' },
  { value: 'dorado', label: 'Dorado/Champagne', hex: '#D4A853' },
  { value: 'naranja', label: 'Naranja', hex: '#EA580C' },
  { value: 'celeste', label: 'Celeste', hex: '#38BDF8' },
  { value: 'marron', label: 'Marrón', hex: '#78350F' },
  { value: 'verde', label: 'Verde', hex: '#16A34A' },
  { value: 'beige', label: 'Beige', hex: '#D2B48C' },
];

export const VEHICLE_CATALOG: VehicleBrand[] = [
  {
    nombre: 'Toyota',
    modelos: [
      { nombre: 'Hilux', segmento: 'Pick Up', versiones: [
        { nombre: '2.4 TDI 4X2 DC DX', combustible: 'DIESEL', transmision: 'MANUAL' },
        { nombre: '2.8 TDI 4X2 DC SRV AT6', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
        { nombre: '2.8 TDI 4X2 DC SRX AT6', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
        { nombre: '2.8 TDI 4X4 DC SRX AT6', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
        { nombre: '2.8 TDI 4X4 DC SR', combustible: 'DIESEL', transmision: 'MANUAL' },
        { nombre: '2.8 TDI 4X2 SRV', combustible: 'DIESEL', transmision: 'MANUAL' },
        { nombre: '2.8 TDI 4X2 SRX AT6', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
        { nombre: '3.0 TDI 4X4 DC SRV Cuero', combustible: 'DIESEL', transmision: 'MANUAL' },
      ]},
      { nombre: 'SW4', segmento: 'SUV', versiones: [
        { nombre: 'TDI SRV Cuero AT', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
        { nombre: 'TDI SRX AT', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
        { nombre: 'TDI SR AT', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
        { nombre: '2.8 TDI 4X4 GR-S AT6', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
        { nombre: '2.7 VVTI SRV 7AS', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Corolla', segmento: 'Sedán', versiones: [
        { nombre: '1.8 XLI', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.8 XEI', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '2.0 XEI CVT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '2.0 SE-G CVT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.8 SE-G CVT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Corolla Cross', segmento: 'SUV', versiones: [
        { nombre: '2.0 XLI CVT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.8 SEG HV E-CVT', combustible: 'HIBRIDO', transmision: 'AUTOMATICO' },
        { nombre: '2.0 XEI CVT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Yaris', segmento: 'Hatchback', versiones: [
        { nombre: '1.5 S CVT 5P', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.5 XLS CVT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Etios', segmento: 'Hatchback', versiones: [
        { nombre: '1.5 XLS AT4 5P', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.5 X 5P', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'Land Cruiser', segmento: 'SUV', versiones: [
        { nombre: '4.5 D4-D 200 VX AT', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
      ]},
    ],
  },
  {
    nombre: 'Volkswagen',
    modelos: [
      { nombre: 'Amarok', segmento: 'Pick Up', versiones: [
        { nombre: '3.0 TD V6 258HP 4X4 DC Extreme AT', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
        { nombre: '3.0 TD V6 258HP 4X4 DC Highline AT', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
        { nombre: '3.0 TD V6 258HP 4X4 DC Comfortline AT', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
        { nombre: '2.0 TD 180HP 4X2 DC Highline AT', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
        { nombre: '2.0 TD 180HP 4X2 DC Highline', combustible: 'DIESEL', transmision: 'MANUAL' },
        { nombre: '2.0 TD 180HP 4X2 DC Starline', combustible: 'DIESEL', transmision: 'MANUAL' },
        { nombre: '2.0 TD 140HP 4X2 DC Starline', combustible: 'DIESEL', transmision: 'MANUAL' },
      ]},
      { nombre: 'Taos', segmento: 'SUV', versiones: [
        { nombre: '1.4 250 TSI Comfortline Tiptronic', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.4 250 TSI Highline Tiptronic', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.4 250 TSI Highline Bi Tono Tiptronic', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'T-Cross', segmento: 'SUV', versiones: [
        { nombre: '1.6 Trendline', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.6 Comfortline', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.0 TSI Highline AT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Nivus', segmento: 'SUV', versiones: [
        { nombre: '200 TSI Comfortline AT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '200 TSI Highline AT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Tiguan', segmento: 'SUV', versiones: [
        { nombre: '2.0 T Allspace Highline AT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.4 T 250 TSI Allspace Trendline AT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '2.0 TDI Exclusive Tiptronic', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Polo', segmento: 'Hatchback', versiones: [
        { nombre: '1.6 Highline 5P', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.6 MSI Trend', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.0 170 TSI Highline Tiptronic', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.6 MSI Track', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'Vento', segmento: 'Sedán', versiones: [
        { nombre: '2.5 170HP Advance Plus Tiptronic', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '2.0 350TSI GLI DSG', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.4 TSI Comfortline DSG', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '2.0 8V Advance', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'Gol', segmento: 'Hatchback', versiones: [
        { nombre: '1.6 Trend 5P', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.6 Trend 3P', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'Golf', segmento: 'Hatchback', versiones: [
        { nombre: '1.6 VII FSI Trendline', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.4 TSI Highline DSG', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Suran', segmento: 'Familiar', versiones: [
        { nombre: '1.6 Trendline', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.6 Highline I-Motion', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Saveiro', segmento: 'Pick Up Liviana', versiones: [
        { nombre: '1.6 CS Trendline', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.6 AA PS', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.6 AA PS Safety', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'Fox', segmento: 'Hatchback', versiones: [
        { nombre: '1.6 Highline 3P', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'Bora', segmento: 'Sedán', versiones: [
        { nombre: '2.0 MPI Trendline', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'Scirocco', segmento: 'Deportivo', versiones: [
        { nombre: '2.0 TSI GTS DSG', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Tera', segmento: 'SUV', versiones: [
        { nombre: '1.0 170 TS Comfortline AT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
    ],
  },
  {
    nombre: 'Ford',
    modelos: [
      { nombre: 'Ranger', segmento: 'Pick Up', versiones: [
        { nombre: '3.2 TDI 4X4 DC Limited AT', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
        { nombre: '3.0 TD V6 DC 4X4 XLS AT', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
        { nombre: '2.2 TDI 4X2 DC XL', combustible: 'DIESEL', transmision: 'MANUAL' },
        { nombre: '2.2 TDI 4X4 SC XL', combustible: 'DIESEL', transmision: 'MANUAL' },
        { nombre: '3.2 TDI 4X2 DC XLT', combustible: 'DIESEL', transmision: 'MANUAL' },
        { nombre: '2.0 TDI 4X4 DC Raptor', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Maverick', segmento: 'Pick Up', versiones: [
        { nombre: '2.0 T 4X4 Lariat AT8', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '2.0 T 4X4 XLT AT8', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '2.5 T 4X4 Lariat Híbrida AT', combustible: 'HIBRIDO', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'F-150', segmento: 'Pick Up', versiones: [
        { nombre: '3.5 4X4 Raptor AT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '5.0 4X4 Lariat AT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Territory', segmento: 'SUV', versiones: [
        { nombre: '1.5 T SEL', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.5 T Titanium', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Kuga', segmento: 'SUV', versiones: [
        { nombre: '2.0 4X4 SEL AT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '2.5 4X2 SE Híbrida AT', combustible: 'HIBRIDO', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'EcoSport', segmento: 'SUV', versiones: [
        { nombre: '2.0 Titanium', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.5 Titanium AT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.6 Titanium', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'Fiesta', segmento: 'Hatchback', versiones: [
        { nombre: '1.6 SE KD 5P', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.6 Titanium Powershift KD 5P', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Mondeo', segmento: 'Sedán', versiones: [
        { nombre: '2.0 SEL Ecoboost AT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '2.0 Vignale Híbrido', combustible: 'HIBRIDO', transmision: 'AUTOMATICO' },
      ]},
    ],
  },
  {
    nombre: 'Fiat',
    modelos: [
      { nombre: 'Cronos', segmento: 'Sedán', versiones: [
        { nombre: '1.3 Drive', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.3 Drive Pack Plus', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.3 GSE Precision CVT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.3 Drive Low Attractive', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'Argo', segmento: 'Hatchback', versiones: [
        { nombre: '1.8 Precision', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.3 GSE Firefly Drive', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.3 GSE Drive Pack Conectividad', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'Pulse', segmento: 'SUV', versiones: [
        { nombre: '1.0 Impetus', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.0 T Drive', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Fastback', segmento: 'SUV', versiones: [
        { nombre: '1.3 T GSE AT6', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Strada', segmento: 'Pick Up Liviana', versiones: [
        { nombre: '1.3 DC Fire Fly Volcano CVT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.6 DC Adventure Locker', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'Toro', segmento: 'Pick Up Liviana', versiones: [
        { nombre: '2.0 TDI 4X4 Volcano AT', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
        { nombre: '2.0 TDI 4X4 Freedom AT', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
        { nombre: '1.3 T 4X2 Freedom AT6', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Titano', segmento: 'Pick Up', versiones: [
        { nombre: '2.2 TD AWD Freedom Plus AT8', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
        { nombre: '2.2 TD AWD Ranch AT8', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Mobi', segmento: 'Hatchback', versiones: [
        { nombre: '1.0 Fire Easy', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.0 Fire Trekking', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'Palio', segmento: 'Hatchback', versiones: [
        { nombre: '1.4 Attractive Top 5P', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: '500', segmento: 'Hatchback', versiones: [
        { nombre: '1.4 Fire Cult', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.4 Abarth Turismo 595', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: '600', segmento: 'SUV', versiones: [
        { nombre: '1.2 Hybrid EDCT', combustible: 'HIBRIDO', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Fiorino', segmento: 'Utilitario', versiones: [
        { nombre: '1.4 Evo Top', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.4 Endurance', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
    ],
  },
  {
    nombre: 'Jeep',
    modelos: [
      { nombre: 'Renegade', segmento: 'SUV', versiones: [
        { nombre: '1.8 4X2 Sport AT6', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.8 4X2 Longitude AT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.8 4X2 Sport', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.3 T 270 4X2 Sport AT6', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.3 T 270 4X4 Willys AT9', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Compass', segmento: 'SUV', versiones: [
        { nombre: '2.4 Longitude AT9 OE', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.3 T 270 Sport AT6', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.3 T 270 Serie-S AT6', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '2.4 Longitude AT6 4X2', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Gladiator', segmento: 'Pick Up', versiones: [
        { nombre: '3.6 V6 4X4 Overland AT8', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Grand Cherokee', segmento: 'SUV', versiones: [
        { nombre: '3.6 TC Limited', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
    ],
  },
  {
    nombre: 'Renault',
    modelos: [
      { nombre: 'Kardian', segmento: 'SUV', versiones: [
        { nombre: '1.6 Evolution', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.0 T Techno EDC', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Duster', segmento: 'SUV', versiones: [
        { nombre: '1.3 T 4X2 Iconic CVT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.6 4X2 Privilege', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.6 4X2 Expression', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'Captur', segmento: 'SUV', versiones: [
        { nombre: '2.0 Zen', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.6 Intens CVT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Stepway', segmento: 'Hatchback', versiones: [
        { nombre: '1.6 Intens CVT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.6 Intens', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.6 Zen', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'Sandero', segmento: 'Hatchback', versiones: [
        { nombre: '1.6 16V GT Line', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '2.0 16V RS Racing Spirit', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.6 16V Life', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.6 8V Pack', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'Logan', segmento: 'Sedán', versiones: [
        { nombre: '1.6 16V Privilege', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: 'II 1.6 16V Life', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'Kwid', segmento: 'Hatchback', versiones: [
        { nombre: '1.0 Outsider', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.0 Iconic BT', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'Kangoo', segmento: 'Utilitario', versiones: [
        { nombre: 'Express 1.5 DCI Confort 5AS', combustible: 'DIESEL', transmision: 'MANUAL' },
        { nombre: '1.6 Express Confort 1 PLC', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'Oroch', segmento: 'Pick Up Liviana', versiones: [
        { nombre: '1.6 Dynamique', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'Alaskan', segmento: 'Pick Up', versiones: [
        { nombre: '2.3 TDI 4X2 Intens', combustible: 'DIESEL', transmision: 'MANUAL' },
      ]},
      { nombre: 'Clio', segmento: 'Hatchback', versiones: [
        { nombre: 'Mio 1.2 5P Confort Plus', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: 'Mio 1.2 3P Confort', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'Sandero Stepway', segmento: 'Hatchback', versiones: [
        { nombre: '1.6 Rip Curl', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
    ],
  },
  {
    nombre: 'Peugeot',
    modelos: [
      { nombre: '208', segmento: 'Hatchback', versiones: [
        { nombre: '1.6 Allure AT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.6 Feline Tiptronic', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.6 Like Pack', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.0 T200 GT AT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.6 Active Tiptronic', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.5 Active 5P', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.5 Allure Touch 5P', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.2 Like', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.6 Allure NAV Tiptronic 5P', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: '308', segmento: 'Hatchback', versiones: [
        { nombre: '1.6 Allure', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.6 THP Allure Pack Tiptronic', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.6 HDI Feline', combustible: 'DIESEL', transmision: 'MANUAL' },
        { nombre: '1.6 Allure Pack', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.6 THP Feline Tiptronic', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.6 Allure NAV', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: '2008', segmento: 'SUV', versiones: [
        { nombre: '1.0 T200 GT CVT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.6 Allure', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.6 Feline', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.6 Crossway', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: '207', segmento: 'Hatchback', versiones: [
        { nombre: 'Compact 2.0 5P XT HDI', combustible: 'DIESEL', transmision: 'MANUAL' },
        { nombre: 'Compact 1.4 HDI 5P XS Allure', combustible: 'DIESEL', transmision: 'MANUAL' },
      ]},
      { nombre: 'Boxer', segmento: 'Utilitario', versiones: [
        { nombre: '2.2 HDI 140 L2H2', combustible: 'DIESEL', transmision: 'MANUAL' },
      ]},
    ],
  },
  {
    nombre: 'Chevrolet',
    modelos: [
      { nombre: 'Onix', segmento: 'Hatchback', versiones: [
        { nombre: '1.0 T Premier 5P', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.0 T LT 5P', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.4 LTZ 5P', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'Tracker', segmento: 'SUV', versiones: [
        { nombre: '1.2 T LT AT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.8 4X2 LTZ', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.8 4X2 LTZ Premier', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'S-10', segmento: 'Pick Up', versiones: [
        { nombre: '2.8 TD DC 4X4 WT AT', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
        { nombre: '2.8 TD DC 4X4 High Country AT', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Equinox', segmento: 'SUV', versiones: [
        { nombre: '1.5 T 4X2 LS AT6', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Prisma', segmento: 'Sedán', versiones: [
        { nombre: '1.4 LTZ', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'Spin', segmento: 'Familiar', versiones: [
        { nombre: '1.8 LTZ AT 7AS', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Classic', segmento: 'Sedán', versiones: [
        { nombre: '1.4 LS ABS AB 4P', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'Celta', segmento: 'Hatchback', versiones: [
        { nombre: '1.4 LT AB ABS 5P', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
    ],
  },
  {
    nombre: 'RAM',
    modelos: [
      { nombre: '1500', segmento: 'Pick Up', versiones: [
        { nombre: '5.7 DC 4X4 Laramie AT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: '2500', segmento: 'Pick Up', versiones: [
        { nombre: 'TDI DCAB 4X4 Laramie', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Rampage', segmento: 'Pick Up', versiones: [
        { nombre: '2.0 GME 4X4 Rebel AT9', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
    ],
  },
  {
    nombre: 'BMW',
    modelos: [
      { nombre: 'X1', segmento: 'SUV', versiones: [
        { nombre: '20i sDrive Sport', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'X2', segmento: 'SUV', versiones: [
        { nombre: '20i sDrive M Sport III', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'X3', segmento: 'SUV', versiones: [
        { nombre: '20d xDrive Executive', combustible: 'DIESEL', transmision: 'MANUAL' },
      ]},
      { nombre: 'X4', segmento: 'SUV', versiones: [
        { nombre: '20i xDrive Active', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: '320', segmento: 'Sedán', versiones: [
        { nombre: 'i Sedan Sportline', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: '118', segmento: 'Hatchback', versiones: [
        { nombre: 'i Active AT 5P', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
    ],
  },
  {
    nombre: 'Mercedes Benz',
    modelos: [
      { nombre: 'Clase C', segmento: 'Sedán', versiones: [
        { nombre: 'C 250 Avantgarde AUT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: 'C 200 Avantgarde AT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Clase A', segmento: 'Hatchback', versiones: [
        { nombre: 'A 200 Blueefficiency Urban', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: 'A 200 Sedan Progressive', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Vito', segmento: 'Utilitario', versiones: [
        { nombre: '111 CDI Furgón Plus AA', combustible: 'DIESEL', transmision: 'MANUAL' },
      ]},
    ],
  },
  {
    nombre: 'Audi',
    modelos: [
      { nombre: 'A1', segmento: 'Hatchback', versiones: [
        { nombre: '1.4 T Ambition S-Tronic', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'A3', segmento: 'Hatchback', versiones: [
        { nombre: '1.4 T Sportback', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '2.0 T Sportback S-Tronic', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.6 3P', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
    ],
  },
  {
    nombre: 'Citroën',
    modelos: [
      { nombre: 'C3', segmento: 'Hatchback', versiones: [
        { nombre: '1.6 VTI Feel Pack AT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.6 VTI Feel', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.5 Feel', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'C4 Cactus', segmento: 'SUV', versiones: [
        { nombre: '1.6 VTI Feel Pack AT6', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.6 VTI Feel Pack Plus BT', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'Aircross', segmento: 'SUV', versiones: [
        { nombre: '1.0 T200 Feel Pack', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'C3 Aircross', segmento: 'Familiar', versiones: [
        { nombre: '1.6 VTI Feel Pack', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'C4 Lounge', segmento: 'Sedán', versiones: [
        { nombre: '1.6 HDI Feel Pack', combustible: 'DIESEL', transmision: 'MANUAL' },
      ]},
    ],
  },
  {
    nombre: 'Honda',
    modelos: [
      { nombre: 'HR-V', segmento: 'SUV', versiones: [
        { nombre: '1.8 EX CVT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.8 LX CVT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'CR-V', segmento: 'SUV', versiones: [
        { nombre: '2.4 4X4 EXL AT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Fit', segmento: 'Hatchback', versiones: [
        { nombre: '1.4 LXL 5P', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
    ],
  },
  {
    nombre: 'Nissan',
    modelos: [
      { nombre: 'Kicks', segmento: 'SUV', versiones: [
        { nombre: '1.6 Advance CVT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Versa', segmento: 'Sedán', versiones: [
        { nombre: '1.6 Sense CVT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.6 Advance Pure Drive', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'March', segmento: 'Hatchback', versiones: [
        { nombre: '1.6 Active Pure Drive', combustible: 'NAFTA', transmision: 'MANUAL' },
        { nombre: '1.6 Advance Media-Tech AT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Note', segmento: 'Hatchback', versiones: [
        { nombre: '1.6 Exclusive Pure Drive CVT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Tiida', segmento: 'Hatchback', versiones: [
        { nombre: '1.8 Acenta 5P', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
    ],
  },
  {
    nombre: 'Hyundai',
    modelos: [
      { nombre: 'Tucson', segmento: 'SUV', versiones: [
        { nombre: '2.0 4X4 Premium AT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Grand Santa Fe', segmento: 'SUV', versiones: [
        { nombre: '2.2 CRDI GLS AT6 7P', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'H1', segmento: 'Minivan/Minibus', versiones: [
        { nombre: '2.5 CRDI VGT Full 12AS', combustible: 'DIESEL', transmision: 'MANUAL' },
      ]},
    ],
  },
  {
    nombre: 'KIA',
    modelos: [
      { nombre: 'Cerato', segmento: 'Hatchback', versiones: [
        { nombre: '2.0 SX AT 5P', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Rio', segmento: 'Hatchback', versiones: [
        { nombre: '1.6 SX 5P AT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
    ],
  },
  {
    nombre: 'DS Automobiles',
    modelos: [
      { nombre: 'DS7', segmento: 'SUV', versiones: [
        { nombre: '1.6 THP Crossback Performance Line', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.6 THP E-Tense 4X4 Bastille+', combustible: 'HIBRIDO', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'DS3', segmento: 'SUV', versiones: [
        { nombre: '1.2 T Crossback Rivoli Puretech AT8', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '1.2 T Pure Tech So Chic Cabrio', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
    ],
  },
  {
    nombre: 'MINI',
    modelos: [
      { nombre: 'Cooper', segmento: 'Hatchback', versiones: [
        { nombre: 'S Chili 5P', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: 'S Chili', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: 'Pepper 5P AT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Coupe', segmento: 'Deportivo', versiones: [
        { nombre: 'S', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
    ],
  },
  {
    nombre: 'GWM',
    modelos: [
      { nombre: 'Tank 300', segmento: 'SUV', versiones: [
        { nombre: '2.0T 4X4', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
      { nombre: 'Haval Jolion Pro', segmento: 'SUV', versiones: [
        { nombre: 'HEV Deluxe', combustible: 'HIBRIDO', transmision: 'AUTOMATICO' },
      ]},
    ],
  },
  {
    nombre: 'Chery',
    modelos: [
      { nombre: 'Tiggo 3', segmento: 'SUV', versiones: [
        { nombre: '1.6 4X2 Luxury', combustible: 'NAFTA', transmision: 'MANUAL' },
      ]},
      { nombre: 'Tiggo 4 Pro', segmento: 'SUV', versiones: [
        { nombre: '1.5 16V Luxury CVT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
    ],
  },
  {
    nombre: 'Changan',
    modelos: [
      { nombre: 'CS55 Plus', segmento: 'SUV', versiones: [
        { nombre: '1.5 HEV DHT', combustible: 'HIBRIDO', transmision: 'AUTOMATICO' },
      ]},
    ],
  },
  {
    nombre: 'BAIC',
    modelos: [
      { nombre: 'BJ30', segmento: 'SUV', versiones: [
        { nombre: '1.5 T 4X2 Hybrid DHT', combustible: 'HIBRIDO', transmision: 'AUTOMATICO' },
      ]},
    ],
  },
  {
    nombre: 'Porsche',
    modelos: [
      { nombre: 'Cayenne', segmento: 'SUV', versiones: [
        { nombre: '3.0 TD Tiptronic', combustible: 'DIESEL', transmision: 'AUTOMATICO' },
        { nombre: '3.6 V6 Tiptronic', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
    ],
  },
  {
    nombre: 'Dodge',
    modelos: [
      { nombre: 'Journey', segmento: 'SUV', versiones: [
        { nombre: '2.4 SXT Full', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
        { nombre: '2.7 RT', combustible: 'NAFTA', transmision: 'AUTOMATICO' },
      ]},
    ],
  },
];

// Helpers
export function getBrandNames(): string[] {
  return VEHICLE_CATALOG.map(b => b.nombre).sort();
}

export function getModelsByBrand(brandName: string): VehicleModel[] {
  const brand = VEHICLE_CATALOG.find(b => b.nombre.toLowerCase() === brandName.toLowerCase());
  return brand ? brand.modelos : [];
}

export function getVersionsByBrandAndModel(brandName: string, modelName: string): VehicleVersion[] {
  const models = getModelsByBrand(brandName);
  const model = models.find(m => m.nombre.toLowerCase() === modelName.toLowerCase());
  return model ? model.versiones : [];
}

export function getSegmentoByBrandAndModel(brandName: string, modelName: string): string | undefined {
  const models = getModelsByBrand(brandName);
  const model = models.find(m => m.nombre.toLowerCase() === modelName.toLowerCase());
  return model?.segmento;
}

// Generate year range (current year down to 2000)
export function getYearRange(): number[] {
  const currentYear = new Date().getFullYear() + 1; // include next year for 0km
  const years: number[] = [];
  for (let y = currentYear; y >= 2000; y--) {
    years.push(y);
  }
  return years;
}
