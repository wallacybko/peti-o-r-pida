export interface ClientData {
  name: string;
  nationality: string;
  civilStatus: string;
  profession: string;
  cpf: string;
  rg: string;
  rgIssuer: string;
  street: string;
  number: string;
  neighborhood: string;
  cep: string;
  city: string;
  state: string;
}

export interface BankData {
  name: string;
  cnpj: string;
  address: string;
  city: string;
  state: string;
  cep: string;
}

export interface ChargeItem {
  id: string;
  date: string;
  description: string;
  value: number;
  screenshot?: string; // Base64 image data
}

export interface OfficeData {
  name: string;
  address: string;
  cep: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  website: string;
  logoUrl?: string;
  oabNumbers?: string;
  secondaryAddress?: string;
}

export interface PetitionData {
  client: ClientData;
  bank: BankData;
  petitionType: PetitionType;
  chargeDescription: string;
  charges: ChargeItem[];
  moralDamage: number;
  wastedTimeDamage: number;
  dateOfPetition: string;
  chargeScreenshots: string[]; // Array of base64 images
}

export const DEFAULT_OFFICE: OfficeData = {
  name: 'SENA ADVOCACIA',
  address: 'Av. Fernando Pessoa Nº 1179, Japiim II',
  cep: '69076-100',
  city: 'Manaus',
  state: 'Amazonas',
  phone: 'OAB/AM 15.128 | OAB/CE 53112-A | OAB/RR 806-A',
  email: 'adv.danielsena@gmail.com',
  website: '@danielsena.adv',
  oabNumbers: 'OAB/AM 15.128 | OAB/CE 53112-A | OAB/RR 806-A',
  secondaryAddress: 'Rua João Diniz Nº 116 B, Centro - Manaquiri - Amazonas | CEP 69435-000',
};

export type PetitionType =
  | 'TARIFAS_INDEVIDAS' 
  | 'SEGURO_NAO_CONTRATADO' 
  | 'RMC_RCC' 
  | 'NEGATIVACAO_INDEVIDA';

export const PETITION_TYPE_LABELS: Record<PetitionType, string> = {
  TARIFAS_INDEVIDAS: 'Tarifas Indevidas',
  SEGURO_NAO_CONTRATADO: 'Seguro Não Contratado',
  RMC_RCC: 'RMC/RCC',
  NEGATIVACAO_INDEVIDA: 'Negativação Indevida',
};

export const BANKS: BankData[] = [
  {
    name: 'BANCO BRADESCO S/A',
    cnpj: '60.746.948/0001-12',
    address: 'Núcleo Cidade de Deus, s/nº, Vila Yara',
    city: 'Osasco',
    state: 'SP',
    cep: '06.029-900',
  },
  {
    name: 'ITAÚ UNIBANCO S/A',
    cnpj: '60.701.190/0001-04',
    address: 'Praça Alfredo Egydio de Souza Aranha, 100',
    city: 'São Paulo',
    state: 'SP',
    cep: '04344-902',
  },
  {
    name: 'BANCO DO BRASIL S/A',
    cnpj: '00.000.000/0001-91',
    address: 'SBS Quadra 1, Bloco G, Lote 32',
    city: 'Brasília',
    state: 'DF',
    cep: '70073-901',
  },
  {
    name: 'CAIXA ECONÔMICA FEDERAL',
    cnpj: '00.360.305/0001-04',
    address: 'SBS Quadra 4, Lote 3/4',
    city: 'Brasília',
    state: 'DF',
    cep: '70092-900',
  },
  {
    name: 'BANCO SANTANDER (BRASIL) S/A',
    cnpj: '90.400.888/0001-42',
    address: 'Avenida Presidente Juscelino Kubitschek, 2041',
    city: 'São Paulo',
    state: 'SP',
    cep: '04543-011',
  },
  {
    name: 'BANCO BMG S/A',
    cnpj: '61.186.680/0001-74',
    address: 'Avenida Álvares Cabral, 1707',
    city: 'Belo Horizonte',
    state: 'MG',
    cep: '30170-001',
  },
  {
    name: 'BANCO PAN S/A',
    cnpj: '59.285.411/0001-13',
    address: 'Avenida Paulista, 1374',
    city: 'São Paulo',
    state: 'SP',
    cep: '01310-916',
  },
  {
    name: 'BANCO C6 S/A',
    cnpj: '31.872.495/0001-72',
    address: 'Avenida Nove de Julho, 3186',
    city: 'São Paulo',
    state: 'SP',
    cep: '01406-000',
  },
];

export const CIVIL_STATUS_OPTIONS = [
  'Solteiro(a)',
  'Casado(a)',
  'Divorciado(a)',
  'Viúvo(a)',
  'União Estável',
];

export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];
