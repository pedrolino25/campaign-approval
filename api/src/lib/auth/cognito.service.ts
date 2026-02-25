import {
  AdminCreateUserCommand,
  AdminGetUserCommand,
  AuthFlowType,
  ChangePasswordCommand,
  CognitoIdentityProviderClient,
  CodeMismatchException,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ExpiredCodeException,
  ForgotPasswordCommand,
  InitiateAuthCommand,
  InvalidParameterException,
  InvalidPasswordException,
  MessageActionType,
  NotAuthorizedException,
  ResendConfirmationCodeCommand,
  SignUpCommand,
  UserNotConfirmedException,
  UserNotFoundException,
  UsernameExistsException,
} from '@aws-sdk/client-cognito-identity-provider'
import { randomBytes } from 'crypto'

import {
  BusinessRuleViolationError,
  ConflictError,
  InternalError,
  UnauthorizedError,
  ValidationError,
} from '../../models'
import { config } from '../utils/config'

export class CognitoService {
  private readonly client: CognitoIdentityProviderClient
  private readonly userPoolId: string
  private readonly clientId: string

  constructor() {
    this.client = new CognitoIdentityProviderClient({
      region: config.AWS_REGION,
    })
    this.userPoolId = config.COGNITO_USER_POOL_ID
    this.clientId = config.COGNITO_APP_CLIENT_ID
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

  async signUp(email: string, password: string): Promise<{ requiresEmailVerification: true }> {
    try {
      await this.client.send(
        new SignUpCommand({
          ClientId: this.clientId,
          Username: email,
          Password: password,
          UserAttributes: [
            {
              Name: 'email',
              Value: email,
            },
          ],
        })
      )

      return { requiresEmailVerification: true }
    } catch (error) {
      if (error instanceof UsernameExistsException) {
        throw new ConflictError('EMAIL_ALREADY_EXISTS')
      }
      if (error instanceof InvalidPasswordException) {
        throw new ValidationError('INVALID_PASSWORD')
      }
      if (error instanceof InvalidParameterException) {
        throw new ValidationError('INVALID_INPUT')
      }
      throw new InternalError('COGNITO_SIGNUP_FAILED')
    }
  }

  async confirmSignUp(
    email: string,
    code: string,
    password: string
  ): Promise<{
    idToken: string
    accessToken: string
    refreshToken: string
  }> {
    try {
      await this.client.send(
        new ConfirmSignUpCommand({
          ClientId: this.clientId,
          Username: email,
          ConfirmationCode: code,
        })
      )
    } catch (error) {
      if (error instanceof CodeMismatchException) {
        throw new ValidationError('INVALID_CODE')
      }
      if (error instanceof ExpiredCodeException) {
        throw new ValidationError('CODE_EXPIRED')
      }
      if (error instanceof UserNotFoundException) {
        throw new ValidationError('INVALID_CODE')
      }
      throw new InternalError('COGNITO_CONFIRM_FAILED')
    }

    // Immediately authenticate after confirmation
    const authResult = await this.login(email, password)
    return authResult
  }

  async login(
    email: string,
    password: string
  ): Promise<{
    idToken: string
    accessToken: string
    refreshToken: string
  }> {
    try {
      const response = await this.client.send(
        new InitiateAuthCommand({
          ClientId: this.clientId,
          AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
          AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
          },
        })
      )

      if (!response.AuthenticationResult) {
        throw new InternalError('COGNITO_LOGIN_FAILED')
      }

      const { IdToken, AccessToken, RefreshToken } = response.AuthenticationResult

      if (!IdToken || !AccessToken || !RefreshToken) {
        throw new InternalError('COGNITO_LOGIN_FAILED')
      }

      return {
        idToken: IdToken,
        accessToken: AccessToken,
        refreshToken: RefreshToken,
      }
    } catch (error) {
      if (error instanceof UserNotConfirmedException) {
        throw new BusinessRuleViolationError('EMAIL_NOT_VERIFIED')
      }
      if (
        error instanceof NotAuthorizedException ||
        error instanceof UserNotFoundException
      ) {
        throw new UnauthorizedError('INVALID_CREDENTIALS')
      }
      if (error instanceof ValidationError || error instanceof BusinessRuleViolationError || error instanceof UnauthorizedError) {
        throw error
      }
      throw new InternalError('COGNITO_LOGIN_FAILED')
    }
  }

  async resendConfirmation(email: string): Promise<void> {
    try {
      await this.client.send(
        new ResendConfirmationCodeCommand({
          ClientId: this.clientId,
          Username: email,
        })
      )
    } catch (error) {
      // Always return success to prevent account enumeration
      // Swallow UserNotFoundException and other errors
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      await this.client.send(
        new ForgotPasswordCommand({
          ClientId: this.clientId,
          Username: email,
        })
      )
    } catch (error) {
      // Always return success to prevent account enumeration
      // Swallow UserNotFoundException and other errors
    }
  }

  async confirmForgotPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<void> {
    try {
      await this.client.send(
        new ConfirmForgotPasswordCommand({
          ClientId: this.clientId,
          Username: email,
          ConfirmationCode: code,
          Password: newPassword,
        })
      )
    } catch (error) {
      if (error instanceof CodeMismatchException) {
        throw new ValidationError('INVALID_CODE')
      }
      if (error instanceof ExpiredCodeException) {
        throw new ValidationError('CODE_EXPIRED')
      }
      throw new InternalError('COGNITO_RESET_FAILED')
    }
  }

  async changePassword(
    accessToken: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      await this.client.send(
        new ChangePasswordCommand({
          AccessToken: accessToken,
          PreviousPassword: oldPassword,
          ProposedPassword: newPassword,
        })
      )
    } catch (error) {
      if (error instanceof NotAuthorizedException) {
        throw new ValidationError('INVALID_OLD_PASSWORD')
      }
      throw new InternalError('COGNITO_CHANGE_PASSWORD_FAILED')
    }
  }
}
