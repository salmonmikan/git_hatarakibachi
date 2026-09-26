export type AssetBinding = {
  fetch(request: Request): Promise<Response>;
};

export type WorkerEnv = {
  ASSETS: AssetBinding;
  IMG_ORIGIN?: string;
  IMG_KEY?: string;
  SANITY_PREVIEW_SECRET?: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
};
