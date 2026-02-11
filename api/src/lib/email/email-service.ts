import sgMail from '@sendgrid/mail'

import { logger } from '../logger'

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
        message: 'Email sent successfully',
        to,
        templateId,
      })
    } catch (error) {
      logger.error({
        message: 'Failed to send email',
        to,
        templateId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }
}
