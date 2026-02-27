import sgMail from '@sendgrid/mail'

import { logger } from '../utils/logger'

export class EmailService {
  private readonly apiKey: string

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY environment variable is required')
    }
    this.apiKey = apiKey
    sgMail.setApiKey(this.apiKey)
  }

  async send(params: {
    to: string
    subject: string
    templateId: string
    dynamicData: Record<string, unknown>
  }): Promise<void> {
    const { to, subject, templateId, dynamicData } = params

    try {
      await sgMail.send({
        to,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@worklient.com',
        subject,
        templateId,
        dynamicTemplateData: dynamicData,
      })

      logger.info({
        event: 'EMAIL_SENT',
        service: 'email',
        operation: 'send',
        metadata: {
          to,
          templateId,
        },
      })
    } catch (error) {
      logger.error({
        event: 'EMAIL_SEND_FAILED',
        service: 'email',
        operation: 'send',
        error,
        metadata: {
          to,
          templateId,
        },
      })
      throw error
    }
  }
}
