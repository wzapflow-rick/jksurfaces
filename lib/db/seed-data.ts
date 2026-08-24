import type { CommercialPriority } from "@/types"

export interface SeedProduct {
  sku: string
  name: string
  ean: string
  currentCost: number
  priceB2B: number
  priority: CommercialPriority
}

/**
 * Os 12 SKUs prioritarios fornecidos pela JK. Dados reais.
 * Nao criar ofertas, compradores ou vendas ficticias.
 */
export const SEED_PRODUCTS: SeedProduct[] = [
  {
    sku: "1877.C33",
    name: "Misturador de Mesa Bica Alta Polo Deca",
    ean: "7894200160885",
    currentCost: 400,
    priceB2B: 650,
    priority: "NORMAL",
  },
  {
    sku: "2271.C72",
    name: "Misturador Monocomando de Mesa P Cozinha Spin Deca Cromado",
    ean: "7894200214199",
    currentCost: 400,
    priceB2B: 700,
    priority: "NORMAL",
  },
  {
    sku: "1785.C",
    name: "Torneira de Mesa Touchless Bica Baixa para Lavatório Deca Cromado",
    ean: "7894203003189",
    currentCost: 1000,
    priceB2B: 1500,
    priority: "NORMAL",
  },
  {
    sku: "1176.C",
    name: "Torneira para Lavatório de Parede Embutida Decamatic Eco Automática",
    ean: "7894200180852",
    currentCost: 200,
    priceB2B: 350,
    priority: "NORMAL",
  },
  {
    sku: "1172.C.LNK",
    name: "Torneira Deca de Mesa com Fechamento Automático para Lavatório Decamatic Link Cromado",
    ean: "7894200132837",
    currentCost: 300,
    priceB2B: 550,
    priority: "NORMAL",
  },
  {
    sku: "1173.C",
    name: "Torneira de Mesa para Lavatório Mesa Automática Deca",
    ean: "7894200122548",
    currentCost: 200,
    priceB2B: 350,
    priority: "NORMAL",
  },
  {
    sku: "2289.CFD",
    name: "Misturador Monocomando de Mesa para Cozinha Deca Colore",
    ean: "7894203019463",
    currentCost: 1200,
    priceB2B: 1750,
    priority: "NORMAL",
  },
  {
    sku: "2280.C",
    name: "Misturador Monocomando para Cozinha de Mesa Gourmet Cromado Deca",
    ean: "7894200149613",
    currentCost: 2000,
    priceB2B: 2650,
    priority: "NORMAL",
  },
  {
    sku: "1877.C.DSC",
    name: "Misturador de Mesa Bica Alta para Lavatório Disco Deca",
    ean: "7894200747604",
    currentCost: 380,
    priceB2B: 720,
    priority: "NORMAL",
  },
  {
    sku: "1173.C.CONF",
    name: "Decamatic Eco Conforto Cromado",
    ean: "7894200176817",
    currentCost: 450,
    priceB2B: 750,
    priority: "NORMAL",
  },
  {
    sku: "1189.CFD",
    name: "Torneira de Mesa para Cozinha Deca Colore",
    ean: "7894203019340",
    currentCost: 1000,
    priceB2B: 1500,
    priority: "NORMAL",
  },
  {
    sku: "1180.C",
    name: "Torneira de Mesa com Sensor Bivolt para Lavatório Decalux",
    ean: "7894200107194",
    currentCost: 1800,
    priceB2B: 2200,
    priority: "NORMAL",
  },
]
