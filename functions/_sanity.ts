export type SanityDatasetEnv = {
  SANITY_DATASET?: string
}

export function getSanityDataset(env: SanityDatasetEnv, hostname: string) {
  if (env.SANITY_DATASET === 'staging' || env.SANITY_DATASET === 'production') {
    return env.SANITY_DATASET
  }

  if (
    hostname === 'staging.hatarakibachi.com' ||
    hostname === '127.0.0.1' ||
    hostname === 'localhost'
  ) {
    return 'staging'
  }

  if (hostname === 'hatarakibachi.com') {
    return 'production'
  }

  return undefined
}
