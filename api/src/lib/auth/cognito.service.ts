import {
  AdminCreateUserCommand,
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
  MessageActionType,
  UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider'
import { randomBytes } from 'crypto'

import { InternalError } from '../../models'
import { config } from '../utils/config'

export class CognitoService {
  private readonly client: CognitoIdentityProviderClient
  private readonly userPoolId: string

  constructor() {
    this.client = new CognitoIdentityProviderClient({
      region: config.AWS_REGION,
    })
    this.userPoolId = config.COGNITO_USER_POOL_ID
  }

  async userExistsByEmail(email: string): Promise<boolean> {
    try {
      await this.client.send(
        new AdminGetUserCommand({
          UserPoolId: this.userPoolId,
          Username: email,
        })
      )
      return true
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        return false
      }
      throw new InternalError(
        `Failed to check if Cognito user exists: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async createUserWithTemporaryPassword(email: string): Promise<void> {
    const temporaryPassword = this.generateStrongPassword()

    try {
      await this.client.send(
        new AdminCreateUserCommand({
          UserPoolId: this.userPoolId,
          Username: email,
          TemporaryPassword: temporaryPassword,
          UserAttributes: [
            {
              Name: 'email',
              Value: email,
            },
            {
              Name: 'email_verified',
              Value: 'true',
            },
          ],
          MessageAction: MessageActionType.SUPPRESS,
        })
      )
    } catch (error) {
      throw new InternalError(
        `Failed to create Cognito user: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private generateStrongPassword(): string {
    const bytes = randomBytes(32)
    const base64 = bytes.toString('base64')
    // Cognito requires passwords to have:
    // - At least 8 characters
    // - At least one uppercase letter
    // - At least one lowercase letter
    // - At least one number
    // - At least one special character
    const specialChars = '!@#$%^&*'
    const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)]
    const randomUpper = String.fromCharCode(65 + Math.floor(Math.random() * 26))
    const randomLower = String.fromCharCode(97 + Math.floor(Math.random() * 26))
    const randomDigit = Math.floor(Math.random() * 10).toString()
    // Combine: base64 (has alphanumeric) + special + ensure all requirements
    return `${base64}${randomSpecial}${randomUpper}${randomLower}${randomDigit}`
  }
}
