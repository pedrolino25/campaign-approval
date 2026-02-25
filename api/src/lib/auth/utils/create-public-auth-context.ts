import { ActorType, type AuthContext } from '../../../models'

export function createPublicAuthContext(): AuthContext {
  return {
    cognitoSub: '',
    email: '',
    actor: {
      type: ActorType.Internal,
      userId: '',
      organizationId: '',
      role: 'MEMBER',
      onboardingCompleted: true,
    },
  }
}
