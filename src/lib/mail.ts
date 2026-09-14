import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'

export type MailSoort = 'events' | 'ingekomen'

export interface OpgehaaldeMail {
  uid: number
  van: string
  onderwerp: string
  datum: string // ISO
  tekst: string // platte tekst body, ingekort voor de AI-call
}

function credentials(soort: MailSoort) {
  const host = process.env.IMAP_HOST
  const port = Number(process.env.IMAP_PORT || 993)
  const user = soort === 'events' ? process.env.IMAP_EVENTS_USER : process.env.IMAP_INGEKOMEN_USER
  const pass = soort === 'events' ? process.env.IMAP_EVENTS_PASSWORD : process.env.IMAP_INGEKOMEN_PASSWORD
  if (!host || !user || !pass) {
    throw new Error(`IMAP-instellingen ontbreken voor "${soort}" (host/user/password env vars)`)
  }
  return { host, port, user, pass }
}

async function maakClient(soort: MailSoort) {
  const { host, port, user, pass } = credentials(soort)
  const client = new ImapFlow({ host, port, secure: true, auth: { user, pass }, logger: false })
  await client.connect()
  return client
}

// Haalt alle ongelezen mail op uit INBOX. Markeert NIETS als gelezen —
// dat gebeurt pas expliciet via markeerAlsGelezen(), na een keuze van de gebruiker.
export async function haalOngelezenMails(soort: MailSoort): Promise<OpgehaaldeMail[]> {
  const client = await maakClient(soort)
  const resultaten: OpgehaaldeMail[] = []
  try {
    const lock = await client.getMailboxLock('INBOX')
    try {
      for await (const msg of client.fetch({ seen: false }, { source: true, uid: true })) {
        try {
          const parsed = await simpleParser(msg.source)
          resultaten.push({
            uid: msg.uid,
            van: parsed.from?.text || '(onbekend)',
            onderwerp: parsed.subject || '(geen onderwerp)',
            datum: (parsed.date || new Date()).toISOString(),
            tekst: (parsed.text || '').toString().slice(0, 4000),
          })
        } catch (parseErr) {
          console.error('Mail parse fout, overgeslagen:', parseErr)
        }
      }
    } finally {
      lock.release()
    }
  } finally {
    await client.logout()
  }
  return resultaten
}

export async function markeerAlsGelezen(soort: MailSoort, uid: number): Promise<void> {
  const client = await maakClient(soort)
  try {
    const lock = await client.getMailboxLock('INBOX')
    try {
      await client.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true })
    } finally {
      lock.release()
    }
  } finally {
    await client.logout()
  }
}
