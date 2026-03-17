import { Metadata } from 'next'
import DownloadsClient from './DownloadsClient'

export const metadata: Metadata = { title: 'Downloads' }

export default function DownloadsPage() {
  return <DownloadsClient />
}
