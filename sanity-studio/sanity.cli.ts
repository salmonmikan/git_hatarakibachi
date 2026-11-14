import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'pz9uficf',
    dataset: process.env.SANITY_STUDIO_DEPLOY_ENV === 'staging' ? 'staging' : 'production'
  },
  deployment: {
    appId: process.env.SANITY_STUDIO_APP_ID,
    /**
     * Keep the deployed Studio on the versions tested from package-lock.json.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: false,
  }
})
