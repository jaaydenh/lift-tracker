export type AppLifecycleListener = () => void;

export interface AppLifecycleAdapter {
  isVisible(): boolean;
  subscribe(listener: AppLifecycleListener): () => void;
}
