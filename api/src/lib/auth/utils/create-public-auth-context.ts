import { ActorType, type AuthContext } from '../../../models'

export function createPublicAuthContext(): AuthContext {
  return {
    userId: '',
    email: '',
    rawToken: '',
    actor: {
      type: ActorType.Internal,
      userId: '',
      organizationId: '',
      role: 'MEMBER',
      onboardingCompleted: true,
    },
  }
}
