const MAX_ASSET_SIZE_BYTES = 5 * 1024 * 1024
const SANITY_API_VERSION = '2025-01-01'

async function fetchAssetSize(assetRef: string, getClient: any) {
  const client = getClient({apiVersion: SANITY_API_VERSION})
  return client.fetch(`*[_id == $id][0].size`, {id: assetRef})
}

export async function validateAssetMaxSize(
  value: any,
  context: any,
  label = 'ファイル',
  maxBytes = MAX_ASSET_SIZE_BYTES,
) {
  if (!value?.asset?._ref) return true

  const size = await fetchAssetSize(value.asset._ref, context.getClient)
  if (typeof size === 'number' && size > maxBytes) {
    return `${label}は5MB以下にしてください。`
  }

  return true
}

export async function validateAssetArrayMaxSize(
  values: any[] | undefined,
  context: any,
  label = 'ファイル',
  maxBytes = MAX_ASSET_SIZE_BYTES,
) {
  if (!Array.isArray(values)) return true

  for (const value of values) {
    const validationResult = await validateAssetMaxSize(value, context, label, maxBytes)
    if (validationResult !== true) return validationResult
  }

  return true
}
