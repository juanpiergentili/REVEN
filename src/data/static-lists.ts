export const PROVINCIAS_FALLBACK = [
  { id: '02', nombre: 'Ciudad Autónoma de Buenos Aires' },
  { id: '06', nombre: 'Buenos Aires' },
  { id: '10', nombre: 'Catamarca' },
  { id: '14', nombre: 'Córdoba' },
  { id: '18', nombre: 'Corrientes' },
  { id: '22', nombre: 'Chaco' },
  { id: '26', nombre: 'Chubut' },
  { id: '30', nombre: 'Entre Ríos' },
  { id: '34', nombre: 'Formosa' },
  { id: '38', nombre: 'Jujuy' },
  { id: '42', nombre: 'La Pampa' },
  { id: '46', nombre: 'La Rioja' },
  { id: '50', nombre: 'Mendoza' },
  { id: '54', nombre: 'Misiones' },
  { id: '58', nombre: 'Neuquén' },
  { id: '62', nombre: 'Río Negro' },
  { id: '66', nombre: 'Salta' },
  { id: '70', nombre: 'San Juan' },
  { id: '74', nombre: 'San Luis' },
  { id: '78', nombre: 'Santa Cruz' },
  { id: '82', nombre: 'Santa Fe' },
  { id: '86', nombre: 'Santiago del Estero' },
  { id: '90', nombre: 'Tucumán' },
  { id: '94', nombre: 'Tierra del Fuego' }
];

export const TOP_BRANDS = [
  'Alfa Romeo', 'Audi', 'BAIC', 'BMW', 'Chery', 'Chevrolet', 'Chrysler', 'Citroën', 
  'Dodge', 'DS', 'Fiat', 'Ford', 'Honda', 'Hyundai', 'Isuzu', 'Iveco', 
  'Jaguar', 'Jeep', 'Kia', 'Land Rover', 'Lexus', 'Maserati', 'Mazda', 
  'Mercedes-Benz', 'Mini', 'Mitsubishi', 'Nissan', 'Peugeot', 'Porsche', 'Ram', 
  'Renault', 'Smart', 'Subaru', 'Suzuki', 'Toyota', 'Volkswagen', 'Volvo'
].map((name, index) => ({ id: index + 1, name, slug: name.toLowerCase().replace(' ', '-') }));

export const MANUAL_MODELS: Record<string, string[]> = {
  'BAIC': ['D20', 'Senova', 'X25', 'X35', 'X55', 'X55 II', 'BJ40', 'BJ40 Plus', 'BJ30'],
  'Toyota': ['Hilux', 'Corolla', 'SW4', 'Etios', 'Yaris', 'Corolla Cross', 'Rav4', 'Prius', 'Camry', 'Land Cruiser'],
  'Volkswagen': ['Gol', 'Amarok', 'Vento', 'Polo', 'Virtus', 'T-Cross', 'Taos', 'Nivus', 'Golf', 'Tiguan', 'Voyage', 'Suran'],
  'Ford': ['Ranger', 'F-150', 'Ecosport', 'Fiesta', 'Focus', 'Ka', 'Territory', 'Kuga', 'Bronco Sport', 'Mustang'],
  'Fiat': ['Cronos', 'Toro', 'Mobi', 'Argo', 'Pulse', 'Fastback', 'Strada', 'Fiorino', 'Ducato', 'Uno'],
  'Chevrolet': ['S10', 'Cruze', 'Onix', 'Prisma', 'Tracker', 'Equinox', 'Trailblazer', 'Spin', 'Joy'],
  'Peugeot': ['208', '2008', '3008', '5008', 'Partner', 'Expert', 'Boxer', '308', '408'],
  'Renault': ['Alaskan', 'Oroch', 'Sandero', 'Stepway', 'Logan', 'Duster', 'Kwid', 'Master', 'Kangoo']
};
