export type ConnectivityListener = () => void;

export interface ConnectivityAdapter {
  isOnline(): boolean;
  subscribe(listener: ConnectivityListener): () => void;
}
