export const ARG_BRANDS = [
  "AGRALE", "ALFA ROMEO", "AUDI", "BAIC", "BMW", "BYD", "CHANGAN", "CHERY", "CHEVROLET", 
  "CHRYSLER", "CITROEN", "DFSK", "DODGE", "DONGFENG", "DS AUTOMOBILES", "FAW", "FERRARI", 
  "FIAT", "FORD", "FORTHING", "FOTON", "GAC", "GEELY", "GREAT WALL", "HAVAL", "HONDA", 
  "HYUNDAI", "ISUZU", "JAC", "JAGUAR", "JEEP", "JETOUR", "JMC", "JMEV", "KAIYI", "KIA", 
  "KYC", "LAND ROVER", "LEXUS", "LIFAN", "LOTUS", "MASERATI", "MAXUS", "McLAREN", 
  "MERCEDES BENZ", "MG", "MINI COOPER", "MITSUBISHI", "NISSAN", "PEUGEOT", "PORSCHE", 
  "RAM", "RENAULT", "SHINERAY", "SKYWELL", "SMART", "SOUEAST", "SSANGYONG", "SUBARU", 
  "SUZUKI", "TOYOTA", "VOLKSWAGEN", "VOLVO", "ZANELLA"
];

export const ARG_PROVINCES = [
  { id: "02", name: "Capital Federal" },
  { id: "06", name: "Buenos Aires" },
  { id: "10", name: "Catamarca" },
  { id: "14", name: "Córdoba" },
  { id: "18", name: "Corrientes" },
  { id: "22", name: "Chaco" },
  { id: "26", name: "Chubut" },
  { id: "30", name: "Entre Ríos" },
  { id: "34", name: "Formosa" },
  { id: "38", name: "Jujuy" },
  { id: "42", name: "La Pampa" },
  { id: "46", name: "La Rioja" },
  { id: "50", name: "Mendoza" },
  { id: "54", name: "Misiones" },
  { id: "58", name: "Neuquén" },
  { id: "62", name: "Río Negro" },
  { id: "66", name: "Salta" },
  { id: "70", name: "San Juan" },
  { id: "74", name: "San Luis" },
  { id: "78", name: "Santa Cruz" },
  { id: "82", name: "Santa Fe" },
  { id: "86", name: "Santiago del Estero" },
  { id: "90", name: "Tucumán" },
  { id: "94", name: "Tierra del Fuego" }
];

export const TOP_CITIES: Record<string, { id: string; name: string }[]> = {
  "02": [{ id: "02001", name: "CABA" }],
  "06": [
    { id: "06001", name: "La Plata" }, { id: "06002", name: "Mar del Plata" }, 
    { id: "06003", name: "Bahía Blanca" }, { id: "06004", name: "Luján" },
    { id: "06005", name: "Pilar" }, { id: "06006", name: "Quilmes" },
    { id: "06007", name: "Tandil" }, { id: "06008", name: "Escobar" }
  ],
  "14": [
    { id: "14001", name: "Córdoba Capital" }, { id: "14002", name: "Villa Carlos Paz" },
    { id: "14003", name: "Río Cuarto" }, { id: "14004", name: "Villa María" }
  ],
  "82": [
    { id: "82001", name: "Rosario" }, { id: "82002", name: "Santa Fe Capital" },
    { id: "82003", name: "Rafaela" }, { id: "82004", name: "Venado Tuerto" }
  ],
  "50": [
    { id: "50001", name: "Mendoza Capital" }, { id: "50002", name: "San Rafael" },
    { id: "50003", name: "Godoy Cruz" }
  ]
};

export const EXPANDED_MODELS: Record<string, string[]> = {
  "BAIC": ["BJ30", "BJ40", "BJ60", "D20", "EX 260", "SENOVA", "X25", "X35", "X55", "X65"],
  "TOYOTA": ["COROLLA", "HILUX", "SW4", "ETIOS", "YARIS", "RAV4", "CAMRY"],
  "VOLKSWAGEN": ["GOL", "AMAROK", "VENTO", "POLO", "VIRTUS", "T-CROSS", "TAOS", "NIVUS"],
  // More models can be added here
};
