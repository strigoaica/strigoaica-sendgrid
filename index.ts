'use strict'

import * as fs from 'fs'

import * as Agathias from 'agathias'
import * as sendgridMail from '@sendgrid/mail'

import { Strategy } from 'strigoaica-strategy'

class Sendgrid implements Strategy {
  templatesPath: string
  type: string

  logger

  constructor (options) {
    this.templatesPath = options.templatesPath
    this.type = 'sendgrid'

    this.logger = Agathias.getChild(this.type)

    sendgridMail.setApiKey(options.apiKey)
  }

  async send (templateId, data) {
    this.logger.debug({ templateId, data })

    if (data.from === undefined || data.to === undefined) {
      return Promise.reject(new Error('Missing parameters'))
    }

    const recipients = Array.isArray(data.to) ? data.to : [data.to]

    let mailOptions

    // TODO: Better way to distinguish between local & remote templates
    if (templateId.startsWith('d-')) {
      mailOptions = { templateId }
    } else {
      mailOptions = this.loadLocalTemplateOptions(templateId)
    }

    Object.assign(mailOptions,  {
      from: data.from,
      to: recipients
    })

    /**
     * Add dynamic values if they exist
     */
    if (data.payload) {
      Object.assign(mailOptions, {
        dynamic_template_data: data.payload
      })
    }

    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug({ mailOptions })
      return Promise.resolve(mailOptions)
    }

    return new Promise((resolve, reject) => sendgridMail
      .send(mailOptions)
      .then((res) => resolve(res))
      .catch((err) => reject(err)))
  }

  private loadLocalTemplateOptions (templateId) {
    let rawTemplate
    try {
      rawTemplate = fs.readFileSync(
        `${this.templatesPath}/${templateId}.txt`,
        {
          encoding: 'utf-8'
        }
      )
    } catch (error) {
      return Promise.reject(error)
    }

    const meta:{[key: string]:string} = Strategy.extractMergeValueMeta(rawTemplate)

    return {
      subject: meta.subject,
      html: rawTemplate
    }
  }
}

module.exports = Sendgrid
