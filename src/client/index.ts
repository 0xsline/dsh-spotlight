import { mountSpotlight } from '../spotlight/mount.ts'

/** DSH Web client contribution loaded through the official client channel. */
export default {
  name: 'dsh-spotlight-client',
  apply(): () => void {
    return mountSpotlight(document, window)
  },
}
