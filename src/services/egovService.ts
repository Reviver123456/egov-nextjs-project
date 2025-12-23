
import { saveUser } from './userService'
import { pushNotification } from './notiService'

export async function loginWithEgov({ appId, mToken }: { appId: string; mToken: string }) {
  // TODO: replace with real eGov validate + deproc API
  const citizen = {
    userId: 'REAL_USER_ID',
    citizenId: 'REAL_CITIZEN_ID',
    firstName: 'FIRST_NAME',
    lastName: 'LAST_NAME',
  }

  await saveUser({ ...citizen, appId })
  await pushNotification({ appId, userId: citizen.userId, message: 'บันทึกสำเร็จ' })

  return { status: 'success', data: citizen }
}
