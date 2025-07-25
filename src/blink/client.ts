import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: 'skillbridge-employee-networking-app-waa198i3',
  authRequired: true
})

export default blink