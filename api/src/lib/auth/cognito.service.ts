import {
  AdminCreateUserCommand,
  AdminGetUserCommand,
  AuthFlowType,
  ChangePasswordCommand,
  CodeMismatchException,
  CognitoIdentityProviderClient,
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
  UsernameExistsException,
  UserNotConfirmedException,
  UserNotFoundException,
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
import { logger } from '../utils/logger'

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
        throw new ValidationError('PASSWORD_DOES_NOT_MEET_REQUIREMENTS')
      }
      if (error instanceof InvalidParameterException) {
        const errorMessage = error.message || ''
        const errorName = error.name || 'InvalidParameterException'
        
        // Log the actual Cognito error for debugging
        logger.error({
          source: 'cognito',
          event: 'SIGNUP_INVALID_PARAMETER',
          metadata: {
            email,
            emailLength: email.length,
            emailBytes: Buffer.from(email).toString('hex'),
            cognitoErrorName: errorName,
            cognitoErrorMessage: errorMessage,
            cognitoErrorCode: error.$metadata?.httpStatusCode,
            cognitoRequestId: error.$metadata?.requestId,
            fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
          },
        })
        
        if (errorMessage.includes('email') || errorMessage.includes('Email')) {
          throw new ValidationError('INVALID_EMAIL_FORMAT')
        }
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
        throw new ValidationError('VERIFICATION_CODE_INCORRECT')
      }
      if (error instanceof ExpiredCodeException) {
        throw new ValidationError('VERIFICATION_CODE_EXPIRED')
      }
      if (error instanceof UserNotFoundException) {
        throw new ValidationError('ACCOUNT_NOT_FOUND')
      }
      if (error instanceof InvalidParameterException) {
        throw new ValidationError('INVALID_VERIFICATION_CODE_FORMAT')
      }
      throw new InternalError('COGNITO_CONFIRM_FAILED')
    }

    // Immediately authenticate after confirmation
    try {
      const authResult = await this.login(email, password)
      return authResult
    } catch (loginError) {
      // If login fails after confirmation, it might be a password issue
      if (loginError instanceof UnauthorizedError) {
        throw new UnauthorizedError('INVALID_CREDENTIALS_AFTER_VERIFICATION')
      }
      throw loginError
    }
  }

  private handleLoginError(error: unknown): never {
    if (error instanceof UserNotConfirmedException) {
      throw new BusinessRuleViolationError('EMAIL_NOT_VERIFIED')
    }
    if (error instanceof NotAuthorizedException) {
      throw new UnauthorizedError('INVALID_CREDENTIALS')
    }
    if (error instanceof UserNotFoundException) {
      throw new UnauthorizedError('INVALID_CREDENTIALS')
    }
    if (
      error instanceof ValidationError ||
      error instanceof BusinessRuleViolationError ||
      error instanceof UnauthorizedError
    ) {
      throw error
    }
    throw new InternalError('COGNITO_LOGIN_FAILED')
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
      this.handleLoginError(error)
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
        throw new ValidationError('RESET_CODE_INCORRECT')
      }
      if (error instanceof ExpiredCodeException) {
        throw new ValidationError('RESET_CODE_EXPIRED')
      }
      if (error instanceof InvalidPasswordException) {
        throw new ValidationError('PASSWORD_DOES_NOT_MEET_REQUIREMENTS')
      }
      if (error instanceof UserNotFoundException) {
        throw new ValidationError('ACCOUNT_NOT_FOUND')
      }
      if (error instanceof InvalidParameterException) {
        throw new ValidationError('INVALID_RESET_CODE_FORMAT')
      }
      throw new InternalError('COGNITO_RESET_FAILED')
    }
  }

  async refreshAccessToken(
    refreshToken: string
  ): Promise<{ accessToken: string; idToken: string }> {
    try {
      const response = await this.client.send(
        new InitiateAuthCommand({
          ClientId: this.clientId,
          AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
          AuthParameters: {
            REFRESH_TOKEN: refreshToken,
          },
        })
      )

      if (!response.AuthenticationResult) {
        throw new InternalError('COGNITO_REFRESH_FAILED')
      }

      const { IdToken, AccessToken } = response.AuthenticationResult

      if (!IdToken || !AccessToken) {
        throw new InternalError('COGNITO_REFRESH_FAILED')
      }

      return {
        accessToken: AccessToken,
        idToken: IdToken,
      }
    } catch (error) {
      if (error instanceof NotAuthorizedException) {
        throw new UnauthorizedError('INVALID_REFRESH_TOKEN')
      }
      if (error instanceof ValidationError || error instanceof UnauthorizedError || error instanceof InternalError) {
        throw error
      }
      throw new InternalError('COGNITO_REFRESH_FAILED')
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
        throw new ValidationError('CURRENT_PASSWORD_INCORRECT')
      }
      if (error instanceof InvalidPasswordException) {
        const errorMessage = error.message || ''
        if (errorMessage.includes('previous') || errorMessage.includes('same')) {
          throw new ValidationError('NEW_PASSWORD_MUST_BE_DIFFERENT')
        }
        throw new ValidationError('PASSWORD_DOES_NOT_MEET_REQUIREMENTS')
      }
      if (error instanceof InvalidParameterException) {
        throw new ValidationError('INVALID_PASSWORD_FORMAT')
      }
      throw new InternalError('COGNITO_CHANGE_PASSWORD_FAILED')
    }
  }
}
