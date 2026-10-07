import type { NFT, User, Cart, Order, Wallet } from '../api/types';

const DB_KEY = 'nft_marketplace_db';

export interface Database {
  users: User[];
  passwords: Record<string, string>; // userId -> password
  nfts: NFT[];
  favorites: Record<string, string[]>; // userId -> nftId[]
  carts: Record<string, Cart>; // userId or sessionId -> Cart
  orders: Order[];
  wallets: Record<string, Wallet[]>; // userId -> Wallet[]
}

const CATEGORIES = ['art', 'gaming', 'collectibles'] as const;
const NETWORKS = ['Ethereum', 'Polygon', 'Solana'] as const;
const FIGMA_ASSET_ROOT = 'https://www.figma.com/api/mcp/asset/9b7776f8-cb05-4953-91c7-941669d081c3';
const FEATURED_NFTS = [
  { title: 'Emerald Ape #042', price: '1.19', image: `${FIGMA_ASSET_ROOT}/8f387.png`, edition: '1/50' },
  { title: 'Sage Nomad #009', price: '1.69', image: `${FIGMA_ASSET_ROOT}/83794.png` },
  { title: 'Neon Vessel #552', price: '1.99', image: `${FIGMA_ASSET_ROOT}/9add2.png` },
  { title: 'Cosmic Bloom #118', price: '1.29', image: `${FIGMA_ASSET_ROOT}/83794.png` },
  { title: 'Violet Nomad #314', price: '1.39', image: `${FIGMA_ASSET_ROOT}/83794.png`, edition: '1/1' },
  { title: 'Ivory Baron #088', price: '1.79', image: `${FIGMA_ASSET_ROOT}/9add2.png`, edition: '1/10' },
  { title: 'Golden Beat #207', price: '0.99', image: `${FIGMA_ASSET_ROOT}/b7cfc.png`, edition: '1/50' },
  { title: 'Golden Beat #126', price: '0.59', image: `${FIGMA_ASSET_ROOT}/b7cfc.png` },
  { title: 'Golden Signal #160', price: '0.39', image: `${FIGMA_ASSET_ROOT}/b7cfc.png` },
];

function generateNFTs(): NFT[] {
  return Array.from({ length: 50 }, (_, i) => ({
    id: `nft-${i + 1}`,
    title: FEATURED_NFTS[i]?.title ?? `Cosmic Artifact #${i + 1}`,
    description: 'Uma obra digital selecionada da Kurio, criada para colecionadores que valorizam arte e cultura digital.',
    price: FEATURED_NFTS[i]?.price ?? (Math.random() * 5 + 0.1).toFixed(4),
    image: FEATURED_NFTS[i]?.image ?? `https://picsum.photos/seed/nft${i+1}/600/600`,
    available: i < FEATURED_NFTS.length ? 4 + (i % 5) : Math.floor(Math.random() * 10) + 1,
    creator: i % 2 === 0 ? 'u1' : 'u2',
    category: CATEGORIES[i % 3],
    network: NETWORKS[i % 3]
  }));
}

const defaultDB: Database = {
  users: [
    { id: 'u1', name: 'John Doe', email: 'john@example.com', avatar: 'https://i.pravatar.cc/150?u=u1' },
    { id: 'u2', name: 'Jane Smith', email: 'jane@example.com', avatar: 'https://i.pravatar.cc/150?u=u2' }
  ],
  passwords: {
    'u1': 'password123',
    'u2': 'password123'
  },
  nfts: generateNFTs(),
  favorites: {
    'u1': ['nft-1', 'nft-2']
  },
  carts: {},
  orders: [],
  wallets: {
    'u1': [
      { id: 'w1', address: '0x123...abc', label: 'Metamask', type: 'MetaMask', isPrimary: true }
    ]
  }
};

export function getDB(): Database {
  const data = localStorage.getItem(DB_KEY);
  if (!data) return defaultDB;

  const db = JSON.parse(data) as Database;
  let migrated = false;
  db.nfts = db.nfts.map((nft, index) => {
    const featured = FEATURED_NFTS.find((item) => item.title === nft.title) ?? FEATURED_NFTS[index];
    let updatedNFT = nft;
    if (/^Cosmic Artifact #\d+$/.test(nft.title)) {
      migrated = true;
      updatedNFT = { ...nft, ...featured, description: 'Uma obra digital selecionada da Kurio, criada para colecionadores que valorizam arte e cultura digital.' };
    }
    if (!updatedNFT.edition && featured?.edition) {
      migrated = true;
      updatedNFT = { ...updatedNFT, edition: featured.edition };
    }
    if (!updatedNFT.network) {
      migrated = true;
      updatedNFT = { ...updatedNFT, network: NETWORKS[index % NETWORKS.length] };
    }
    return updatedNFT;
  });
  if (migrated) saveDB(db);
  return db;
}

export function saveDB(data: Database) {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
}

// Init
if (!localStorage.getItem(DB_KEY)) {
  saveDB(defaultDB);
}
