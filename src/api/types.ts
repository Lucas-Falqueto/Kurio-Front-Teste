export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface NFT {
  id: string;
  title: string;
  description: string;
  price: string;
  image: string;
  edition?: string;
  available: number;
  creator: string;
  category: 'art' | 'gaming' | 'collectibles';
  network: 'Ethereum' | 'Polygon' | 'Solana';
}

export interface CartItem {
  nftId: string;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: string;
  discount: string;
  fee: string;
  total: string;
  coupon?: string;
}

export interface Order {
  id: string;
  idempotencyKey: string;
  userId: string;
  items: OrderItem[];
  total: string;
  subtotal?: string;
  fee?: string;
  discount?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  createdAt: string;
  transactionHash?: string;
  walletAddress?: string;
  network?: string;
  walletType?: string;
  paymentMethod?: string;
  collectorDetails?: CollectorDetails;
}

export interface OrderItem extends CartItem {
  title?: string;
  image?: string;
  price: string;
  lineTotal?: string;
}

export interface CollectorDetails {
  displayName?: string;
  username?: string;
  profileName?: string;
  secondaryWallet?: string;
  settlementCode?: string;
  email?: string;
  ensName?: string;
  useAnotherWallet?: boolean;
  note?: string;
}

export interface Wallet {
  id: string;
  address: string;
  label: string;
  type: string;
  isPrimary: boolean;
}
